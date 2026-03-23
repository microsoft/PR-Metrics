# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$inputFile = './third-party-licenses.txt'
$outputFile = 'src/LICENSE.txt'
$marker = 'This file was generated with generate-license-file'

$lines = Get-Content -Path $inputFile
$lines = $lines | ForEach-Object { $_.TrimEnd() }

# Remove header (marker line + URL line).
$start = 0
if ($lines[$start].Contains($marker))
{
    $start++
}

if ($start -lt $lines.Count -and $lines[$start].StartsWith('https://www.npmjs.com/'))
{
    $start++
}

# Remove footer (separator + marker line + URL line).
$end = $lines.Count - 1
if ($lines[$end].StartsWith('https://www.npmjs.com/'))
{
    $end--
}

if ($end -ge $start -and $lines[$end].Contains($marker))
{
    $end--
}

if ($end -ge $start -and $lines[$end] -match '^-+$')
{
    $end--
}

$lines = $lines[$start..$end]

$content = ($lines -join "`n").TrimEnd() + "`n"
$outputPath = Join-Path -Path $PWD -ChildPath $outputFile
[System.IO.File]::AppendAllText($outputPath, $content, [System.Text.UTF8Encoding]::new($false))

Remove-Item -Path $inputFile
Write-Output -InputObject 'LICENSE.txt updated with third-party notices.'
