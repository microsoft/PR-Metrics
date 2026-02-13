# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [switch]$Force,
    [switch]$Truncate
)

$filePath = 'src/LICENSE.txt'

function Get-SeparatorIndex
{
    param(
        [Parameter(Mandatory)]
        [string[]]$Lines
    )

    # Find the separator line (all hyphens), which marks the boundary between
    # the license header and any appended dependency notices.
    for ($i = 0; $i -lt $Lines.Count; $i++)
    {
        if ($Lines[$i] -match '^-+$')
        {
            return $i
        }
    }

    return -1
}

function Test-NoticesPresent
{
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path
    $separatorIndex = Get-SeparatorIndex -Lines $lines
    if ($separatorIndex -eq -1)
    {
        return $false
    }

    # Check whether any non-blank content follows the separator.
    for ($j = $separatorIndex + 1; $j -lt $lines.Count; $j++)
    {
        if (-not [string]::IsNullOrWhiteSpace($lines[$j]))
        {
            return $true
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
    $separatorIndex = Get-SeparatorIndex -Lines $lines

    # Remove everything after the separator by keeping only the lines up to and
    # including it and adding a final newline.
    if ($separatorIndex -ge 0 -and $PSCmdlet.ShouldProcess($Path, 'Remove licenses'))
    {
        $truncated = $lines[0..$separatorIndex] + ''
        Set-Content -Path $Path -Value $truncated
    }
}

$hasNotices = Test-NoticesPresent -Path $filePath

# In truncation mode, remove dependency licenses if present, but do not generate
# new ones.
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

# Outside truncation mode, if notices are already present and force is
# unspecified, skip generation. If force is specified, remove existing notices
# to allow regeneration.
if ($hasNotices)
{
    if (-not $Force)
    {
        Write-Output -InputObject 'Dependency licenses present. Skipping generation.'
        Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]false'
        return
    }

    Remove-Notice -Path $filePath
    Write-Output -InputObject 'Re-truncated LICENSE.txt for forced regeneration.'
}

Write-Output -InputObject 'Dependency license generation required.'
Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]true'
