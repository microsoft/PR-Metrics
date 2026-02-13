# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$gitStatus = git status --porcelain
Write-Output -InputObject $gitStatus
$changesPresent = [bool]$gitStatus
"CHANGES_PRESENT=$($changesPresent.ToString().ToLowerInvariant())" >> $Env:GITHUB_OUTPUT
