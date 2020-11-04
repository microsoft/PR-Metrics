# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    An Azure Repos build task for updating the title, description and comments of pull requests to include calculated
    code metrics.
#>

#Requires -Version 5.0

[CmdletBinding()]
param()

Set-StrictMode -Version 'Latest'


$azureDevOpsTaskSdkPath = "$PSScriptRoot"
if (!$env:AGENT_ID) {
    $azureDevOpsTaskSdkPath = "$azureDevOpsTaskSdkPath\..\..\Release\PipelinesTasks\PRMetrics\"
}

Import-Module -Name "$azureDevOpsTaskSdkPath\ps_modules\VstsTaskSdk\VstsTaskSdk.psm1"

. $PSScriptRoot\Utilities\Logger.ps1
. $PSScriptRoot\Invokers\GitInvoker.ps1
. $PSScriptRoot\Invokers\AzureReposCommentThreadStatus.ps1
. $PSScriptRoot\Invokers\AzureReposInvoker.ps1
. $PSScriptRoot\Updaters\CodeMetrics.ps1
. $PSScriptRoot\Updaters\PullRequest.ps1
. $PSScriptRoot\CodeMetricsCalculator.ps1

try {
    Trace-EnteringInvocation -InvocationInfo $MyInvocation

    if (![CodeMetricsCalculator]::IsPullRequest()) {
        Write-TaskWarning -Message ('The build does not appear to be running against a pull request. Canceling task ' +
                                    'with warning.')
    }
    elseif (![CodeMetricsCalculator]::IsAccessTokenAvailable()) {
        Write-TaskError -Message ('Could not access the OAuth token. Enable the option "Allow scripts to access ' +
                                  'OAuth token" under the build process phase settings.')
    }
    else {
        $baseSize = Get-Input -Name 'BaseSize'
        $growthRate = Get-Input -Name 'GrowthRate'
        $testFactor = Get-Input -Name 'TestFactor'
        $fileMatchingPatterns = Get-Input -Name 'FileMatchingPatterns'
        $codeFileExtensions = Get-Input -Name 'CodeFileExtensions'

        $codeMetricsCalculator = [CodeMetricsCalculator]::new($baseSize,
                                                              $growthRate,
                                                              $testFactor,
                                                              $fileMatchingPatterns,
                                                              $codeFileExtensions)
        $codeMetricsCalculator.UpdateDetails()
        $codeMetricsCalculator.UpdateComment()
    }
}
catch {
    Write-Error -Message $_.Exception
    [Logger]::OutputAll()
    exit 1
}
finally {
    Trace-LeavingInvocation -InvocationInfo $MyInvocation
}
