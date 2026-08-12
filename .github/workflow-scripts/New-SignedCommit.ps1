# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
    .SYNOPSIS
        Stages the working tree and creates a signed commit containing the staged changes on the current branch.

    .DESCRIPTION
        Every working tree change is staged via 'git add -A', which is the only modification that is made locally.
        The staged changes are then read from the Git index as raw bytes and the content of each change is read from
        the staged blob, so file names are never interpreted as commands and the content that is committed is always
        the content that was staged. The commit is created by GitHub via the GraphQL 'createCommitOnBranch' mutation,
        which signs it. Every value is sent as a structured GraphQL variable within a JSON request file, and the token
        is read from the 'GH_TOKEN' environment variable by the GitHub CLI rather than being passed on the command
        line.

        The remote branch is read exactly once and the staged changes are applied atop the commit that was read, so a
        commit created concurrently by another job is retained rather than reverted. The read commit is sent as
        'expectedHeadOid', so a branch update between the read and the mutation fails the mutation. The commit is
        never forced and a stale head is never retried, meaning such a conflict fails the run rather than silently
        overwriting the remote branch.

    .PARAMETER Message
        The headline of the commit message.

    .PARAMETER CreateBranchOnRemote
        Creates the branch on the remote at the local HEAD commit when the branch does not already exist. Without this
        switch, a branch that is missing from the remote fails the run.

#>

#Requires -Version 7.0

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrWhiteSpace()]
    [string]$Message,

    [switch]$CreateBranchOnRemote
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Decoding is strict, so any value that is not valid UTF-8 fails the commit instead of being silently corrupted.
$utf8 = [System.Text.UTF8Encoding]::new($false, $true)
$recordExpression = '^:(?<sourceMode>[0-7]{6}) (?<destinationMode>[0-7]{6}) (?<sourceObjectId>[0-9a-f]{40}|[0-9a-f]{64}) (?<destinationObjectId>[0-9a-f]{40}|[0-9a-f]{64}) (?<status>[A-Z][0-9]*)$'
$objectIdExpression = '^(?:[0-9a-f]{40}|[0-9a-f]{64})$'
$regularFileMode = '100644'
$branchQuery = 'query ($owner: String!, $name: String!, $qualifiedName: String!) { repository(owner: $owner, name: $name) { id ref(qualifiedName: $qualifiedName) { target { oid } } } }'
$createBranchMutation = 'mutation ($input: CreateRefInput!) { createRef(input: $input) { ref { name } } }'
$createCommitMutation = 'mutation ($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }'

function Format-Path
{
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    # JSON encoding prevents a hostile file name from forging workflow commands or log lines.
    return ConvertTo-Json -InputObject $Path -Compress
}

function ConvertFrom-Utf8Byte
{
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [byte[]]$Bytes
    )

    try
    {
        return $utf8.GetString($Bytes)
    }
    catch
    {
        throw 'Git returned a value that is not valid UTF-8.'
    }
}

function Invoke-GitBinary
{
    [OutputType([byte[]])]
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    # The arguments are passed as an argument vector and the output is read as bytes, so neither is ever parsed by a
    # shell or mangled by an encoding.
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = 'git'
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.UseShellExecute = $false
    $startInfo.WorkingDirectory = (Get-Location -PSProvider FileSystem).ProviderPath
    foreach ($argument in $Arguments)
    {
        $startInfo.ArgumentList.Add($argument)
    }

    $buffer = [System.IO.MemoryStream]::new()
    $process = [System.Diagnostics.Process]::Start($startInfo)
    try
    {
        $standardErrorTask = $process.StandardError.ReadToEndAsync()
        $process.StandardOutput.BaseStream.CopyTo($buffer)
        $process.WaitForExit()
        if ($process.ExitCode -ne 0)
        {
            throw "'git $($Arguments[0])' failed with exit code $($process.ExitCode). $($standardErrorTask.GetAwaiter().GetResult())"
        }
    }
    finally
    {
        $process.Dispose()
    }

    return , $buffer.ToArray()
}

function Get-GitText
{
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    return (ConvertFrom-Utf8Byte -Bytes (Invoke-GitBinary -Arguments $Arguments)).Trim()
}

function ConvertFrom-IndexRecord
{
    [OutputType([hashtable])]
    param(
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [byte[]]$Metadata,

        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [byte[]]$PathBytes
    )

    $path = ConvertFrom-Utf8Byte -Bytes $PathBytes
    if ($path -eq '')
    {
        throw 'The Git index contains a record with an empty path.'
    }

    $match = [regex]::Match((ConvertFrom-Utf8Byte -Bytes $Metadata), $recordExpression)
    if (-not $match.Success)
    {
        throw "The Git index record for $(Format-Path -Path $path) could not be parsed."
    }

    $status = $match.Groups['status'].Value
    $isDeletion = $status -eq 'D'
    if (-not $isDeletion -and $status -notin @('A', 'M'))
    {
        throw "The Git index record for $(Format-Path -Path $path) uses the unsupported change type '$status'."
    }

    # Anything other than a regular file, such as an executable file, a symbolic link, or a submodule, is rejected as
    # the commit API cannot represent it.
    $mode = if ($isDeletion) { $match.Groups['sourceMode'].Value } else { $match.Groups['destinationMode'].Value }
    if ($mode -ne $regularFileMode)
    {
        throw "The Git index record for $(Format-Path -Path $path) uses the unsupported file mode '$mode'."
    }

    if ($isDeletion)
    {
        return @{ ObjectId = $null; Path = $path }
    }

    $objectId = $match.Groups['destinationObjectId'].Value
    if ($objectId -match '^0+$')
    {
        throw "The Git index record for $(Format-Path -Path $path) has no staged object ID."
    }

    return @{ ObjectId = $objectId; Path = $path }
}

function Get-StagedChange
{
    [OutputType([System.Collections.Generic.List[hashtable]])]
    param(
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [byte[]]$IndexOutput
    )

    # The output is split on NUL, so NUL is the only byte that can terminate a field. Newlines, tabs, quotes, and shell
    # metacharacters within a path therefore remain data.
    $fields = [System.Collections.Generic.List[byte[]]]::new()
    $start = 0
    for ($index = 0; $index -lt $IndexOutput.Length; $index++)
    {
        if ($IndexOutput[$index] -ne 0)
        {
            continue
        }

        $field = [byte[]]::new($index - $start)
        [System.Array]::Copy($IndexOutput, $start, $field, 0, $field.Length)
        $fields.Add($field)
        $start = $index + 1
    }

    if ($start -ne $IndexOutput.Length)
    {
        throw 'The Git index output is malformed as it does not end with a NUL character.'
    }

    if ($fields.Count % 2 -ne 0)
    {
        throw 'The Git index output is malformed as it contains a record without a path.'
    }

    $changes = [System.Collections.Generic.List[hashtable]]::new()
    $paths = [System.Collections.Generic.HashSet[string]]::new()
    for ($index = 0; $index -lt $fields.Count; $index += 2)
    {
        $change = ConvertFrom-IndexRecord -Metadata $fields[$index] -PathBytes $fields[$index + 1]
        if (-not $paths.Add($change.Path))
        {
            throw "The Git index contains multiple records for the path $(Format-Path -Path $change.Path)."
        }

        $changes.Add($change)
    }

    return , $changes
}

function Get-RequiredEnvironmentVariable
{
    [OutputType([string])]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    $value = [System.Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value))
    {
        throw "The environment variable '$Name' is not set."
    }

    return $value
}

function Invoke-GitHubGraphQl
{
    [OutputType([PSCustomObject])]
    param(
        [Parameter(Mandatory)]
        [string]$Query,

        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$Variables
    )

    # The request is written to a file and posted verbatim, so no value is ever interpolated into a query document or
    # into a command line.
    $requestPath = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath "signed-commit-$([guid]::NewGuid()).json"
    try
    {
        $request = [ordered]@{ query = $Query; variables = $Variables }
        Set-Content -Path $requestPath -Value (ConvertTo-Json -InputObject $request -Depth 10) -Encoding utf8NoBOM -NoNewline
        $response = gh api graphql --input $requestPath
        if ($LASTEXITCODE -ne 0)
        {
            throw "The GitHub GraphQL API request failed with exit code $LASTEXITCODE."
        }
    }
    finally
    {
        Remove-Item -Path $requestPath -Force -ErrorAction SilentlyContinue
    }

    $responseText = $response -join [System.Environment]::NewLine
    if ([string]::IsNullOrWhiteSpace($responseText))
    {
        throw 'The GitHub GraphQL API returned an empty response.'
    }

    return ConvertFrom-Json -InputObject $responseText
}

$nameWithOwner = Get-RequiredEnvironmentVariable -Name 'GITHUB_REPOSITORY'
$repositoryParts = $nameWithOwner.Split('/')
if ($repositoryParts.Length -ne 2 -or $repositoryParts -contains '')
{
    throw "The environment variable 'GITHUB_REPOSITORY' does not contain an 'owner/repository' value."
}

$branch = Get-GitText -Arguments @('rev-parse', '--abbrev-ref', 'HEAD')
if ($branch -eq 'HEAD')
{
    throw 'HEAD is not attached to a branch, so the commit target cannot be determined.'
}

$headObjectId = Get-GitText -Arguments @('rev-parse', 'HEAD')
if ($headObjectId -notmatch $objectIdExpression)
{
    throw 'The local HEAD commit could not be read.'
}

$null = Invoke-GitBinary -Arguments @('add', '-A')
$changes = Get-StagedChange -IndexOutput (Invoke-GitBinary -Arguments @('diff-index', '--cached', '--raw', '-z', '--no-renames', 'HEAD', '--'))
if ($changes.Count -eq 0)
{
    Write-Output -InputObject 'No staged changes were found, so no commit was created.'
    return
}

$additions = [System.Collections.Generic.List[object]]::new()
$deletions = [System.Collections.Generic.List[object]]::new()
foreach ($change in $changes)
{
    if ($null -eq $change.ObjectId)
    {
        $deletions.Add([ordered]@{ path = $change.Path })
    }
    else
    {
        $contents = [System.Convert]::ToBase64String((Invoke-GitBinary -Arguments @('cat-file', 'blob', $change.ObjectId)))
        $additions.Add([ordered]@{ path = $change.Path; contents = $contents })
    }
}

$null = Get-RequiredEnvironmentVariable -Name 'GH_TOKEN'
$branchVariables = [ordered]@{
    owner         = $repositoryParts[0]
    name          = $repositoryParts[1]
    qualifiedName = "refs/heads/$branch"
}
$repositoryNode = (Invoke-GitHubGraphQl -Query $branchQuery -Variables $branchVariables).data.repository
if ($null -eq $repositoryNode)
{
    throw "The repository '$nameWithOwner' could not be read via the GitHub GraphQL API."
}

# The remote branch is read once and the commit that was read becomes the expected head, so the staged changes are
# applied atop any commit that another job has already pushed rather than reverting it.
$expectedHeadObjectId = $null
if ($null -ne $repositoryNode.ref)
{
    $expectedHeadObjectId = $repositoryNode.ref.target.oid
    if ($expectedHeadObjectId -notmatch $objectIdExpression)
    {
        throw "The remote branch '$branch' returned the malformed commit ID '$expectedHeadObjectId'."
    }
}

if ($null -eq $expectedHeadObjectId)
{
    if (-not $CreateBranchOnRemote)
    {
        throw "The branch '$branch' does not exist on the remote."
    }

    $expectedHeadObjectId = $headObjectId
    $createBranchVariables = [ordered]@{
        input = [ordered]@{
            repositoryId = $repositoryNode.id
            name         = "refs/heads/$branch"
            oid          = $headObjectId
        }
    }
    $null = Invoke-GitHubGraphQl -Query $createBranchMutation -Variables $createBranchVariables
    Write-Output -InputObject "Created the branch '$branch' on the remote."
}

$commitVariables = [ordered]@{
    input = [ordered]@{
        branch          = [ordered]@{ repositoryNameWithOwner = $nameWithOwner; branchName = $branch }
        expectedHeadOid = $expectedHeadObjectId
        fileChanges     = [ordered]@{ additions = $additions; deletions = $deletions }
        message         = [ordered]@{ headline = $Message }
    }
}

# The commit is neither forced nor retried, so a branch update after the read fails the mutation via
# 'expectedHeadOid' instead of overwriting the remote branch.
$commit = (Invoke-GitHubGraphQl -Query $createCommitMutation -Variables $commitVariables).data.createCommitOnBranch.commit
Write-Output -InputObject "Created commit '$($commit.oid)' with $($additions.Count) addition(s) and $($deletions.Count) deletion(s)."
