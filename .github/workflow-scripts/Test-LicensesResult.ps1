# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Query the build timeline to get the notice task's result.
$timelineUrl = (
    "$Env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI" +
    "$Env:SYSTEM_TEAMPROJECTID/" +
    "_apis/build/builds/$Env:BUILD_BUILDID/timeline?api-version=7.0"
)
$headers = @{ Authorization = "Bearer $Env:SYSTEM_ACCESSTOKEN" }
$timeline = Invoke-RestMethod -Uri $timelineUrl -Headers $headers
$noticeRecord = $timeline.records |
    Where-Object { $_.name -eq 'License – Generate for Dependencies' }

$errorCount = $noticeRecord.errorCount
$warningCount = $noticeRecord.warningCount

# Determine if we should post a PR comment.
$repoApi = 'https://api.github.com/repos/microsoft/PR-Metrics'
$commentHeaders = @{
    Authorization = "token $Env:GITHUB_TOKEN"
    Accept = 'application/vnd.github.v3+json'
}

$prNumber = $Env:SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
if ([string]::IsNullOrWhiteSpace($prNumber))
{
    if ($Env:BUILD_SOURCEBRANCH -match '^refs/pull/(\d+)/')
    {
        # Extract the PR number directly from the merge ref.
        $prNumber = $Matches[1]
    }
    else
    {
        # Look up the PR from the branch name for manual runs.
        $branch = $Env:BUILD_SOURCEBRANCH -replace '^refs/heads/', ''
        $prs = @(Invoke-RestMethod -Uri "$repoApi/pulls?head=microsoft:$branch&state=open" -Headers $commentHeaders)
        if ($prs.Count -gt 0)
        {
            $prNumber = [string]$prs[0].number
        }
    }
}

if (-not [string]::IsNullOrWhiteSpace($prNumber))
{

    # Remove previous licence generation comments (both issue comments and review comments).
    $errorTemplate = (Get-Content -Path '.github/workflows/support/license-generation-error.md' -Raw).Trim()
    $warningTemplate = (Get-Content -Path '.github/workflows/support/license-generation-warning.md' -Raw).Trim()
    $issueComments = Invoke-RestMethod -Uri "$repoApi/issues/$prNumber/comments?per_page=100" -Headers $commentHeaders
    foreach ($comment in $issueComments)
    {
        if ($comment.body.StartsWith($errorTemplate) -or
            $comment.body.StartsWith($warningTemplate))
        {
            Invoke-RestMethod -Method Delete -Uri $comment.url -Headers $commentHeaders
            Write-Output -InputObject "Deleted previous licence issue comment: $($comment.id)"
        }
    }
    $reviewComments = Invoke-RestMethod -Uri "$repoApi/pulls/$prNumber/comments?per_page=100" -Headers $commentHeaders
    foreach ($comment in $reviewComments)
    {
        if ($comment.path -eq 'src/LICENSE.txt' -and
            ($comment.body.StartsWith($errorTemplate) -or $comment.body.StartsWith($warningTemplate)))
        {
            Invoke-RestMethod -Method Delete -Uri $comment.url -Headers $commentHeaders
            Write-Output -InputObject "Deleted previous licence review comment: $($comment.id)"
        }
    }

    # Fetch the task log if there are issues to report.
    $logSuffix = ''
    if ($errorCount -gt 0 -or $warningCount -gt 0)
    {
        if ($noticeRecord.log.url)
        {
            $logContent = Invoke-RestMethod -Uri $noticeRecord.log.url -Headers $headers
            $logContent = $logContent -replace '(?m)^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z ', ''
            $logSuffix = "`nBuild task output:`n" + '```text' + "`n" + $logContent + "`n" + '```'
        }
        else
        {
            Write-Output -InputObject 'notice@0 log URL not available on timeline record.'
        }
    }

    if ($errorCount -gt 0 -or $warningCount -gt 0)
    {
        $templatePath = if ($errorCount -gt 0)
        {
            '.github/workflows/support/license-generation-error.md'
        }
        else
        {
            '.github/workflows/support/license-generation-warning.md'
        }
        $commentBody = (Get-Content -Path $templatePath -Raw) + $logSuffix

        # Try file-level review comment first (works when LICENSE.txt is already in the PR diff
        # from a prior commit). Fall back to a global PR comment otherwise.
        $prInfo = Invoke-RestMethod -Uri "$repoApi/pulls/$prNumber" -Headers $commentHeaders
        $headSha = $prInfo.head.sha
        $posted = $false
        try
        {
            $body = @{
                body         = $commentBody
                commit_id    = $headSha
                path         = 'src/LICENSE.txt'
                subject_type = 'file'
            } | ConvertTo-Json
            Invoke-RestMethod -Method Post -Uri "$repoApi/pulls/$prNumber/comments" -Headers $commentHeaders -Body $body -ContentType 'application/json'
            $posted = $true
            Write-Output -InputObject 'Posted licence comment on LICENSE.txt.'
        }
        catch
        {
            Write-Output -InputObject 'LICENSE.txt not in PR diff. Falling back to PR comment.'
        }

        if (-not $posted)
        {
            $body = @{ body = $commentBody } | ConvertTo-Json
            Invoke-RestMethod -Method Post -Uri "$repoApi/issues/$prNumber/comments" -Headers $commentHeaders -Body $body -ContentType 'application/json'
            Write-Output -InputObject 'Posted licence comment on PR.'
        }
    }
}

# Set output for downstream steps.
$licensesOk = if ($errorCount -gt 0) { 'false' } else { 'true' }
Write-Output -InputObject "##vso[task.setvariable variable=LICENSES_OK;isoutput=true]$licensesOk"
