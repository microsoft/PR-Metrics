# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [switch]$Force,
    [switch]$Truncate
)

$filePath = 'src/LICENSE.txt'

function Find-SeparatorIndex
{
    param(
        [Parameter(Mandatory)]
        [string[]]$Lines
    )

    # Find the index of the first all-hyphen separator line (e.g., '---------').
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
        [string[]]$Lines,

        [Parameter(Mandatory)]
        [int]$SeparatorIndex
    )

    # Determine whether non-whitespace content exists after the separator line,
    # indicating that dependency license notices are present.
    for ($j = $SeparatorIndex + 1; $j -lt $Lines.Count; $j++)
    {
        if (-not [string]::IsNullOrWhiteSpace($Lines[$j]))
        {
            return $true
        }
    }

    return $false
}

function Remove-Notices
{
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Path,

        [Parameter(Mandatory)]
        [string[]]$Lines,

        [Parameter(Mandatory)]
        [int]$SeparatorIndex
    )

    # Remove all content after the separator line, trimming trailing whitespace
    # from each retained line.
    if ($PSCmdlet.ShouldProcess($Path, 'Remove notices'))
    {
        $truncated = $Lines[0..$SeparatorIndex].ForEach({ $_.TrimEnd() }) + ''
        Set-Content -Path $Path -Value $truncated
    }
}

# Read the file once and locate the separator.
$lines = Get-Content -Path $filePath
$separatorIndex = Find-SeparatorIndex -Lines $lines

if ($separatorIndex -lt 0)
{
    Write-Error -Message 'No separator line found in LICENSE.txt.'
    return
}

$hasNotices = Test-NoticesPresent -Lines $lines -SeparatorIndex $separatorIndex

# Phase 1 mode: truncate third-party notices only.
if ($Truncate)
{
    if ($hasNotices)
    {
        Remove-Notices -Path $filePath -Lines $lines -SeparatorIndex $separatorIndex
        Write-Output -InputObject 'LICENSE.txt truncated.'
    }
    else
    {
        Write-Output -InputObject 'LICENSE.txt already truncated.'
    }

    return
}

# ADO mode: guard check + optional re-truncation before license generation.
if ($hasNotices -and -not $Force)
{
    Write-Output -InputObject 'License notices present. Skipping generation.'
    Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]false'
    return
}

if ($hasNotices)
{
    Remove-Notices -Path $filePath -Lines $lines -SeparatorIndex $separatorIndex
    Write-Output -InputObject 'Re-truncated LICENSE.txt for forced regeneration.'
}

Write-Output -InputObject 'License generation required.'
Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]true'
