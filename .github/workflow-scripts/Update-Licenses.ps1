# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [switch]$Force,
    [switch]$Truncate
)

$filePath = 'src/LICENSE.txt'

function Test-NoticesPresent
{
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path
    for ($i = 0; $i -lt $lines.Count; $i++)
    {
        if ($lines[$i] -match '^-+$')
        {
            for ($j = $i + 1; $j -lt $lines.Count; $j++)
            {
                if (-not [string]::IsNullOrWhiteSpace($lines[$j]))
                {
                    return $true
                }
            }

            return $false
        }
    }

    return $false
}

function Remove-Notice
{
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path
    for ($i = 0; $i -lt $lines.Count; $i++)
    {
        if ($lines[$i] -match '^-+$')
        {
            if ($PSCmdlet.ShouldProcess($Path, 'Remove notices'))
            {
                $truncated = $lines[0..$i].ForEach({ $_.TrimEnd() }) + ''
                Set-Content -Path $Path -Value $truncated
            }

            return
        }
    }
}

$hasNotices = Test-NoticesPresent -Path $filePath

# Phase 1 mode: truncate only.
if ($Truncate)
{
    if ($hasNotices)
    {
        Remove-Notice -Path $filePath
        Write-Output -InputObject 'LICENSE.txt truncated.'
    }
    else
    {
        Write-Output -InputObject 'LICENSE.txt already truncated.'
    }

    return
}

# ADO mode: guard check + optional re-truncation.
if ($hasNotices -and -not $Force)
{
    Write-Output -InputObject 'Licence notices present. Skipping generation.'
    Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]false'
    return
}

if ($hasNotices)
{
    Remove-Notice -Path $filePath
    Write-Output -InputObject 'Re-truncated LICENSE.txt for forced regeneration.'
}

Write-Output -InputObject 'Licence generation required.'
Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]true'
