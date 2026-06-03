# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Mints a short-lived 'pr-metrics-access-app' installation token, scoped to
# 'Pull requests: write', and publishes it to the job as a secret variable so PR
# Metrics can update the originating GitHub pull request. Only the private key is
# a secret, read from the GITHUB_APP_PRIVATE_KEY environment variable; the App's
# client ID, repository, and endpoints are fixed below.

$ErrorActionPreference = 'Stop'

$clientId = 'Iv23lilx6AekMDUze7ss'
$repository = 'microsoft/PR-Metrics'
$apiUrl = 'https://api.github.com'
$outputVariable = 'GitHubAppToken'

function ConvertTo-Base64Url
{
    param
    (
        [Parameter(Mandatory = $true)]
        [byte[]] $Bytes
    )

    return [System.Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function New-JsonWebToken
{
    param
    (
        [Parameter(Mandatory = $true)]
        [string] $ClientId,
        [Parameter(Mandatory = $true)]
        [string] $PrivateKey
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

    $rsa = [System.Security.Cryptography.RSA]::Create()
    try
    {
        # Normalize keys that arrive with escaped newlines from the secret store.
        $rsa.ImportFromPem(($PrivateKey -replace '\\n', "`n"))
        $signature = $rsa.SignData(
            [System.Text.Encoding]::ASCII.GetBytes($signingInput),
            [System.Security.Cryptography.HashAlgorithmName]::SHA256,
            [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
    }
    finally
    {
        $rsa.Dispose()
    }

    return "$signingInput.$(ConvertTo-Base64Url -Bytes $signature)"
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

$privateKey = [System.Environment]::GetEnvironmentVariable('GITHUB_APP_PRIVATE_KEY')
if ([string]::IsNullOrWhiteSpace($privateKey))
{
    throw "The 'GITHUB_APP_PRIVATE_KEY' environment variable is not set."
}

$jwt = New-JsonWebToken -ClientId $clientId -PrivateKey $privateKey

$installation = Invoke-GitHubApi -Uri "$apiUrl/repos/$repository/installation" -Jwt $jwt -Method 'Get'
if ($null -eq $installation.id)
{
    throw "Could not determine the App installation for '$repository'."
}

$accessToken = Invoke-GitHubApi -Uri "$apiUrl/app/installations/$($installation.id)/access_tokens" -Jwt $jwt -Method 'Post' -Body @{ permissions = @{ pull_requests = 'write' } }
if ([string]::IsNullOrWhiteSpace($accessToken.token))
{
    throw 'The GitHub App installation token could not be minted.'
}

# Register the token as a secret so it is masked in the logs, then expose it to
# the subsequent PR Metrics step via the output variable.
Write-Host "##vso[task.setvariable variable=$outputVariable;issecret=true]$($accessToken.token)"
Write-Host "Minted an installation token for '$repository' (installation $($installation.id))."
