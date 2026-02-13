# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Constants.
$licenseFilePath = 'src/LICENSE.txt'
$repoApi = 'https://api.github.com/repos/microsoft/PR-Metrics'
$errorTemplatePath = '.github/workflows/support/license-generation-error.md'
$warningTemplatePath = '.github/workflows/support/license-generation-warning.md'
$azureDevOpsHeaders = @{ Authorization = "Bearer $Env:SYSTEM_ACCESSTOKEN" }
$gitHubHeaders = @{
    Authorization = "token $Env:GITHUB_TOKEN"
    Accept        = 'application/vnd.github.v3+json'
}

function Get-PullRequestNumber
{
    if (-not [string]::IsNullOrWhiteSpace($Env:SYSTEM_PULLREQUEST_PULLREQUESTNUMBER))
    {
        return [int]$Env:SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
    }

    if ($Env:BUILD_SOURCEBRANCH -match '^refs/pull/(\d+)/')
    {
        # Extract the PR number directly from the merge reference.
        return [int]$Matches[1]
    }

    # Look up the PR from the branch name for manual runs.
    $branch = $Env:BUILD_SOURCEBRANCH -replace '^refs/heads/', ''
    $prs = @(Invoke-RestMethod -Uri "$repoApi/pulls?head=microsoft:$branch&state=open" -Headers $gitHubHeaders)
    if ($prs.Count -gt 0)
    {
        return $prs[0].number
    }

    throw 'Unable to determine the pull request.'
}

function Remove-OutdatedComments
{
    param (
        [Parameter(Mandatory)]
        [int]$PullRequestNumber
    )

    $marker = '<!-- pr-metrics-license-comment -->'

    $issueComments = Invoke-RestMethod -Uri "$repoApi/issues/$PullRequestNumber/comments?per_page=100" -Headers $gitHubHeaders
    foreach ($comment in $issueComments)
    {
        if ($comment.body.Contains($marker))
        {
            Invoke-RestMethod -Method Delete -Uri $comment.url -Headers $gitHubHeaders | Out-Null
            Write-Output -InputObject "Deleted outdated license issue comment: $($comment.id)"
        }
    }

    $reviewComments = Invoke-RestMethod -Uri "$repoApi/pulls/$PullRequestNumber/comments?per_page=100" -Headers $gitHubHeaders
    foreach ($comment in $reviewComments)
    {
        if ($comment.path -eq $licenseFilePath -and $comment.body.Contains($marker))
        {
            Invoke-RestMethod -Method Delete -Uri $comment.url -Headers $gitHubHeaders | Out-Null
            Write-Output -InputObject "Deleted outdated license review comment: $($comment.id)"
        }
    }
}

function Get-TaskLogSuffix
{
    param (
        [Parameter(Mandatory)]
        [PSCustomObject]$NoticeRecord
    )

    if (-not $NoticeRecord.log.url)
    {
        throw 'notice@0 log URL not available on timeline record.'
    }

    $logContent = Invoke-RestMethod -Uri $NoticeRecord.log.url -Headers $azureDevOpsHeaders
    $logContent = $logContent -replace '(?m)^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z ', ''
    return @"

## Build Task Output

``````text
$logContent
``````
"@
}

function Submit-LicenseComment
{
    param (
        [Parameter(Mandatory)]
        [int]$PullRequestNumber,

        [Parameter(Mandatory)]
        [string]$CommentBody
    )

    # Try file-level review comment first (works when LICENSE.txt is already in
    # the PR diff from a prior commit). Fall back to a global PR comment
    # otherwise.
    $prInfo = Invoke-RestMethod -Uri "$repoApi/pulls/$PullRequestNumber" -Headers $gitHubHeaders
    $headSha = $prInfo.head.sha
    try
    {
        $body = @{
            body         = $CommentBody
            commit_id    = $headSha
            path         = $licenseFilePath
            subject_type = 'file'
        } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$repoApi/pulls/$PullRequestNumber/comments" -Headers $gitHubHeaders -Body $body -ContentType 'application/json' | Out-Null
        Write-Output -InputObject 'Added a license comment on LICENSE.txt.'
    }
    catch
    {
        Write-Output -InputObject 'LICENSE.txt not in PR diff. Falling back to PR comment.'
        $body = @{ body = $CommentBody } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$repoApi/issues/$PullRequestNumber/comments" -Headers $gitHubHeaders -Body $body -ContentType 'application/json' | Out-Null
        Write-Output -InputObject 'Added a license comment on PR.'
    }
}

# Query the build timeline to get the notice task's result.
$timelineUrl = (
    "$Env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI" +
    "$Env:SYSTEM_TEAMPROJECTID/" +
    "_apis/build/builds/$Env:BUILD_BUILDID/timeline?api-version=7.1"
)
$noticeRecord = (Invoke-RestMethod -Uri $timelineUrl -Headers $azureDevOpsHeaders).records |
    Where-Object { $_.name -eq 'License – Generate for Dependencies' }

$prNumber = Get-PullRequestNumber
Remove-OutdatedComments -PullRequestNumber $prNumber
if ($noticeRecord.errorCount -gt 0 -or $noticeRecord.warningCount -gt 0)
{
    $templatePath = if ($noticeRecord.errorCount -gt 0) { $errorTemplatePath } else { $warningTemplatePath }
    $commentBody = (Get-Content -Path $templatePath -Raw) + (Get-TaskLogSuffix -NoticeRecord $noticeRecord)
    Submit-LicenseComment -PullRequestNumber $prNumber -CommentBody $commentBody
}

# Set output for downstream steps.
$licensesResult = $noticeRecord.errorCount -eq 0
Write-Output -InputObject "##vso[task.setvariable variable=LICENSES_OK;isoutput=true]$licensesResult"
