# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Installs the VstsTaskSdk dependency.
#>

#Requires -Version 5.0

Set-StrictMode -Version 'Latest'
$Global:ErrorActionPreference = 'Stop'

Install-Package VstsTaskSdk -Source https://www.powershellgallery.com/api/v2/ -Destination  . -Force

Save-Module -Force -Name 'VstsTaskSdk' -RequiredVersion '0.11.0' -Path "$PSScriptRoot\..\..\..\Output\PipelinesTasks\PRMetrics"
Rename-Item -Path "$PSScriptRoot\..\..\..\Output\PipelinesTasks\PRMetrics\VstsTaskSdk\0.11.0" -NewName 'VstsTaskSdk'
Rename-Item -Path "$PSScriptRoot\..\..\..\Output\PipelinesTasks\PRMetrics\VstsTaskSdk" -NewName 'ps_modules'
