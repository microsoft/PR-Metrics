# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [Parameter(Mandatory)]
    [int]$Major,

    [Parameter(Mandatory)]
    [int]$Minor,

    [Parameter(Mandatory)]
    [int]$Patch
)

$Version = "$Major.$Minor.$Patch"

# README.md
$FilePath = 'README.md'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace 'PR-Metrics@v\d+\.\d+\.\d+', "PR-Metrics@v$Version"
Set-Content -Path $FilePath -Value $FileContents

# package.json
$FilePath = 'package.json'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Set-Content -Path $FilePath -Value $FileContents

# src/vss-extension.json
$FilePath = 'src/vss-extension.json'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace '"version": "\d+\.\d+\.\d+"', "`"version`": `"$Version`""
Set-Content -Path $FilePath -Value $FileContents

# src/task/task.json
$FilePath = 'src/task/task.json'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace 'PR Metrics v\d+\.\d+\.\d+', "PR Metrics v$Version"
$FileContents = $FileContents -replace '"Major": \d+', "`"Major`": $Major"
$FileContents = $FileContents -replace '"Minor": \d+', "`"Minor`": $Minor"
$FileContents = $FileContents -replace '"Patch": \d+', "`"Patch`": $Patch"
Set-Content -Path $FilePath -Value $FileContents

# src/task/task.loc.json
$FilePath = 'src/task/task.loc.json'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace '"Major": \d+', "`"Major`": $Major"
$FileContents = $FileContents -replace '"Minor": \d+', "`"Minor`": $Minor"
$FileContents = $FileContents -replace '"Patch": \d+', "`"Patch`": $Patch"
Set-Content -Path $FilePath -Value $FileContents

# src/task/Strings/resources.resjson/en-US/resources.resjson
$FilePath = 'src/task/Strings/resources.resjson/en-US/resources.resjson'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace 'PR Metrics v\d+\.\d+\.\d+', "PR Metrics v$Version"
Set-Content -Path $FilePath -Value $FileContents

# src/task/src/repos/gitHubReposInvoker.ts
$FilePath = 'src/task/src/repos/gitHubReposInvoker.ts'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace 'PRMetrics\/v\d+\.\d+\.\d+', "PRMetrics/v$Version"
Set-Content -Path $FilePath -Value $FileContents

# src/task/tests/repos/gitHubReposInvoker.spec.ts
$FilePath = 'src/task/tests/repos/gitHubReposInvoker.spec.ts'
$FileContents = Get-Content -Path $FilePath
$FileContents = $FileContents -replace 'PRMetrics\/v\d+\.\d+\.\d+', "PRMetrics/v$Version"
Set-Content -Path $FilePath -Value $FileContents

# Increment patch for next release.
$IncrementedPatch = $Patch + 1

# .github/workflows/release-phase-1.yml (self-update with incremented patch).
$FilePath = '.github/workflows/release-phase-1.yml'
$FileContents = Get-Content -Raw -Path $FilePath
$FileContents = $FileContents -replace '(?<Yaml>major: )\d+', "`${Yaml}$Major"
$FileContents = $FileContents -replace '(?<Yaml>minor: )\d+', "`${Yaml}$Minor"
$FileContents = $FileContents -replace '(?<Yaml>patch: )\d+', "`${Yaml}$IncrementedPatch"
Set-Content -Path $FilePath -Value $FileContents.Substring(0, $FileContents.Length - 1)  # Remove the trailing newline.
