# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Constants.
$filePath = 'src/LICENSE.txt'
$repoWithOwner = 'microsoft/PR-Metrics'
$repoApi = "https://api.github.com/repos/$repoWithOwner"
$graphqlUri = 'https://api.github.com/graphql'
$headers = @{
    Authorization = "token $Env:GITHUB_TOKEN"
    Accept        = 'application/vnd.github.v3+json'
}

function Get-BranchName
{
    # SYSTEM_PULLREQUEST_SOURCEBRANCH is set for PR-triggered builds.
    # BUILD_SOURCEBRANCH may be refs/pull/{id}/merge for PR builds or refs/heads/{branch} for manual runs.
    $branchReference = if (-not [string]::IsNullOrWhiteSpace($Env:SYSTEM_PULLREQUEST_SOURCEBRANCH))
    {
        $Env:SYSTEM_PULLREQUEST_SOURCEBRANCH
    }
    elseif ($Env:BUILD_SOURCEBRANCH -match '^refs/pull/(\d+)/')
    {
        $prNumber = $Matches[1]
        $prInfo = Invoke-RestMethod -Uri "$repoApi/pulls/$prNumber" -Headers $headers
        $prInfo.head.ref
    }
    else
    {
        $Env:BUILD_SOURCEBRANCH
    }

    return $branchReference -replace '^refs/heads/', ''
}

function Get-GitBlobSha
{
    param (
        [Parameter(Mandatory)]
        [byte[]]$FileBytes
    )

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes("blob $($FileBytes.Length)`0")
    $blobBytes = [byte[]]::new($headerBytes.Length + $FileBytes.Length)
    [Array]::Copy($headerBytes, $blobBytes, $headerBytes.Length)
    [Array]::Copy($FileBytes, 0, $blobBytes, $headerBytes.Length, $FileBytes.Length)
    $hashBytes = [System.Security.Cryptography.SHA1]::Create().ComputeHash($blobBytes)
    return -join ($hashBytes | ForEach-Object { $_.ToString('x2') })
}

function New-SignedCommit
{
    param (
        [Parameter(Mandatory)]
        [string]$Branch,

        [Parameter(Mandatory)]
        [byte[]]$FileBytes
    )

    # Resolve the branch HEAD OID.
    $headQuery = @'
query ($qualifiedName: String!) {
    repository(owner: "microsoft", name: "PR-Metrics") {
        ref(qualifiedName: $qualifiedName) {
            target {
                oid
            }
        }
    }
}
'@
    $headBody = @{
        query     = $headQuery
        variables = @{ qualifiedName = "refs/heads/$Branch" }
    } | ConvertTo-Json
    $headResponse = Invoke-RestMethod -Method Post -Uri $graphqlUri -Headers $headers -Body $headBody -ContentType 'application/json'
    $headOid = $headResponse.data.repository.ref.target.oid

    # Create the signed commit.
    $mutation = @'
mutation ($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) {
        commit {
            url
        }
    }
}
'@
    $base64Content = [Convert]::ToBase64String($FileBytes)
    $variables = @{
        input = @{
            branch = @{
                repositoryNameWithOwner = $repoWithOwner
                branchName              = $Branch
            }
            message = @{
                headline = 'chore: update license notices'
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
        query     = $mutation
        variables = $variables
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Method Post -Uri $graphqlUri -Headers $headers -Body $body -ContentType 'application/json'
    if ($response.errors)
    {
        $errorMessage = $response.errors | ConvertTo-Json -Depth 5
        Write-Error -Message "GraphQL error: $errorMessage"
        exit 1
    }

    return $response.data.createCommitOnBranch.commit.url
}

$branch = Get-BranchName
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$localSha = Get-GitBlobSha -FileBytes $fileBytes
$fileInfo = Invoke-RestMethod -Uri "$repoApi/contents/$($filePath)?ref=$branch" -Headers $headers
if ($localSha -eq $fileInfo.sha)
{
    Write-Output -InputObject 'No license changes to commit.'
    return
}

$commitUrl = New-SignedCommit -Branch $branch -FileBytes $fileBytes
Write-Output -InputObject "License notices committed via GitHub API (signed): $commitUrl"
