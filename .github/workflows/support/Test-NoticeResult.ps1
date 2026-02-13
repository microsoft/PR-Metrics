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
    Where-Object { $_.name -eq 'Generate NOTICE File' }

$errorCount = $noticeRecord.errorCount
$warningCount = $noticeRecord.warningCount

# Determine if we should post a PR comment.
$prNumber = $Env:SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
if (-not [string]::IsNullOrWhiteSpace($prNumber))
{
    $repoApi = 'https://api.github.com/repos/microsoft/PR-Metrics'
    $commentHeaders = @{
        Authorization = "token $Env:GITHUB_TOKEN"
        Accept = 'application/vnd.github.v3+json'
    }

    if ($errorCount -gt 0)
    {
        $commentBody = Get-Content -Path '.github/workflows/support/license-generation-error.md' -Raw
        $body = @{ body = $commentBody } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$repoApi/issues/$prNumber/comments" -Headers $commentHeaders -Body $body -ContentType 'application/json'
        Write-Output -InputObject 'notice@0 failed. Posted error comment.'
    }
    elseif ($warningCount -gt 0)
    {
        $commentBody = Get-Content -Path '.github/workflows/support/license-generation-warning.md' -Raw
        if ($noticeRecord.log.url)
        {
            $logContent = Invoke-RestMethod -Uri $noticeRecord.log.url -Headers $headers
            $logContent = $logContent -replace '(?m)^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z ', ''
            $commentBody += "`nBuild task output:`n" + '```text' + "`n" + $logContent + "`n" + '```'
        }
        else
        {
            Write-Output -InputObject 'notice@0 log URL not available on timeline record.'
        }

        $body = @{ body = $commentBody } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$repoApi/issues/$prNumber/comments" -Headers $commentHeaders -Body $body -ContentType 'application/json'
        Write-Output -InputObject "notice@0 had $warningCount warning(s). Posted comment."
    }
}

# Set output for downstream steps.
$noticeOk = if ($errorCount -gt 0) { 'false' } else { 'true' }
Write-Output -InputObject "##vso[task.setvariable variable=NOTICE_OK;isoutput=true]$noticeOk"
