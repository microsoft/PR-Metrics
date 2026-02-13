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
    # Look up the PR from the branch name for manual runs.
    $branch = $Env:BUILD_SOURCEBRANCH -replace '^refs/heads/', ''
    $prs = @(Invoke-RestMethod -Uri "$repoApi/pulls?head=microsoft:$branch&state=open" -Headers $commentHeaders)
    if ($prs.Count -gt 0)
    {
        $prNumber = [string]$prs[0].number
    }
}

if (-not [string]::IsNullOrWhiteSpace($prNumber))
{

    # Get the PR's HEAD SHA for file-level review comments.
    $prInfo = Invoke-RestMethod -Uri "$repoApi/pulls/$prNumber" -Headers $commentHeaders
    $headSha = $prInfo.head.sha

    # Remove previous licence generation review comments on LICENSE.txt.
    $errorTemplate = (Get-Content -Path '.github/workflows/support/license-generation-error.md' -Raw).Trim()
    $warningTemplate = (Get-Content -Path '.github/workflows/support/license-generation-warning.md' -Raw).Trim()
    $reviewComments = Invoke-RestMethod -Uri "$repoApi/pulls/$prNumber/comments?per_page=100" -Headers $commentHeaders
    foreach ($comment in $reviewComments)
    {
        if ($comment.path -eq 'src/LICENSE.txt' -and
            ($comment.body.StartsWith($errorTemplate) -or $comment.body.StartsWith($warningTemplate)))
        {
            Invoke-RestMethod -Method Delete -Uri $comment.url -Headers $commentHeaders
            Write-Output -InputObject "Deleted previous licence comment: $($comment.id)"
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

    if ($errorCount -gt 0)
    {
        $commentBody = (Get-Content -Path '.github/workflows/support/license-generation-error.md' -Raw) + $logSuffix
        $body = @{
            body         = $commentBody
            commit_id    = $headSha
            path         = 'src/LICENSE.txt'
            subject_type = 'file'
        } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$repoApi/pulls/$prNumber/comments" -Headers $commentHeaders -Body $body -ContentType 'application/json'
        Write-Output -InputObject 'notice@0 failed. Posted error comment on LICENSE.txt.'
    }
    elseif ($warningCount -gt 0)
    {
        $commentBody = (Get-Content -Path '.github/workflows/support/license-generation-warning.md' -Raw) + $logSuffix
        $body = @{
            body         = $commentBody
            commit_id    = $headSha
            path         = 'src/LICENSE.txt'
            subject_type = 'file'
        } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$repoApi/pulls/$prNumber/comments" -Headers $commentHeaders -Body $body -ContentType 'application/json'
        Write-Output -InputObject "notice@0 had $warningCount warning(s). Posted comment on LICENSE.txt."
    }
}

# Set output for downstream steps.
$licensesOk = if ($errorCount -gt 0) { 'false' } else { 'true' }
Write-Output -InputObject "##vso[task.setvariable variable=LICENSES_OK;isoutput=true]$licensesOk"
