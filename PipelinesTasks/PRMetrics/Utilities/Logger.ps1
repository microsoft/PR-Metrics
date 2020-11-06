# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    A class used to logging telemetry.
#>

#Requires -Version 5.1

class Logger {
    static [void] Log([string] $statement) {
        Write-Verbose -Message $statement
        [Logger]::Statements.Add($statement)
    }

    static [void] OutputAll() {
        foreach ($statement in [Logger]::Statements) {
            Write-Information -MessageData $statement -InformationAction Continue
        }
    }

    hidden static [System.Collections.Generic.List[string]] $Statements = [System.Collections.Generic.List[string]]::new()
}
