# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param
(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Prepare', 'Generate', 'Evaluate', 'Approve', 'Complete')]
    [string] $Mode
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:dependabotStatusName = 'Dependabot ' + [char] 0x2013 + ' Automation'

function Invoke-AutomationProcess
{
    param
    (
        [string] $File,
        [string[]] $Arguments,
        [string] $Directory = (Get-Location).Path,
        [byte[]] $InputBytes = @(),
        [hashtable] $Environment = @{}
    )

    $info = [System.Diagnostics.ProcessStartInfo]::new($File)
    $info.WorkingDirectory = $Directory
    $info.UseShellExecute = $false
    $info.RedirectStandardInput = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    foreach ($argument in $Arguments)
    {
        $info.ArgumentList.Add($argument)
    }

    foreach ($key in $Environment.Keys)
    {
        $info.Environment[$key] = $Environment[$key]
    }

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $info
    $stream = [System.IO.MemoryStream]::new()
    try
    {
        $null = $process.Start()
        $errorTask = $process.StandardError.ReadToEndAsync()
        $outputTask = $process.StandardOutput.BaseStream.CopyToAsync($stream)
        $process.StandardInput.BaseStream.Write($InputBytes, 0, $InputBytes.Length)
        $process.StandardInput.Close()
        $process.WaitForExit()
        $null = $outputTask.GetAwaiter().GetResult()
        $errorText = $errorTask.GetAwaiter().GetResult()
        if ($process.ExitCode -ne 0)
        {
            throw "$File failed (exit $($process.ExitCode)): $errorText"
        }

        return , $stream.ToArray()
    }
    finally
    {
        $stream.Dispose()
        $process.Dispose()
    }
}

function Invoke-GitHubApi
{
    param
    (
        [string] $Path,
        [string] $Method = 'GET',
        [object] $Body
    )

    $arguments = @('api', '--method', $Method, $Path)
    $inputBytes = [byte[]]@()
    if ($null -ne $Body)
    {
        $arguments += @('--input', '-')
        $inputBytes = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 30 -Compress))
    }

    $bytes = Invoke-AutomationProcess -File 'gh' -Arguments $arguments -InputBytes $inputBytes
    return [System.Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json -Depth 100 -NoEnumerate
}

function Get-AutomationPage
{
    param ([string] $Path, [string] $Property = '')

    $items = [System.Collections.Generic.List[object]]::new()
    for ($page = 1; $page -le 1000; $page++)
    {
        $response = Invoke-GitHubApi -Path "${Path}?per_page=100&page=$page"
        $batch = @(if ($Property -eq '')
            {
                $response
            }
            else
            {
                $response.$Property
            })

        foreach ($item in $batch)
        {
            $items.Add($item)
        }

        if ($batch.Count -lt 100)
        {
            if ($Property -ne '' -and $items.Count -ne $response.total_count)
            {
                throw "Incomplete API enumeration: $Path"
            }

            return $items.ToArray()
        }
    }

    throw "API pagination limit exceeded: $Path"
}

function Invoke-AutomationWriteApi
{
    param ([string] $Path, [string] $Method, [object] $Body)

    if ([string]::IsNullOrWhiteSpace($env:AUTOMATION_TOKEN))
    {
        throw 'An App token is required for the privileged mutation.'
    }

    $nativeToken = $env:GH_TOKEN
    try
    {
        $env:GH_TOKEN = $env:AUTOMATION_TOKEN
        return Invoke-GitHubApi -Path $Path -Method $Method -Body $Body
    }
    finally
    {
        $env:GH_TOKEN = $nativeToken
    }
}

function Test-AutomationId
{
    param ([object] $Value)

    $parsed = 0L
    return "$Value" -cmatch '^[1-9][0-9]*$' -and [long]::TryParse("$Value", [ref] $parsed)
}

function Test-AutomationSha
{
    param ([object] $Value)

    return "$Value" -cmatch '^[0-9a-f]{40}$'
}

function Get-AutomationSource
{
    param ([long] $RunId, [int] $RunAttempt)

    if ($RunId -le 0 -or $RunAttempt -le 0 -or $env:GITHUB_REPOSITORY -cnotmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$')
    {
        throw 'Invalid automation repository or source run identifier.'
    }

    $repository = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY"
    $workflow = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/actions/workflows/build.yml"
    $run = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$RunId/attempts/$RunAttempt"
    $valid = $repository.default_branch -ceq 'main' -and
    $workflow.path -ceq '.github/workflows/build.yml' -and
    $run.id -eq $RunId -and $run.run_attempt -eq $RunAttempt -and
    $run.workflow_id -eq $workflow.id -and $run.path -ceq $workflow.path -and
    $run.event -ceq 'pull_request' -and $run.status -ceq 'completed' -and
    $run.repository.id -eq $repository.id -and $run.head_repository.id -eq $repository.id -and
    (Test-AutomationSha -Value $run.head_sha)
    return [pscustomobject]@{ Valid = $valid; Repository = $repository; Run = $run }
}

function Get-PullRequestAutomationContext
{
    param ([long] $RunId, [int] $RunAttempt, [string] $GeneratedSha = '')

    $source = Get-AutomationSource -RunId $RunId -RunAttempt $RunAttempt
    if (-not $source.Valid)
    {
        return [pscustomobject]@{ Applicable = $false; Reason = 'Source workflow, event, attempt, or repository is not authorized.' }
    }

    $jobs = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$RunId/attempts/$RunAttempt/jobs" -Property 'jobs')
    if (@($jobs | Where-Object -Property name -In -Value @('Commit Changes', $script:dependabotStatusName)).Count -ne 0)
    {
        return [pscustomobject]@{ Applicable = $false; Reason = 'Legacy source run owns its automation results.' }
    }

    $producer = @($jobs | Where-Object -Property name -CEQ -Value 'Update Code')
    $producerAttempt = $RunAttempt
    for ($previousAttempt = $RunAttempt - 1; $producer.Count -eq 0 -and $previousAttempt -gt 0; $previousAttempt--)
    {
        $previousSource = Get-AutomationSource -RunId $RunId -RunAttempt $previousAttempt
        if (-not $previousSource.Valid -or $previousSource.Run.head_sha -cne $source.Run.head_sha -or
            $previousSource.Run.head_branch -cne $source.Run.head_branch)
        {
            return [pscustomobject]@{ Applicable = $false; Reason = 'Earlier producer attempt does not match the validated source.' }
        }

        $previousJobs = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$RunId/attempts/$previousAttempt/jobs" -Property 'jobs')
        if (@($previousJobs | Where-Object -Property name -In -Value @('Commit Changes', $script:dependabotStatusName)).Count -ne 0)
        {
            return [pscustomobject]@{ Applicable = $false; Reason = 'Legacy source run owns its automation results.' }
        }

        $producer = @($previousJobs | Where-Object -Property name -CEQ -Value 'Update Code')
        $producerAttempt = $previousAttempt
    }

    $associations = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/commits/$($source.Run.head_sha)/pulls")
    $matchingPullRequests = @($associations | Where-Object {
            $_.state -ceq 'open' -and $_.base.ref -ceq 'main' -and
            $_.base.repo.id -eq $source.Repository.id -and $_.head.repo.id -eq $source.Repository.id -and
            $_.head.ref -ceq $source.Run.head_branch
        })
    if ($matchingPullRequests.Count -ne 1)
    {
        return [pscustomobject]@{ Applicable = $false; Reason = 'Expected one open same-repository pull request targeting main.' }
    }

    $pr = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/pulls/$($matchingPullRequests[0].number)"
    if ($pr.state -cne 'open' -or $pr.base.ref -cne 'main' -or
        $pr.base.repo.id -ne $source.Repository.id -or $pr.head.repo.id -ne $source.Repository.id -or
        $pr.head.ref -cne $source.Run.head_branch -or $pr.head.ref -ceq 'main' -or
        ($pr.head.sha -cne $source.Run.head_sha -and ($GeneratedSha -eq '' -or $pr.head.sha -cne $GeneratedSha)))
    {
        return [pscustomobject]@{ Applicable = $false; Reason = 'Pull request changed or is not eligible for same-repository automation.' }
    }

    return [pscustomobject]@{
        Applicable = $true; Reason = 'Validated source run and current pull request.'
        Repository = $source.Repository; Run = $source.Run; PullRequest = $pr
        Producer = if ($producer.Count -eq 1)
        {
            $producer[0]
        }
        else
        {
            $null
        }
        ProducerAttempt = $producerAttempt
        PatchReady = $producer.Count -eq 1 -and $producer[0].conclusion -ceq 'success'
    }
}

function Assert-AutomationHead
{
    param ([object] $Context)

    if (-not $Context.Applicable -or -not (Test-AutomationSha -Value $Context.PullRequest.head.sha))
    {
        throw 'Automation requires a validated pull request and full commit SHA.'
    }

    $pr = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/pulls/$($Context.PullRequest.number)"
    if ($pr.state -cne 'open' -or $pr.base.ref -cne 'main' -or
        $pr.base.repo.id -ne $Context.Repository.id -or $pr.head.repo.id -ne $Context.Repository.id -or
        $pr.head.ref -cne $Context.Run.head_branch -or $pr.head.ref -ceq 'main' -or $pr.head.sha -cne $Context.PullRequest.head.sha)
    {
        throw 'Pull request head or target changed during automation.'
    }

    return $pr
}

function Assert-GeneratedPath
{
    param ([string] $Path)

    if ($Path -eq '' -or $Path -match '[\\:\x00-\x1f\x7f]' -or
        $Path.StartsWith('/') -or @($Path.Split('/') | Where-Object { $_ -in @('', '.', '..', '.git') }).Count -ne 0)
    {
        throw 'Generated patch contains an unsafe path.'
    }
}

function Test-GeneratedApprovalPath
{
    param ([string[]] $Paths)

    foreach ($path in $Paths)
    {
        if ($path -cnotmatch '^(?:dist/(?:index\.mjs|resources\.resjson)|src/task/(?:src|tests)/.+\.ts|docs/.+\.md|(?:LICENSE\.txt|third-party-licenses\.txt))$')
        {
            return $false
        }
    }

    return $true
}

function Get-GeneratedFileChange
{
    param ([string] $RepositoryDirectory, [string] $SourceSha, [string] $PatchPath)

    if (-not (Test-AutomationSha -Value $SourceSha))
    {
        throw 'Patch processing requires a full source SHA.'
    }

    $index = Join-Path -Path $RepositoryDirectory -ChildPath "automation-index-$([Guid]::NewGuid().ToString('N'))"
    $environment = @{ GIT_INDEX_FILE = $index; GIT_CONFIG_NOSYSTEM = '1'; GIT_NO_REPLACE_OBJECTS = '1' }
    $gitOptions = @("--git-dir=$RepositoryDirectory", '--no-optional-locks', '-c', 'core.hooksPath=/dev/null', '-c', 'protocol.file.allow=never')
    $utf8 = [System.Text.UTF8Encoding]::new($false, $true)
    try
    {
        $null = Invoke-AutomationProcess -File 'git' -Directory $RepositoryDirectory -Environment $environment -Arguments ($gitOptions + @('read-tree', $SourceSha))
        $null = Invoke-AutomationProcess -File 'git' -Directory $RepositoryDirectory -Environment $environment -Arguments ($gitOptions + @('apply', '--cached', '--binary', '--whitespace=nowarn', '--', $PatchPath))
        $raw = Invoke-AutomationProcess -File 'git' -Directory $RepositoryDirectory -Environment $environment -Arguments ($gitOptions + @('diff', '--cached', '--raw', '--no-abbrev', '--no-renames', '-z', $SourceSha, '--'))
        $entries = $utf8.GetString($raw).Split([char] 0)
        $additions = [System.Collections.Generic.List[object]]::new()
        $deletions = [System.Collections.Generic.List[object]]::new()
        $paths = [System.Collections.Generic.List[string]]::new()
        for ($i = 0; $i -lt $entries.Length - 1; $i += 2)
        {
            if ($i + 1 -ge $entries.Length -or
                $entries[$i] -cnotmatch '^:(?<oldMode>[0-7]{6}) (?<newMode>[0-7]{6}) [0-9a-f]{40} (?<oid>[0-9a-f]{40}) (?<status>[AMD])$')
            {
                throw 'Generated patch has unsupported index changes.'
            }

            $metadata = $Matches.Clone()
            $path = $entries[$i + 1]
            Assert-GeneratedPath -Path $path
            if ($metadata.oldMode -notin @('000000', '100644') -or $metadata.newMode -notin @('000000', '100644'))
            {
                throw 'Generated patch changes a symlink, gitlink, or unsupported file mode.'
            }

            $paths.Add($path)
            if ($metadata.status -ceq 'D')
            {
                $deletions.Add(@{ path = $path })
            }
            else
            {
                $blob = Invoke-AutomationProcess -File 'git' -Directory $RepositoryDirectory -Environment $environment -Arguments ($gitOptions + @('cat-file', 'blob', $metadata.oid))
                $additions.Add(@{ path = $path; contents = [Convert]::ToBase64String($blob) })
            }
        }

        return [pscustomobject]@{ Additions = $additions.ToArray(); Deletions = $deletions.ToArray(); Paths = $paths.ToArray() }
    }
    finally
    {
        foreach ($file in @($index, "$index.lock"))
        {
            if (Test-Path -LiteralPath $file)
            {
                Remove-Item -LiteralPath $file -Force
            }
        }
    }
}

function New-PullRequestGeneratedCommit
{
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'CI writes use explicit origin and head guards.')]
    [CmdletBinding()]
    param ([object] $Context, [string] $PatchPath)

    if (-not $Context.PatchReady)
    {
        throw 'Update Code did not successfully produce a patch.'
    }

    $null = Assert-AutomationHead -Context $Context
    if ((Get-Item -LiteralPath $PatchPath).Length -eq 0)
    {
        return [pscustomobject]@{ GeneratedSha = ''; ProvenancePath = '' }
    }

    if (-not (Test-AutomationId -Value $env:GITHUB_RUN_ID) -or -not (Test-AutomationId -Value $env:GITHUB_RUN_ATTEMPT))
    {
        throw 'Generated commits require a valid controller run and attempt.'
    }

    $eligibility = Get-PullRequestApprovalEligibility -Context $Context
    $temporary = Join-Path -Path $env:RUNNER_TEMP -ChildPath "pr-metrics-index-$([Guid]::NewGuid().ToString('N'))"
    $null = New-Item -ItemType Directory -Path $temporary
    try
    {
        $null = Invoke-AutomationProcess -File 'git' -Arguments @('init', '--bare', '--quiet') -Directory $temporary
        $null = Invoke-AutomationProcess -File 'git' -Arguments @(
            "--git-dir=$temporary", '-c', 'credential.helper=', '-c', 'core.hooksPath=/dev/null', '-c', 'protocol.file.allow=never',
            'fetch', '--no-tags', '--depth=1', "https://github.com/$env:GITHUB_REPOSITORY.git", $Context.Run.head_sha
        ) -Directory $temporary
        $changes = Get-GeneratedFileChange -RepositoryDirectory $temporary -SourceSha $Context.Run.head_sha -PatchPath $PatchPath
    }
    finally
    {
        Remove-Item -LiteralPath $temporary -Recurse -Force
    }

    if ($changes.Paths.Count -eq 0)
    {
        return [pscustomobject]@{ GeneratedSha = ''; ProvenancePath = '' }
    }

    $null = Assert-AutomationHead -Context $Context
    $response = Invoke-AutomationWriteApi -Path 'graphql' -Method 'POST' -Body @{
        query     = 'mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }'
        variables = @{
            input = @{
                branch          = @{ repositoryNameWithOwner = $env:GITHUB_REPOSITORY; branchName = $Context.Run.head_branch }
                expectedHeadOid = $Context.Run.head_sha
                message         = @{
                    headline = 'chore: fix linting, update dist folder'
                    body     = "PR-Metrics-Automation-Run: $env:GITHUB_RUN_ID`nPR-Metrics-Automation-Attempt: $env:GITHUB_RUN_ATTEMPT"
                }
                fileChanges     = @{ additions = @($changes.Additions); deletions = @($changes.Deletions) }
            }
        }
    }

    if ($response.PSObject.Properties.Name -contains 'errors')
    {
        throw 'GitHub rejected the generated commit mutation.'
    }

    $sha = $response.data.createCommitOnBranch.commit.oid
    if (-not (Test-AutomationSha -Value $sha))
    {
        throw 'GitHub did not return a generated commit SHA.'
    }

    $commit = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/commits/$sha"
    $app = Invoke-GitHubApi -Path 'users/microsoft-pr-metrics%5Bbot%5D'
    if ($null -eq $commit.author -or $commit.author.id -ne $app.id -or
        -not $commit.commit.verification.verified -or $commit.commit.verification.reason -cne 'valid' -or
        $commit.parents.Count -ne 1 -or $commit.parents[0].sha -cne $Context.Run.head_sha)
    {
        throw 'Generated commit signature, App identity, or parent failed validation.'
    }

    $record = @{
        schemaVersion = 1; repositoryId = $Context.Repository.id; pullRequestNumber = $Context.PullRequest.number
        parentSha = $Context.Run.head_sha; generatedSha = $sha
        sourceRunId = $Context.Run.id; sourceRunAttempt = $Context.Run.run_attempt
        automationRunId = [long] $env:GITHUB_RUN_ID; automationRunAttempt = [int] $env:GITHUB_RUN_ATTEMPT
        dependabotEligible = $eligibility.Eligible -and (Test-GeneratedApprovalPath -Paths $changes.Paths)
    }

    $recordDirectory = Join-Path -Path $env:RUNNER_TEMP -ChildPath "pr-metrics-generated-$sha"
    $null = New-Item -ItemType Directory -Path $recordDirectory -Force
    $recordPath = Join-Path -Path $recordDirectory -ChildPath 'provenance.json'
    $record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $recordPath -Encoding utf8NoBOM
    return [pscustomobject]@{ GeneratedSha = $sha; ProvenancePath = $recordPath }
}

function Get-PullRequestApprovalEligibility
{
    param ([object] $Context)

    $commitSha = $Context.PullRequest.head.sha
    $pr = Assert-AutomationHead -Context $Context
    $bot = Invoke-GitHubApi -Path 'users/dependabot%5Bbot%5D'
    $app = Invoke-GitHubApi -Path 'users/microsoft-pr-metrics%5Bbot%5D'
    $webFlow = Invoke-GitHubApi -Path 'users/web-flow'
    $denied = [pscustomobject]@{ Eligible = $false; Reason = 'Human, unknown, incomplete, or unverified commit origin requires human review.' }
    if ($bot.type -cne 'Bot' -or $app.type -cne 'Bot' -or
        $pr.user.id -ne $bot.id -or $pr.user.login -cne 'dependabot[bot]' -or
        $Context.Run.actor.id -notin @($bot.id, $app.id) -or $pr.commits -gt 250)
    {
        return $denied
    }
    $commits = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/pulls/$($pr.number)/commits")
    if ($commits.Count -ne $pr.commits -or $commits.Count -eq 0 -or $commits[-1].sha -cne $commitSha)
    {
        return $denied
    }
    $previous = ''
    foreach ($commit in $commits)
    {
        if (-not (Test-AutomationSha -Value $commit.sha) -or $commit.parents.Count -ne 1 -or
            ($previous -ne '' -and $commit.parents[0].sha -cne $previous) -or
            $null -eq $commit.author -or -not $commit.commit.verification.verified -or $commit.commit.verification.reason -cne 'valid')
        {
            return $denied
        }
        if ($commit.author.id -eq $bot.id -and $commit.author.login -ceq 'dependabot[bot]' -and $commit.author.type -ceq 'Bot')
        {
            if ($null -eq $commit.committer -or $commit.committer.id -ne $webFlow.id -or $commit.committer.login -cne 'web-flow')
            {
                return $denied
            }
            $previous = $commit.sha
            continue
        }
        if ($commit.author.id -ne $app.id -or $commit.author.login -cne 'microsoft-pr-metrics[bot]' -or $commit.author.type -cne 'Bot')
        {
            return $denied
        }
        $proof = Get-GeneratedCommitProvenance -Context $Context -Commit $commit
        if (-not $proof.Eligible)
        {
            return $denied
        }
        if ($commit.sha -ceq $commitSha -and $commitSha -cne $Context.Run.head_sha -and
            ($proof.Record.parentSha -cne $Context.Run.head_sha -or $proof.Record.sourceRunId -ne $Context.Run.id -or
            $proof.Record.sourceRunAttempt -ne $Context.Run.run_attempt))
        {
            return $denied
        }
        $previous = $commit.sha
    }
    if ($Context.Run.actor.id -eq $app.id -and $commits[-1].author.id -ne $app.id)
    {
        return $denied
    }
    return [pscustomobject]@{ Eligible = $true; Reason = 'Complete verified Dependabot and trusted generated history.' }
}

function Get-AutomationArtifact
{
    param
    (
        [long] $RunId,
        [string] $Name,
        [string] $HeadSha,
        [object] $StartedAt,
        [object] $CompletedAt,
        [string] $EntryName,
        [int] $MaximumBytes = 33554432
    )

    $artifacts = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$RunId/artifacts" -Property 'artifacts')
    $matchingArtifacts = @($artifacts | Where-Object { $_.name -ceq $Name -and -not $_.expired })
    if ($matchingArtifacts.Count -eq 0)
    {
        return [pscustomobject]@{ Available = $false; Reason = "Missing or expired artifact: $Name" }
    }
    if ($matchingArtifacts.Count -ne 1)
    {
        throw "Ambiguous automation artifact: $Name"
    }
    $artifact = $matchingArtifacts[0]
    $repository = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY"
    if ($artifact.workflow_run.id -ne $RunId -or $artifact.workflow_run.repository_id -ne $repository.id -or
        $artifact.workflow_run.head_repository_id -ne $repository.id -or $artifact.workflow_run.head_sha -cne $HeadSha -or
        [DateTimeOffset] $artifact.created_at -lt [DateTimeOffset] $StartedAt -or
        [DateTimeOffset] $artifact.created_at -gt [DateTimeOffset] $CompletedAt)
    {
        throw 'Artifact does not belong to the validated producer attempt.'
    }
    $bytes = Invoke-AutomationProcess -File 'gh' -Arguments @('api', "repos/$env:GITHUB_REPOSITORY/actions/artifacts/$($artifact.id)/zip")
    $stream = [System.IO.MemoryStream]::new($bytes, $false)
    $zip = [System.IO.Compression.ZipArchive]::new($stream)
    try
    {
        if ($zip.Entries.Count -ne 1 -or $zip.Entries[0].FullName -cne $EntryName -or
            $zip.Entries[0].Length -gt $MaximumBytes -or ($zip.Entries[0].ExternalAttributes -shr 16 -band 61440) -eq 40960)
        {
            throw 'Artifact must contain exactly the expected regular data file within the size limit.'
        }
        $entry = $zip.Entries[0].Open()
        $output = [System.IO.MemoryStream]::new()
        try
        {
            $entry.CopyTo($output)
            return [pscustomobject]@{ Available = $true; Bytes = $output.ToArray() }
        }
        finally
        {
            $entry.Dispose()
            $output.Dispose()
        }
    }
    finally
    {
        $zip.Dispose()
        $stream.Dispose()
    }
}

function Get-GeneratedCommitProvenance
{
    param ([object] $Context, [object] $Commit)

    $denied = [pscustomobject]@{ Eligible = $false }
    $runHints = [regex]::Matches($Commit.commit.message, '(?m)^PR-Metrics-Automation-Run: ([1-9][0-9]*)\r?$')
    $attemptHints = [regex]::Matches($Commit.commit.message, '(?m)^PR-Metrics-Automation-Attempt: ([1-9][0-9]*)\r?$')
    if ($runHints.Count -ne 1 -or $attemptHints.Count -ne 1 -or
        -not (Test-AutomationId -Value $runHints[0].Groups[1].Value) -or
        -not (Test-AutomationId -Value $attemptHints[0].Groups[1].Value))
    {
        return $denied
    }
    $runId = [long] $runHints[0].Groups[1].Value
    $attempt = [int]::Parse($attemptHints[0].Groups[1].Value, [System.Globalization.CultureInfo]::InvariantCulture)
    $workflow = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/actions/workflows/pr-automation.yml"
    $run = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$runId/attempts/$attempt"
    if ($workflow.path -cne '.github/workflows/pr-automation.yml' -or $run.workflow_id -ne $workflow.id -or
        $run.path -cne $workflow.path -or $run.id -ne $runId -or $run.run_attempt -ne $attempt -or
        $run.event -cne 'workflow_run' -or $run.head_branch -cne 'main' -or
        $run.repository.id -ne $Context.Repository.id -or $run.head_repository.id -ne $Context.Repository.id -or
        -not (Test-AutomationSha -Value $run.head_sha))
    {
        return $denied
    }
    $jobs = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$runId/attempts/$attempt/jobs" -Property 'jobs')
    $producer = @($jobs | Where-Object -Property name -CEQ -Value 'Generate Changes')
    if ($producer.Count -ne 1 -or $producer[0].conclusion -cne 'success')
    {
        return $denied
    }
    $artifact = Get-AutomationArtifact -RunId $runId -Name "pr-metrics-generated-$($Commit.sha)" -HeadSha $run.head_sha `
        -StartedAt $producer[0].started_at -CompletedAt $producer[0].completed_at -EntryName 'provenance.json' -MaximumBytes 65536
    if (-not $artifact.Available)
    {
        return $denied
    }
    $record = [System.Text.Encoding]::UTF8.GetString($artifact.Bytes) | ConvertFrom-Json -Depth 20
    if ($record.schemaVersion -ne 1 -or $record.repositoryId -ne $Context.Repository.id -or
        $record.pullRequestNumber -ne $Context.PullRequest.number -or
        $record.generatedSha -cne $Commit.sha -or $Commit.parents.Count -ne 1 -or
        $record.parentSha -cne $Commit.parents[0].sha -or -not (Test-AutomationSha -Value $record.parentSha) -or
        $record.automationRunId -ne $runId -or $record.automationRunAttempt -ne $attempt -or
        -not (Test-AutomationId -Value $record.sourceRunId) -or -not (Test-AutomationId -Value $record.sourceRunAttempt) -or
        $record.dependabotEligible -isnot [bool] -or -not $record.dependabotEligible)
    {
        return $denied
    }
    $source = Get-AutomationSource -RunId $record.sourceRunId -RunAttempt $record.sourceRunAttempt
    if (-not $source.Valid -or $source.Run.head_sha -cne $record.parentSha -or $source.Run.head_branch -cne $Context.Run.head_branch)
    {
        return $denied
    }
    return [pscustomobject]@{ Eligible = $true; Record = $record }
}

function Submit-PullRequestApproval
{
    param ([object] $Context)

    $commitSha = $Context.PullRequest.head.sha
    $eligibility = Get-PullRequestApprovalEligibility -Context $Context
    if (-not $eligibility.Eligible)
    {
        return [pscustomobject]@{ Approved = $false; Reason = $eligibility.Reason }
    }
    $app = Invoke-GitHubApi -Path 'users/microsoft-pr-metrics%5Bbot%5D'
    $reviews = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/pulls/$($Context.PullRequest.number)/reviews")
    $ownReviews = @($reviews | Where-Object { $_.user.id -eq $app.id })
    if ($ownReviews.Count -gt 0 -and $ownReviews[-1].state -ceq 'APPROVED' -and $ownReviews[-1].commit_id -ceq $commitSha)
    {
        $null = Assert-AutomationHead -Context $Context
        return [pscustomobject]@{ Approved = $true; Reason = 'Existing approval for the validated SHA.' }
    }
    $null = Assert-AutomationHead -Context $Context
    $review = Invoke-AutomationWriteApi -Path "repos/$env:GITHUB_REPOSITORY/pulls/$($Context.PullRequest.number)/reviews" -Method 'POST' -Body @{
        event = 'APPROVE'; commit_id = $commitSha
        body = 'Verified Dependabot update and trusted generated history. All merge gates still apply.'
    }
    try
    {
        $null = Assert-AutomationHead -Context $Context
        if ($review.commit_id -cne $commitSha -or $review.state -cne 'APPROVED' -or $review.user.id -ne $app.id)
        {
            throw 'GitHub returned an unexpected approval response.'
        }
    }
    catch
    {
        $null = Invoke-AutomationWriteApi -Path "repos/$env:GITHUB_REPOSITORY/pulls/$($Context.PullRequest.number)/reviews/$($review.id)/dismissals" -Method 'PUT' -Body @{
            message = 'Pull request changed or approval response failed validation.'
        }
        throw
    }
    return [pscustomobject]@{ Approved = $true; Reason = 'Submitted an approval for the validated SHA.' }
}

function Set-PullRequestAutomationStatus
{
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'CI status writes report validated source-run results.')]
    [CmdletBinding()]
    param
    (
        [object] $Context,
        [string] $Name,
        [ValidateSet('pending', 'success', 'failure', 'error')] [string] $State,
        [string] $Description
    )

    if (-not (Test-AutomationSha -Value $Context.Run.head_sha) -or $Name -cnotin @('Commit Changes', $script:dependabotStatusName))
    {
        throw 'Cannot publish automation status without a validated source SHA.'
    }
    $null = Invoke-GitHubApi -Path "repos/$env:GITHUB_REPOSITORY/statuses/$($Context.Run.head_sha)" -Method 'POST' -Body @{
        context = $Name; state = $State; description = $Description
        target_url = "$env:GITHUB_SERVER_URL/$env:GITHUB_REPOSITORY/actions/runs/$env:GITHUB_RUN_ID"
    }
}

function Write-AutomationOutput
{
    param ([string] $Name, [string] $Value)

    if ($Name -cnotmatch '^[a-z][a-z-]*$' -or $Value -match '[\r\n]')
    {
        throw 'Invalid automation output.'
    }
    "$Name=$Value" | Out-File -LiteralPath $env:GITHUB_OUTPUT -Append -Encoding utf8NoBOM
}

if (-not (Test-AutomationId -Value $env:SOURCE_RUN_ID) -or -not (Test-AutomationId -Value $env:SOURCE_RUN_ATTEMPT))
{
    throw 'Expected an authenticated source run ID and attempt.'
}

$runId = [long] $env:SOURCE_RUN_ID
$attempt = [int] $env:SOURCE_RUN_ATTEMPT
if ($Mode -ceq 'Complete')
{
    $source = Get-AutomationSource -RunId $runId -RunAttempt $attempt
    if (-not $source.Valid -or ($env:PREPARE_RESULT -ceq 'success' -and $env:APPLICABLE -cne 'true'))
    {
        Write-Output -InputObject 'No applicable same-repository automation to report.'
        return
    }

    $jobs = @(Get-AutomationPage -Path "repos/$env:GITHUB_REPOSITORY/actions/runs/$runId/attempts/$attempt/jobs" -Property 'jobs')
    if (@($jobs | Where-Object -Property name -In -Value @('Commit Changes', $script:dependabotStatusName)).Count -ne 0)
    {
        Write-Output -InputObject 'Legacy source run owns its automation results.'
        return
    }

    $commitState = 'error'
    $commitDescription = 'Trusted source or patch validation failed.'
    $approvalState = 'error'
    $approvalDescription = 'Trusted approval did not complete.'
    if ($env:PREPARE_RESULT -ceq 'success')
    {
        if ($env:PATCH_READY -ceq 'true' -and
            (($env:HAS_CHANGES -ceq 'false' -and $env:GENERATE_RESULT -ceq 'skipped') -or $env:GENERATE_RESULT -ceq 'success'))
        {
            $commitState = 'success'
            $commitDescription = if ($env:HAS_CHANGES -ceq 'false')
            {
                'No generated changes in the validated patch.'
            }
            else
            {
                'Generated changes committed with bound provenance.'
            }
        }
        else
        {
            $commitState = 'failure'
            $commitDescription = 'Patch production or trusted generated commit failed.'
        }

        if ($env:APPROVE_RESULT -ceq 'success')
        {
            $approvalState = 'success'
            $approvalDescription = 'Approval policy evaluated; human review requirements remain.'
        }
    }

    Set-PullRequestAutomationStatus -Context $source -Name 'Commit Changes' -State $commitState -Description $commitDescription
    Set-PullRequestAutomationStatus -Context $source -Name $script:dependabotStatusName -State $approvalState -Description $approvalDescription
    return
}

$generatedSha = if ($Mode -in @('Evaluate', 'Approve'))
{
    "$env:GENERATED_SHA"
}
else
{
    ''
}

$context = Get-PullRequestAutomationContext -RunId $runId -RunAttempt $attempt -GeneratedSha $generatedSha
if ($Mode -ceq 'Prepare')
{
    Write-Output -InputObject $context.Reason
    Write-AutomationOutput -Name 'applicable' -Value $context.Applicable.ToString().ToLowerInvariant()
    if (-not $context.Applicable)
    {
        return
    }

    Set-PullRequestAutomationStatus -Context $context -Name 'Commit Changes' -State 'pending' -Description 'Validating generated patch data.'
    Set-PullRequestAutomationStatus -Context $context -Name $script:dependabotStatusName -State 'pending' -Description 'Verifying complete commit origin.'
    if (-not $context.PatchReady)
    {
        Write-AutomationOutput -Name 'patch-ready' -Value 'false'
        Write-AutomationOutput -Name 'has-changes' -Value 'false'
        return
    }

    $artifact = Get-AutomationArtifact -RunId $runId -Name "generated-changes-v2-$($context.ProducerAttempt)" -HeadSha $context.Run.head_sha `
        -StartedAt $context.Producer.started_at -CompletedAt $context.Producer.completed_at -EntryName 'generated-changes.patch'
    if (-not $artifact.Available)
    {
        throw $artifact.Reason
    }

    $directory = Join-Path -Path $env:RUNNER_TEMP -ChildPath 'pr-metrics-patch'
    $null = New-Item -ItemType Directory -Path $directory -Force
    [System.IO.File]::WriteAllBytes((Join-Path -Path $directory -ChildPath 'generated-changes.patch'), $artifact.Bytes)
    Write-AutomationOutput -Name 'patch-ready' -Value 'true'
    Write-AutomationOutput -Name 'has-changes' -Value ($artifact.Bytes.Length -ne 0).ToString().ToLowerInvariant()
    return
}

if (-not $context.Applicable)
{
    if ($Mode -ceq 'Evaluate')
    {
        Write-Output -InputObject $context.Reason
        Write-AutomationOutput -Name 'eligible' -Value 'false'
        return
    }

    throw $context.Reason
}

if ($Mode -ceq 'Generate')
{
    $patch = Join-Path -Path $env:RUNNER_TEMP -ChildPath 'pr-metrics-patch/generated-changes.patch'
    $result = New-PullRequestGeneratedCommit -Context $context -PatchPath $patch
    Write-AutomationOutput -Name 'generated-sha' -Value $result.GeneratedSha
    Write-AutomationOutput -Name 'provenance-path' -Value $result.ProvenancePath
    return
}
if ($Mode -ceq 'Evaluate')
{
    $eligibility = Get-PullRequestApprovalEligibility -Context $context
    Write-Output -InputObject $eligibility.Reason
    Write-AutomationOutput -Name 'eligible' -Value $eligibility.Eligible.ToString().ToLowerInvariant()
    return
}

if ($Mode -ceq 'Approve')
{
    $result = Submit-PullRequestApproval -Context $context
    if (-not $result.Approved)
    {
        throw $result.Reason
    }

    Write-Output -InputObject $result.Reason
    return
}

throw "Unsupported automation phase: $Mode"
