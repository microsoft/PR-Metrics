# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [Parameter(Mandatory)]
    [string]$Remediation
)

$gitStatus = git status --porcelain
if (-not $gitStatus)
{
    Write-Output -InputObject 'No changes were detected in the working tree.'
    exit 0
}

Write-Output -InputObject '::error::Generated or formatted files are not up to date.'
Write-Output -InputObject "::error::$Remediation"
Write-Output -InputObject 'The following files differ from the committed content:'
Write-Output -InputObject $gitStatus
Write-Output -InputObject 'The differences are:'
git --no-pager diff
exit 1
