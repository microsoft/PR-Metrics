# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

$inputFile = './third-party-licenses.txt'
$outputFile = 'src/LICENSE.txt'

$lines = Get-Content -Path $inputFile
$lines = $lines | ForEach-Object { $_.TrimEnd() }

$taglinePattern = 'This file was generated with generate-license-file!'
$taglineIndex = -1
for ($i = $lines.Count - 1; $i -ge 0; $i--)
{
    if ($lines[$i].StartsWith($taglinePattern))
    {
        $taglineIndex = $i
        break
    }
}

if ($taglineIndex -ge 0)
{
    $end = $taglineIndex - 1
    if ($end -ge 0 -and $lines[$end] -match '^-+$')
    {
        $end--
    }

    $lines = $lines[0..$end]
}

$content = ($lines -join "`n").TrimEnd() + "`n"
$outputPath = Join-Path -Path $PWD -ChildPath $outputFile
[System.IO.File]::AppendAllText($outputPath, $content, [System.Text.UTF8Encoding]::new($false))

Remove-Item -Path $inputFile
Write-Output -InputObject 'LICENSE.txt updated with third-party notices.'
