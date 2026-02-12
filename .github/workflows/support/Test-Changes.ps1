# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$GitStatus = git status --porcelain
Write-Host -Object $GitStatus
if ($GitStatus)
{
    Write-Host -Object 'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
}
else
{
    Write-Host -Object 'CHANGES_PRESENT=False' >> $Env:GITHUB_OUTPUT
}
