# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Mints a short-lived 'microsoft-pr-metrics' installation token by signing the
# App JWT remotely in Azure Key Vault, so the App private key is never exported.
# Shared by the 'mint-github-app-token' composite action (GitHub Actions) and
# the Azure DevOps pipeline. The signing identity is whoever the caller is
# signed in as – the GitHub OIDC federated identity (azure/login) or the Azure
# DevOps workload identity federation service connection (AzureCLI@2) – which
# must hold 'Key Vault Crypto User' on the vault. Configuration is read from the
# environment, and the token is published in the form the host CI understands.

$ErrorActionPreference = 'Stop'

$apiUrl = 'https://api.github.com'
$keyVaultApiVersion = '2025-07-01'
$outputVariable = 'GitHubAppToken'

$clientId = 'Iv23lilx6AekMDUze7ss'
$owner = 'microsoft'
$repositoryName = 'PR-Metrics'
$vaultName = 'PRMetrics-KeyVault'
$keyName = 'github-app-signing-key'

$permissionsJson = $env:GITHUB_APP_PERMISSIONS
if ([string]::IsNullOrWhiteSpace($permissionsJson))
{
    throw "The 'GITHUB_APP_PERMISSIONS' environment variable is not set."
}

function ConvertTo-Base64Url
{
    param
    (
        [Parameter(Mandatory = $true)]
        [byte[]] $Bytes
    )

    return [System.Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Get-KeyVaultAccessToken
{
    # The caller (azure/login or AzureCLI@2) is already signed in, so the
    # data-plane token is acquired without any stored secret.
    $token = az account get-access-token --resource 'https://vault.azure.net' --query accessToken --output tsv
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token))
    {
        throw 'Could not acquire an Azure Key Vault access token. Ensure the caller is signed in to Azure with an identity holding the ''Key Vault Crypto User'' role on the vault.'
    }

    return $token.Trim()
}

function Get-JsonWebToken
{
    param
    (
        [Parameter(Mandatory = $true)]
        [string] $ClientId,
        [Parameter(Mandatory = $true)]
        [string] $VaultName,
        [Parameter(Mandatory = $true)]
        [string] $KeyName,
        [Parameter(Mandatory = $true)]
        [string] $VaultAccessToken
    )

    $issuedAt = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $header = [ordered] @{
        alg = 'RS256'
        typ = 'JWT'
    }
    $payload = [ordered] @{
        exp = $issuedAt + 540
        iat = $issuedAt - 60
        iss = $ClientId
    }

    $headerEncoded = ConvertTo-Base64Url -Bytes ([System.Text.Encoding]::UTF8.GetBytes(($header | ConvertTo-Json -Compress)))
    $payloadEncoded = ConvertTo-Base64Url -Bytes ([System.Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Compress)))
    $signingInput = "$headerEncoded.$payloadEncoded"

    # Key Vault's RS256 sign operation expects the SHA-256 digest of the signing
    # input, not the raw value, and returns the PKCS#1 v1.5 signature already in
    # base64url form, so it drops straight into the JWT's third segment.
    $digest = [System.Security.Cryptography.SHA256]::HashData([System.Text.Encoding]::ASCII.GetBytes($signingInput))
    $signUri = "https://$VaultName.vault.azure.net/keys/$KeyName/sign?api-version=$keyVaultApiVersion"
    $signBody = @{
        alg   = 'RS256'
        value = ConvertTo-Base64Url -Bytes $digest
    }

    try
    {
        $response = Invoke-RestMethod -Uri $signUri -Method 'Post' -ContentType 'application/json' -Body ($signBody | ConvertTo-Json -Compress) -Headers @{
            Authorization = "Bearer $VaultAccessToken"
        }
    }
    catch
    {
        # The error body never contains the signature, so it is safe to surface.
        $detail = $_.ErrorDetails.Message
        if ([string]::IsNullOrWhiteSpace($detail))
        {
            $detail = $_.Exception.Message
        }

        throw "The Azure Key Vault sign request to '$signUri' failed: $detail"
    }

    if ([string]::IsNullOrWhiteSpace($response.value))
    {
        throw 'The Azure Key Vault sign request returned no signature.'
    }

    return "$signingInput.$($response.value)"
}

function Invoke-GitHubApi
{
    param
    (
        [Parameter(Mandatory = $true)]
        [string] $Uri,
        [Parameter(Mandatory = $true)]
        [string] $Jwt,
        [Parameter(Mandatory = $true)]
        [string] $Method,
        [Parameter(Mandatory = $false)]
        [object] $Body
    )

    $parameters = @{
        Uri       = $Uri
        Method    = $Method
        UserAgent = 'PR-Metrics'
        Headers   = @{
            Accept                 = 'application/vnd.github+json'
            Authorization          = "Bearer $Jwt"
            'X-GitHub-Api-Version' = '2022-11-28'
        }
    }
    if ($null -ne $Body)
    {
        $parameters.Body = $Body | ConvertTo-Json -Compress -Depth 10
        $parameters.ContentType = 'application/json'
    }

    try
    {
        return Invoke-RestMethod @parameters
    }
    catch
    {
        # The error body never contains the token, so it is safe to surface.
        $detail = $_.ErrorDetails.Message
        if ([string]::IsNullOrWhiteSpace($detail))
        {
            $detail = $_.Exception.Message
        }

        throw "GitHub API request to '$Uri' failed: $detail"
    }
}

$vaultAccessToken = Get-KeyVaultAccessToken

# Mask the data-plane token on whichever host before it is used, so the bearer
# token cannot surface in verbose or debug logs – the installation token is
# masked the same way once minted.
if ($env:GITHUB_ACTIONS -eq 'true')
{
    Write-Output -InputObject "::add-mask::$vaultAccessToken"
}
elseif (-not [string]::IsNullOrWhiteSpace($env:TF_BUILD))
{
    Write-Output -InputObject "##vso[task.setvariable variable=KeyVaultAccessToken;issecret=true]$vaultAccessToken"
}

$jwt = Get-JsonWebToken -ClientId $clientId -VaultName $vaultName -KeyName $keyName -VaultAccessToken $vaultAccessToken

$installation = Invoke-GitHubApi -Uri "$apiUrl/repos/$owner/$repositoryName/installation" -Jwt $jwt -Method 'Get'
if ($null -eq $installation.id)
{
    throw "Could not determine the App installation for '$owner/$repositoryName'."
}

$body = @{
    repositories = @($repositoryName)
    permissions  = ($permissionsJson | ConvertFrom-Json)
}
$accessToken = Invoke-GitHubApi -Uri "$apiUrl/app/installations/$($installation.id)/access_tokens" -Jwt $jwt -Method 'Post' -Body $body
if ([string]::IsNullOrWhiteSpace($accessToken.token))
{
    throw 'The GitHub App installation token could not be minted.'
}

if ($env:GITHUB_ACTIONS -eq 'true')
{
    # Mask the token before it can appear in the log, then publish it as a step
    # output for downstream steps.
    Write-Output -InputObject "::add-mask::$($accessToken.token)"
    "token=$($accessToken.token)" | Out-File -FilePath $env:GITHUB_OUTPUT -Append
}
elseif (-not [string]::IsNullOrWhiteSpace($env:TF_BUILD))
{
    # Register the token as a secret so it is masked in the logs, then expose it
    # to the subsequent PR Metrics step via the output variable.
    Write-Output -InputObject "##vso[task.setvariable variable=$outputVariable;issecret=true]$($accessToken.token)"
}
else
{
    throw 'Unable to determine the CI host: neither GITHUB_ACTIONS nor TF_BUILD is set.'
}

Write-Output -InputObject "Minted an installation token for '$owner/$repositoryName' (installation $($installation.id))."
