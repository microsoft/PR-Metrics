# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$outputPath = 'generated/generated-changes.patch'

git add -A
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not stage generated changes.'
}

git diff --cached --quiet
$diffExitCode = $LASTEXITCODE
if ($diffExitCode -notin @(0, 1))
{
    throw 'Could not test for generated changes.'
}

$outputDirectory = Split-Path -Path $outputPath -Parent
$null = New-Item -ItemType Directory -Path $outputDirectory -Force
if ($diffExitCode -eq 0)
{
    [System.IO.File]::WriteAllBytes((Join-Path -Path (Get-Location).Path -ChildPath $outputPath), [byte[]]@())
    'CHANGES_PRESENT=False' >> $Env:GITHUB_OUTPUT
    return
}

git diff --cached --binary --output=$outputPath
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not create the generated changes patch.'
}

'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
