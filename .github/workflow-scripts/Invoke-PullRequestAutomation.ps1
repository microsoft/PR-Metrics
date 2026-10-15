# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:GITHUB_REF -cne 'refs/heads/main')
{
    throw 'Pull request automation must run from main.'
}

if ($env:GITHUB_EVENT_NAME -cnotin @('schedule', 'workflow_dispatch'))
{
    throw 'Pull request automation requires a scheduled or manual workflow.'
}

$repository = $env:GITHUB_REPOSITORY
$repositoryId = $env:GITHUB_REPOSITORY_ID
if ($repository -cnotmatch '^[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$' -or
    $repositoryId -notmatch '^[1-9][0-9]*$')
{
    throw 'The workflow has invalid repository metadata.'
}

$pullsJson = gh api "repos/$repository/pulls?state=open&base=main&per_page=100" --paginate --slurp
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not retrieve open pull requests.'
}

$pulls = @($pullsJson | ConvertFrom-Json | ForEach-Object -Process { $_ })
$failed = $false
foreach ($pull in $pulls)
{
    $number = [string] $pull.number
    $headSha = $pull.head.sha
    if ($number -notmatch '^[1-9][0-9]*$' -or $headSha -cnotmatch '^[0-9a-f]{40}$')
    {
        throw 'The pull request has invalid metadata.'
    }

    if ($null -eq $pull.head.repo -or $null -eq $pull.base.repo -or
        [string] $pull.head.repo.id -cne $repositoryId -or
        [string] $pull.base.repo.id -cne $repositoryId -or
        $pull.base.ref -cne 'main' -or $pull.state -cne 'open')
    {
        Write-Information -MessageData "Skipping PR #$number outside the main repository scope." -InformationAction Continue
        continue
    }

    try
    {
        git fetch --no-tags origin "+refs/pull/$number/merge:refs/remotes/pull/$number/merge"
        if ($LASTEXITCODE -ne 0)
        {
            throw "Could not fetch data for PR #$number."
        }

        $originalRef = $env:GITHUB_REF
        $originalBaseRef = $env:GITHUB_BASE_REF
        try
        {
            $env:GITHUB_REF = "refs/pull/$number/merge"
            $env:GITHUB_BASE_REF = 'main'
            node dist/index.mjs
            if ($LASTEXITCODE -ne 0)
            {
                throw "PR Metrics failed for PR #$number."
            }
        }
        finally
        {
            $env:GITHUB_REF = $originalRef
            $env:GITHUB_BASE_REF = $originalBaseRef
        }
    }
    catch
    {
        Write-Error -ErrorRecord $_ -ErrorAction Continue
        $failed = $true
    }

    if ($pull.user.id -eq 49699333 -and $pull.user.login -ceq 'dependabot[bot]')
    {
        try
        {
            $approvalScript = Join-Path -Path $PSScriptRoot -ChildPath 'Approve-DependabotPullRequest.ps1'
            & $approvalScript -PullRequestNumber $number -HeadSha $headSha
        }
        catch
        {
            Write-Error -ErrorRecord $_ -ErrorAction Continue
            $failed = $true
        }
    }
}

if ($failed)
{
    throw 'Pull request automation failed. See the errors above.'
}
