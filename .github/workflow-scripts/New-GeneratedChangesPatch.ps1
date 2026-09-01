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
if ($LASTEXITCODE -eq 0)
{
    'CHANGES_PRESENT=False' >> $Env:GITHUB_OUTPUT
    return
}

if ($LASTEXITCODE -ne 1)
{
    throw 'Could not test for generated changes.'
}

$outputDirectory = Split-Path -Path $outputPath -Parent
$null = New-Item -ItemType Directory -Path $outputDirectory -Force
git diff --cached --binary --output=$outputPath
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not create the generated changes patch.'
}

'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
