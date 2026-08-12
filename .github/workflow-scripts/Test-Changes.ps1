# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

Set-StrictMode -Version Latest

$gitStatus = git status --porcelain
Write-Output -InputObject $gitStatus
$changesPresent = [bool]$gitStatus
"CHANGES_PRESENT=$($changesPresent.ToString())" >> $Env:GITHUB_OUTPUT
