# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$licenseFile = "$env:SYSTEM_DEFAULTWORKINGDIRECTORY/src/LICENSE.txt"
if (-not (Test-Path -Path $licenseFile))
{
    Write-Host -Object 'src/LICENSE.txt not found. Terminating.'
    exit 1
}

# Extract the PR Metrics section (before the first all-hyphens separator).
$lines = Get-Content -Path $licenseFile
$prLines = @()
foreach ($line in $lines)
{
    if ($line -match '^-+$')
    {
        break
    }

    $prLines += $line
}

$prSection = ($prLines -join "`n").TrimEnd("`n") + "`n"

# GitHub API headers (reused for content and comment API calls).
$headers = @{
    Accept        = 'application/vnd.github.v3+json'
    Authorization = "token $env:GITHUB_PAT"
}

# Build combined content.
$noticeFile = "$env:SYSTEM_DEFAULTWORKINGDIRECTORY/temp/NOTICE.txt"
if (Test-Path -Path $noticeFile)
{
    Write-Host -Object 'NOTICE file found. Adding third-party notices.'
    $noticeText = ((Get-Content -Path $noticeFile -Raw) -replace "`r", '').TrimEnd("`n")
    $content = $prSection + "`n" + $noticeText + "`n"
}
else
{
    Write-Host -Object 'NOTICE file not found. Using PR Metrics license only.'
    $content = $prSection
}

# Post a PR comment if the Validation job encountered issues (warnings or errors).
if ($env:BUILD_REASON -eq 'PullRequest' -and $env:PR_NUMBER -and $env:AGENT_JOBSTATUS -ne 'Succeeded')
{
    Write-Host -Object "Job status: $env:AGENT_JOBSTATUS. Posting PR comment."
    $marker = '<!-- pr-metrics-notice-warning -->'
    $commentsUrl = "https://api.github.com/repos/$env:REPO_NAME/issues/$env:PR_NUMBER/comments?per_page=100"
    try
    {
        $existing = Invoke-RestMethod -Uri $commentsUrl -Headers $headers -Method Get -ErrorAction Stop
        if (-not ($existing | Where-Object { $_.body -like "*$marker*" }))
        {
            if (Test-Path -Path $noticeFile)
            {
                $commentBody =
                    "**Notice Generation Warning**`n`n" +
                    "The ``notice@0`` task completed with warnings. " +
                    "``src/LICENSE.txt`` has been updated but the third-party notices may be incomplete. " +
                    "Check the pipeline logs for details.`n`n" +
                    $marker
            }
            else
            {
                $commentBody =
                    "**Notice Generation Warning**`n`n" +
                    "The ``notice@0`` task did not produce a NOTICE file. " +
                    "``src/LICENSE.txt`` has been updated with only the PR Metrics license. " +
                    "Third-party notices are not included.`n`n" +
                    $marker
            }

            $commentJson = ConvertTo-Json -InputObject @{ body = $commentBody } -Compress
            Invoke-RestMethod -Uri $commentsUrl -Headers $headers -Method Post -Body $commentJson -ContentType 'application/json' | Out-Null
            Write-Host -Object 'PR comment posted about NOTICE generation issues.'
        }
        else
        {
            Write-Host -Object 'PR comment already exists. Skipping.'
        }
    }
    catch
    {
        Write-Host -Object "Failed to post PR comment: $($_.Exception.Message)"
    }
}

# Determine target branch.
if ($env:BUILD_REASON -eq 'PullRequest')
{
    $branch = $env:PR_SOURCE_BRANCH
}
else
{
    $branch = $env:SOURCE_BRANCH
}

$branch = $branch -replace '^refs/heads/', ''
Write-Host -Object "Target branch: $branch"

# Base64-encode the content.
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$contentBase64 = [System.Convert]::ToBase64String($bytes)

# Check if the file already exists and is unchanged.
$apiUrl = "https://api.github.com/repos/$env:REPO_NAME/contents/src/LICENSE.txt"

$existingSha = $null
try
{
    $response = Invoke-RestMethod -Uri "${apiUrl}?ref=${branch}" -Headers $headers -Method Get -ErrorAction Stop
    $existingSha = $response.sha
    $existingContent = $response.content -replace '[\r\n]', ''
    if ($contentBase64 -eq $existingContent)
    {
        Write-Host -Object 'src/LICENSE.txt is unchanged (content matches). Skipping commit.'
        exit 0
    }

    Write-Host -Object 'src/LICENSE.txt has changed. Updating.'
}
catch
{
    Write-Host -Object "GitHub API GET status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host -Object 'src/LICENSE.txt not found on branch. Creating.'
}

# Build and send the PUT request.
$payload = @{
    message = 'Update src/LICENSE.txt [skip ci]'
    content = $contentBase64
    branch  = $branch
}

if ($existingSha)
{
    $payload.sha = $existingSha
}

$body = ConvertTo-Json -InputObject $payload -Compress
Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Put -Body $body -ContentType 'application/json' | Out-Null
Write-Host 'src/LICENSE.txt committed successfully.'
