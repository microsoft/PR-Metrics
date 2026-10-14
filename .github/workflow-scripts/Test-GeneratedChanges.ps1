# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

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

git diff --cached --stat
if ($LASTEXITCODE -ne 0)
{
    throw 'Could not list generated changes.'
}

'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
