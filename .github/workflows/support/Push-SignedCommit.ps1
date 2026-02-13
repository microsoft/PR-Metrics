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
    Write-Output -InputObject 'No licence changes to commit.'
    return
}

# Get the branch HEAD OID for the commit mutation.
$refInfo = Invoke-RestMethod -Uri "$repoApi/git/ref/heads/$branch" -Headers $headers
$headOid = $refInfo.object.sha

# Create a signed commit via the GraphQL API.
$base64Content = [Convert]::ToBase64String($fileBytes)
$query = @'
mutation ($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) {
        commit {
            url
        }
    }
}
'@
$variables = @{
    input = @{
        branch = @{
            repositoryNameWithOwner = 'microsoft/PR-Metrics'
            branchName              = $branch
        }
        message = @{
            headline = 'chore: update licence notices'
        }
        fileChanges = @{
            additions = @(
                @{
                    path     = $filePath
                    contents = $base64Content
                }
            )
        }
        expectedHeadOid = $headOid
    }
}
$body = @{
    query     = $query
    variables = $variables
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Post -Uri 'https://api.github.com/graphql' -Headers $headers -Body $body -ContentType 'application/json'

if ($response.errors)
{
    $errorMessage = $response.errors | ConvertTo-Json -Depth 5
    Write-Error -Message "GraphQL error: $errorMessage"
    exit 1
}

Write-Output -InputObject "Licence notices committed via GitHub API (signed): $($response.data.createCommitOnBranch.commit.url)"
