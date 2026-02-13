# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

param(
    [switch]$Force,
    [switch]$Truncate
)

$filePath = 'src/LICENSE.txt'

function Test-LicensesPresent
{
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path
    $separatorIndex = ($lines | Select-String -Pattern '^-+$' | Select-Object -First 1).LineNumber
    if ($null -eq $separatorIndex)
    {
        throw 'No separator line.'
    }

    $remainingLines = $lines[$separatorIndex..($lines.Count - 1)]
    $nonBlankLines = $remainingLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    return @($nonBlankLines).Count -gt 0
}

function Remove-License
{
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)]
        [string]$Path
    )

    $lines = Get-Content -Path $Path
    $separatorIndex = ($lines | Select-String -Pattern '^-+$' | Select-Object -First 1).LineNumber
    if ($null -eq $separatorIndex)
    {
        throw 'No separator line.'
    }

    if ($PSCmdlet.ShouldProcess($Path, 'Remove licenses'))
    {
        $truncated = $lines[0..($separatorIndex - 1)] + ''
        Set-Content -Path $Path -Value $truncated
    }
}

$hasLicenses = Test-LicensesPresent -Path $filePath

if ($Truncate)
{
    if ($hasLicenses)
    {
        Remove-License -Path $filePath
        Write-Output -InputObject 'LICENSE.txt truncated.'
    }
    else
    {
        Write-Output -InputObject 'LICENSE.txt already truncated.'
    }

    return
}

if ($hasLicenses)
{
    if (-not $Force)
    {
        Write-Output -InputObject 'Dependency licenses present. Skipping generation.'
        Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]false'
        return
    }

    Remove-License -Path $filePath
    Write-Output -InputObject 'Re-truncated LICENSE.txt for forced regeneration.'
}

Write-Output -InputObject 'Dependency licenses generation required.'
Write-Output -InputObject '##vso[task.setvariable variable=GENERATE_LICENSES;isoutput=true]true'
