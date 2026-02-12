# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$GitStatus = git status --porcelain
Write-Output -InputObject $GitStatus
if ($GitStatus)
{
  Write-Output -InputObject 'CHANGES_PRESENT=True' >> $Env:GITHUB_OUTPUT
}
else
{
  Write-Output -InputObject 'CHANGES_PRESENT=False' >> $Env:GITHUB_OUTPUT
}
