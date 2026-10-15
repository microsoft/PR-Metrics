# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param
(
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, [long]::MaxValue)]
    [long] $PullRequestNumber,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string] $HeadSha
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:GITHUB_REF -cne 'refs/heads/main')
{
    throw 'Approval must run from main.'
}

if ($env:GITHUB_EVENT_NAME -cnotin @('schedule', 'workflow_dispatch'))
{
    throw 'Approval requires a scheduled or manual workflow.'
}

$repository = $env:GITHUB_REPOSITORY
$repositoryId = $env:GITHUB_REPOSITORY_ID
if ($repository -cnotmatch '^[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$' -or
    $repositoryId -notmatch '^[1-9][0-9]*$' -or
    $HeadSha -cnotmatch '^[0-9a-f]{40}$')
{
    throw 'The workflow has invalid repository or head metadata.'
}

function Get-DependabotPullRequest
{
    $pullJson = gh api "repos/$repository/pulls/$PullRequestNumber"
    if ($LASTEXITCODE -ne 0)
    {
        throw 'Could not retrieve the pull request.'
    }

    $pull = $pullJson | ConvertFrom-Json
    if ($pull.number -ne $PullRequestNumber -or
        $pull.user.id -ne 49699333 -or
        $pull.user.login -cne 'dependabot[bot]' -or
        $pull.state -cne 'open')
    {
        throw 'Only Dependabot open pull requests can be approved.'
    }

    if ($null -eq $pull.head.repo -or $null -eq $pull.base.repo -or
        [string] $pull.head.repo.id -cne $repositoryId -or
        [string] $pull.base.repo.id -cne $repositoryId -or
        $pull.base.ref -cne 'main')
    {
        throw 'The pull request must use the workflow repository and target main.'
    }

    if ($pull.head.sha -cne $HeadSha)
    {
        throw 'The pull request head has changed since it was selected.'
    }

    return $pull
}

$pull = Get-DependabotPullRequest
if ($pull.commits -lt 1 -or $pull.commits -gt 250)
{
    throw 'Could not verify the complete pull request commit history.'
}

$commitJson = gh api "repos/$repository/pulls/$PullRequestNumber/commits?per_page=100" --paginate --slurp
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not retrieve the pull request commits.'
}

$commits = @($commitJson | ConvertFrom-Json | ForEach-Object -Process { $_ })
if ($commits.Count -ne $pull.commits -or
    @($commits.sha | Sort-Object -Unique).Count -ne $commits.Count -or
    $commits.sha -cnotcontains $HeadSha)
{
    throw 'Could not verify the complete pull request commit history.'
}

foreach ($commit in $commits)
{
    if ($commit.sha -cnotmatch '^[0-9a-f]{40}$' -or
        $null -eq $commit.author -or $null -eq $commit.committer -or
        $commit.author.id -ne 49699333 -or
        $commit.author.login -cne 'dependabot[bot]' -or
        $commit.committer.login -cne 'web-flow' -or
        $commit.commit.verification.verified -isnot [bool] -or
        -not $commit.commit.verification.verified -or
        $commit.commit.verification.reason -cne 'valid')
    {
        throw 'All pull request commits must be verified GitHub-signed Dependabot commits.'
    }
}

$reviewsJson = gh api "repos/$repository/pulls/$PullRequestNumber/reviews?per_page=100" --paginate --slurp
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not retrieve the pull request reviews.'
}

$reviews = @($reviewsJson | ConvertFrom-Json | ForEach-Object -Process {
        $_
    })
if ($reviews | Where-Object -FilterScript {
        $_.user.id -eq 288118622 -and $_.state -ceq 'APPROVED' -and $_.commit_id -ceq $HeadSha
    })
{
    Write-Information -MessageData "PR #$PullRequestNumber already has an App approval for this head." -InformationAction Continue
    return
}

$null = Get-DependabotPullRequest
gh api "repos/$repository/pulls/$PullRequestNumber/reviews" --method POST `
    -f event=APPROVE -f "commit_id=$HeadSha"
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not approve the verified Dependabot commits.'
}
