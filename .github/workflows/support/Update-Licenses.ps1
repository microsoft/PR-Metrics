# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [switch]$Force,
    [switch]$Truncate
)

$filePath = 'src/LICENSE.txt'
$marker = 'NOTICES AND INFORMATION'

function Test-NoticesPresent
{
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $content = Get-Content -Path $Path -Raw
    return $content.Contains($marker)
}

function Remove-Notices
{
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path
    $index = [Array]::IndexOf(
        $lines,
        ($lines | Where-Object { $_ -match $marker })
    )
    $lines = $lines[0..($index - 2)]
    Set-Content -Path $Path -Value $lines
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
