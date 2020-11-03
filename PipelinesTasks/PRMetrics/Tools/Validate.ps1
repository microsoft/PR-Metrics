# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Validates the Calculate Code Metrics Azure Repos build task project by running all unit tests and performing static
    analysis on all PowerShell scripts.
#>

#Requires -Version 5.0

Set-StrictMode -Version 'Latest'
$Global:ErrorActionPreference = 'Stop'

Install-Package -Name 'VstsTaskSdk' -RequiredVersion '0.11.0' -Source 'https://www.powershellgallery.com/api/v2/' -Destination "$PSScriptRoot\..\..\..\Release\PipelinesTasks\PRMetrics\ps_modules" -Force
Rename-Item -Path "$PSScriptRoot\..\..\..\Release\PipelinesTasks\PRMetrics\ps_modules\VstsTaskSdk.0.11.0" -NewName 'VstsTaskSdk'

Write-Output -InputObject 'Running Unit Tests'
$tests = Get-ChildItem -Path "$PSScriptRoot\..\*.Tests.ps1" -Recurse
foreach ($test in $tests) {
    Write-Output -InputObject ''
    Write-Output -InputObject "- $($test.FullName)"

    Invoke-Pester -Script $test.FullName -CodeCoverage $test.FullName.Replace('.Tests', '')
}

Write-Output -InputObject ''
Write-Output -InputObject 'Running Static Analyses'
Invoke-ScriptAnalyzer -Path "$PSScriptRoot\.." -Recurse -Settings @('CmdletDesign',
                                                                    'CodeFormatting',
                                                                    'CodeFormattingAllman',
                                                                    'CodeFormattingOTBS',
                                                                    'CodeFormattingStroustrup',
                                                                    'DSC',
                                                                    'PSGallery',
                                                                    'ScriptFunctions',
                                                                    'ScriptingStyle',
                                                                    'ScriptSecurity') |
    Where-Object -Property 'RuleName' -NE 'TypeNotFound'
