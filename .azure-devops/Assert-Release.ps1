# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

[CmdletBinding()]
param(
    [string]$RepositoryDirectory = (Split-Path -Path $PSScriptRoot -Parent)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:BUILD_SOURCEBRANCH -cne 'refs/heads/main' -or $env:BUILD_REASON -ceq 'PullRequest')
{
    throw 'Marketplace publishing requires the main branch and a non-PR run.'
}

if ($env:BUILD_REPOSITORY_NAME -ine 'microsoft/PR-Metrics')
{
    throw 'Marketplace publishing requires microsoft/PR-Metrics.'
}

$markerPath = Join-Path -Path $RepositoryDirectory -ChildPath '.github' -AdditionalChildPath 'release-publish-trigger.txt'
$version = (Get-Content -LiteralPath $markerPath -Raw).Trim()
if ($version -cnotmatch '\A(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\z')
{
    throw 'The release marker must contain one stable version in Major.Minor.Patch format.'
}

foreach ($file in @('package.json', 'package-lock.json', 'src\vss-extension.json', 'src\task\task.json', 'src\task\task.loc.json'))
{
    $manifest = Get-Content -LiteralPath (Join-Path -Path $RepositoryDirectory -ChildPath $file) -Raw |
        ConvertFrom-Json -AsHashtable
    $manifestVersion = $manifest['version']
    if ($file -in @('src\task\task.json', 'src\task\task.loc.json'))
    {
        $manifestVersion = '{0}.{1}.{2}' -f $manifestVersion['Major'], $manifestVersion['Minor'], $manifestVersion['Patch']
    }

    if ($manifestVersion -cne $version)
    {
        throw "$file version does not match release marker '$version'."
    }

    if ($file -eq 'package-lock.json' -and $manifest['packages']['']['version'] -cne $version)
    {
        throw "package-lock.json root package version does not match release marker '$version'."
    }
}

Write-Output -InputObject "Validated Marketplace release $version from main."
