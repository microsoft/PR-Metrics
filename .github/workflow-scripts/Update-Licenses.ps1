# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

Set-StrictMode -Version Latest

$filePath = 'src/LICENSE.txt'

$lines = Get-Content -Path $filePath
$separatorLineNumbers = @(
    for ($index = 0; $index -lt $lines.Count; $index++)
    {
        if ($lines[$index] -match '^-+$')
        {
            $index + 1
        }
    }
)
if ($separatorLineNumbers.Count -lt 2)
{
    throw 'No separator line.'
}

$separatorIndex = $separatorLineNumbers[1]
$remainingLines = $lines[$separatorIndex..($lines.Count - 1)]
$nonBlankLines = $remainingLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
if (@($nonBlankLines).Count -eq 0)
{
    Write-Output -InputObject 'LICENSE.txt already truncated.'
    return
}

$truncated = $lines[0..$separatorIndex]
Set-Content -Path $filePath -Value $truncated
Write-Output -InputObject 'LICENSE.txt truncated.'
