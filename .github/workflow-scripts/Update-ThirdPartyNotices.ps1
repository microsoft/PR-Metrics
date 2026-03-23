# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$inputFile = './third-party-licenses.txt'
$outputFile = 'src/LICENSE.txt'

$lines = Get-Content -Path $inputFile
$lines = $lines | ForEach-Object { $_.TrimEnd() }
$lines = $lines[2..($lines.Count - 3)]

$content = ($lines -join "`n").TrimEnd() + "`n"
$outputPath = Join-Path -Path $PWD -ChildPath $outputFile
[System.IO.File]::AppendAllText($outputPath, $content, [System.Text.UTF8Encoding]::new($false))

Remove-Item -Path $inputFile
Write-Output -InputObject 'LICENSE.txt updated with third-party notices.'
