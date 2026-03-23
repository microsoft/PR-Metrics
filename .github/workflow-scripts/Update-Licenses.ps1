# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$filePath = 'src/LICENSE.txt'

$lines = Get-Content -Path $filePath
$separatorIndex = ($lines | Select-String -Pattern '^-+$' | Select-Object -Skip 1 -First 1).LineNumber
if ($null -eq $separatorIndex)
{
    throw 'No separator line.'
}

$remainingLines = $lines[$separatorIndex..($lines.Count - 1)]
$nonBlankLines = $remainingLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
if (@($nonBlankLines).Count -eq 0)
{
    Write-Output -InputObject 'LICENSE.txt already truncated.'
    return
}

$truncated = $lines[0..($separatorIndex - 1)]
Set-Content -Path $filePath -Value $truncated
Write-Output -InputObject 'LICENSE.txt truncated.'
