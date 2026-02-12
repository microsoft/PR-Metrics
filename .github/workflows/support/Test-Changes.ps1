# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$gitStatus = git status --porcelain
Write-Host -Object $gitStatus
if ($gitStatus)
{
    'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
}
else
{
    'CHANGES_PRESENT=False' >> $Env:GITHUB_OUTPUT
}
