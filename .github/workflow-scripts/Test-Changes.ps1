# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$gitStatus = git status --porcelain
Write-Output -InputObject $gitStatus
if ($gitStatus)
{
    'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
}
else
{
    'CHANGES_PRESENT=False' >> $Env:GITHUB_OUTPUT
}
