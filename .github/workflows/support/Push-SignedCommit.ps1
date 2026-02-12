# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$filePath = 'src/LICENSE.txt'
$repoApi = 'https://api.github.com/repos/microsoft/PR-Metrics'
$headers = @{
    Authorization = "token $Env:GITHUB_TOKEN"
    Accept        = 'application/vnd.github.v3+json'
}

# Get the source branch name (strip refs/heads/ prefix).
$branch = $Env:SYSTEM_PULLREQUEST_SOURCEBRANCH -replace '^refs/heads/', ''

# Read the updated file.
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)

# Compute the local file's git blob SHA to detect changes.
$headerBytes = [System.Text.Encoding]::ASCII.GetBytes("blob $($fileBytes.Length)`0")
$blobBytes = [byte[]]::new($headerBytes.Length + $fileBytes.Length)
[Array]::Copy($headerBytes, $blobBytes, $headerBytes.Length)
[Array]::Copy($fileBytes, 0, $blobBytes, $headerBytes.Length, $fileBytes.Length)
$hashBytes = [System.Security.Cryptography.SHA1]::Create().ComputeHash($blobBytes)
$localSha = -join ($hashBytes | ForEach-Object { $_.ToString('x2') })

# Get the remote file's blob SHA.
$fileInfo = Invoke-RestMethod `
    -Uri "$repoApi/contents/$($filePath)?ref=$branch" `
    -Headers $headers
$remoteSha = $fileInfo.sha

if ($localSha -eq $remoteSha)
{
    Write-Host -Object 'No licence changes to commit.'
    return
}

# Update the file via the GitHub API (creates a signed commit).
$base64Content = [Convert]::ToBase64String($fileBytes)
$body = @{
    message = 'chore: update licence notices'
    content = $base64Content
    sha     = $remoteSha
    branch  = $branch
} | ConvertTo-Json

Invoke-RestMethod -Method Put -Uri "$repoApi/contents/$filePath" -Headers $headers -Body $body -ContentType 'application/json'

Write-Host -Object 'Licence notices committed via GitHub API (signed).'
