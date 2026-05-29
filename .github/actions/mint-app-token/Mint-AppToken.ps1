#!/usr/bin/env pwsh
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Mints a GitHub App installation token by signing the App JWT with the
# App's private key stored in Azure Key Vault. The key never leaves the
# vault: Key Vault performs the RS256 signing operation and returns only
# the signature.

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

foreach ($name in 'APP_ID', 'INSTALLATION_ID', 'KV_NAME', 'KEY_NAME', 'GITHUB_OUTPUT') {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
        throw "Required environment variable '$name' is not set."
    }
}

function ConvertTo-Base64Url {
    param([Parameter(Mandatory)][byte[]] $Bytes)
    [Convert]::ToBase64String($Bytes) -replace '\+', '-' -replace '/', '_' -replace '=+$', ''
}

# JWT header and payload. The 60-second backdated `iat` absorbs minor clock
# skew between the runner and GitHub. The 9-minute `exp` is well within
# GitHub's 10-minute ceiling for App JWTs.
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$headerJson = '{"alg":"RS256","typ":"JWT"}'
$payloadJson = ConvertTo-Json -Compress -InputObject ([ordered] @{
    iat = $now - 60
    exp = $now + 540
    iss = $env:APP_ID
})

$headerB64 = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($headerJson))
$payloadB64 = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($payloadJson))
$signingInput = "$headerB64.$payloadB64"

# Key Vault expects a base64-encoded SHA-256 digest. It returns a
# base64-encoded RS256 signature.
$digest = [Convert]::ToBase64String(
    [Security.Cryptography.SHA256]::HashData(
        [Text.Encoding]::UTF8.GetBytes($signingInput)))

$signatureB64 = az keyvault key sign `
    --vault-name $env:KV_NAME `
    --name $env:KEY_NAME `
    --algorithm RS256 `
    --value $digest `
    --query value `
    --output tsv

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($signatureB64)) {
    throw 'Key Vault signing operation failed.'
}

$signatureB64Url = $signatureB64 -replace '\+', '-' -replace '/', '_' -replace '=+$', ''
$jwt = "$signingInput.$signatureB64Url"

$response = Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.github.com/app/installations/$env:INSTALLATION_ID/access_tokens" `
    -Headers @{
        Authorization = "Bearer $jwt"
        Accept = 'application/vnd.github+json'
        'X-GitHub-Api-Version' = '2022-11-28'
    }

# Mask the token in logs before exposing it as a step output.
"::add-mask::$($response.token)" | Write-Output
"token=$($response.token)" | Out-File -FilePath $env:GITHUB_OUTPUT -Append -Encoding utf8NoBOM
