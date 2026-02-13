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

function Remove-Notices
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
            Set-Content -Path $Path -Value $lines[0..$i]
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
        Remove-Notices -Path $filePath
        Write-Host -Object 'LICENSE.txt truncated.'
    }
    else
    {
        Write-Host -Object 'LICENSE.txt already truncated.'
    }

    return
}

# ADO mode: guard check + optional re-truncation.
if ($hasNotices -and -not $Force)
{
    Write-Host -Object 'Licence notices present. Skipping generation.'
    Write-Host -Object '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]false'
    return
}

if ($hasNotices)
{
    Remove-Notices -Path $filePath
    Write-Host -Object 'Re-truncated LICENSE.txt for forced regeneration.'
}

Write-Host -Object 'Licence generation required.'
Write-Host -Object '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]true'
