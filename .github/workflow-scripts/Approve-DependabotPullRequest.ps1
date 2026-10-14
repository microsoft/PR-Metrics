# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:GITHUB_EVENT_NAME -cne 'pull_request_target')
{
    throw 'Approval requires a trusted pull_request_target workflow.'
}

if ($env:GITHUB_ACTOR -cne 'dependabot[bot]' -or
    $env:GITHUB_TRIGGERING_ACTOR -cne 'dependabot[bot]')
{
    throw 'Only Dependabot events and Dependabot reruns can be approved.'
}

$githubEvent = Get-Content -Path $env:GITHUB_EVENT_PATH -Raw | ConvertFrom-Json
$repository = $env:GITHUB_REPOSITORY
$number = [string] $githubEvent.number
$headSha = $githubEvent.pull_request.head.sha
if ($repository -cne $githubEvent.repository.full_name -or
    $repository -cnotmatch '^[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$' -or
    $number -notmatch '^[1-9][0-9]*$' -or
    $headSha -cnotmatch '^[0-9a-f]{40}$')
{
    throw 'The pull request event has invalid repository or head metadata.'
}

if ($githubEvent.pull_request.user.login -cne 'dependabot[bot]')
{
    throw 'Only Dependabot pull requests can be approved.'
}

$pullJson = gh api "repos/$repository/pulls/$number"
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not retrieve the pull request.'
}

$pull = $pullJson | ConvertFrom-Json
if ($pull.user.login -cne 'dependabot[bot]' -or $pull.state -cne 'open')
{
    throw 'Only Dependabot open pull requests can be approved.'
}

if ($githubEvent.pull_request.head.repo.id -ne $githubEvent.repository.id -or
    $githubEvent.pull_request.base.repo.id -ne $githubEvent.repository.id -or
    $pull.head.repo.id -ne $githubEvent.repository.id -or
    $pull.base.repo.id -ne $githubEvent.repository.id)
{
    throw 'The pull request must use the workflow repository for both branches.'
}

if ($pull.head.sha -cne $headSha)
{
    throw 'The pull request head has changed since the Dependabot event.'
}

$commitJson = gh api "repos/$repository/commits/$headSha"
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not retrieve the pull request head commit.'
}

$commit = $commitJson | ConvertFrom-Json
if ($commit.sha -cne $headSha -or
    $commit.author.login -cne 'dependabot[bot]' -or
    $commit.committer.login -cne 'web-flow' -or
    $commit.commit.verification.verified -ne $true -or
    $commit.commit.verification.reason -cne 'valid')
{
    throw 'The head commit must be a verified GitHub-signed Dependabot commit.'
}

gh api "repos/$repository/pulls/$number/reviews" --method POST `
    -f event=APPROVE -f "commit_id=$headSha"
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not approve the verified Dependabot commit.'
}
