# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    A class representing metrics around software code.
#>

#Requires -Version 5.0

class CodeMetrics {
    CodeMetrics([string] $baseSize,
                [string] $growthRate,
                [string] $testFactor,
                [string] $fileMatchingPatterns,
                [string] $codeFileExtensions,
                [string] $gitDiffSummary) {
        [Logger]::Log('* [CodeMetrics]::new()')
        $this.Metrics = @{
            ProductCode = 0
            TestCode = 0
            Subtotal = 0
            Ignored = 0
            Total = 0
        }
        $this.IgnoredFilesWithLinesAdded = [System.Collections.Generic.List[string]]::new()
        $this.IgnoredFilesWithoutLinesAdded = [System.Collections.Generic.List[string]]::new()
        $this.NormalizeParameters($baseSize, $growthRate, $testFactor, $fileMatchingPatterns, $codeFileExtensions)
        $this.InitializeMetrics($gitDiffSummary)

        $this.ExpectedTestCode = $this.Metrics.ProductCode * $this.TestFactor
        $this.SufficientTestCode = $this.Metrics.TestCode -ge $this.ExpectedTestCode
        $this.InitializeSize()
    }

    [string] GetSizeIndicator() {
        [Logger]::Log('* [CodeMetrics]::GetSizeIndicator()')
        $indicator = $this.Size
        if ($this.SufficientTestCode) {
            $indicator += "$([char]0x2714)"
        }
        else {
            $indicator += "$([char]0x26A0)$([char]0xFE0F)"
        }

        return $indicator
    }

    [bool] IsSmall() {
        [Logger]::Log('* [CodeMetrics]::IsSmall()')
        return $this.Metrics.ProductCode -le $this.BaseSize
    }

    [bool] AreTestsExpected() {
        [Logger]::Log('* [CodeMetrics]::AreTestsExpected()')
        return $this.TestFactor -gt 0.0
    }

    [bool] HasSufficientTestCode() {
        [Logger]::Log('* [CodeMetrics]::HasSufficientTestCode()')
        return $this.SufficientTestCode
    }

    hidden [void] NormalizeParameters([string] $baseSize,
                                      [string] $growthRate,
                                      [string] $testFactor,
                                      [string] $fileMatchingPatterns,
                                      [string] $codeFileExtensions) {
        [Logger]::Log('* [CodeMetrics]::NormalizeParameters() hidden')

        $integerOutput = 0
        if ([string]::IsNullOrWhiteSpace($baseSize) -or ![int]::TryParse($baseSize, [ref] $integerOutput) -or $integerOutput -le 0) {
            Write-Information -MessageData 'Adjusting base size parameter to 250.' -InformationAction 'Continue'
            $this.BaseSize = 250
        }
        else {
            $this.BaseSize = $integerOutput
        }

        $doubleOutput = 0.0
        if ([string]::IsNullOrWhiteSpace($growthRate) -or ![double]::TryParse($growthRate, [ref] $doubleOutput) -or $doubleOutput -le 1.0) {
            Write-Information -MessageData 'Adjusting growth rate parameter to 2.0.' -InformationAction 'Continue'
            $this.GrowthRate = 2.0
        }
        else {
            $this.GrowthRate = $doubleOutput
        }

        if ([string]::IsNullOrWhiteSpace($testFactor) -or ![double]::TryParse($testFactor, [ref] $doubleOutput) -or $doubleOutput -lt 0.0) {
            Write-Information -MessageData 'Adjusting test factor parameter to 1.5.' -InformationAction 'Continue'
            $this.TestFactor = 1.5
        }
        else {
            $this.TestFactor = $doubleOutput
        }

        if ([string]::IsNullOrWhiteSpace($fileMatchingPatterns)) {
            Write-Information -MessageData 'Adjusting file matching patterns to **/*.' -InformationAction 'Continue'
            $this.FileMatchingPatterns = '**/*'
        }
        else {
            $this.FileMatchingPatterns = $fileMatchingPatterns.Split(@("`n"), [StringSplitOptions]::RemoveEmptyEntries)
        }

        $this.NormalizeCodeFileExtensionsParameter($codeFileExtensions)
    }

    hidden [void] NormalizeCodeFileExtensionsParameter([string] $codeFileExtensions) {
        [Logger]::Log('* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden')
        if ([string]::IsNullOrWhiteSpace($codeFileExtensions)) {
            Write-Information -MessageData 'Adjusting code file extensions parameter to default values.' -InformationAction 'Continue'

            # Uses an adapted version of the list at
            # https://en.wikipedia.org/wiki/List_of_file_formats#Source_code_for_computer_programs as of 2020-07-14.
            $this.CodeFileExtensions = @(
                '*.ada',
                '*.adb',
                '*.ads',
                '*.asm',
                '*.bas',
                '*.bb',
                '*.bmx',
                '*.c',
                '*.cbl',
                '*.cbp',
                '*.cc',
                '*.clj',
                '*.cls',
                '*.cob',
                '*.cpp',
                '*.cs',
                '*.cxx',
                '*.d',
                '*.dba',
                '*.e',
                '*.efs',
                '*.egt',
                '*.el',
                '*.f',
                '*.f77',
                '*.f90',
                '*.for',
                '*.frm',
                '*.frx',
                '*.fth',
                '*.ftn',
                '*.ged',
                '*.gm6',
                '*.gmd',
                '*.gmk',
                '*.gml',
                '*.go',
                '*.h',
                '*.hpp',
                '*.hs',
                '*.hxx',
                '*.i',
                '*.inc',
                '*.java',
                '*.l',
                '*.lgt',
                '*.lisp',
                '*.m',
                '*.m4',
                '*.ml',
                '*.msqr',
                '*.n',
                '*.nb',
                '*.p',
                '*.pas',
                '*.php',
                '*.php3',
                '*.php4',
                '*.php5',
                '*.phps',
                '*.phtml',
                '*.piv',
                '*.pl',
                '*.pl1',
                '*.pli',
                '*.pm',
                '*.pol',
                '*.pp',
                '*.prg',
                '*.pro',
                '*.py',
                '*.r',
                '*.rb',
                '*.red',
                '*.reds',
                '*.rkt',
                '*.rktl',
                '*.s',
                '*.scala',
                '*.sce',
                '*.sci',
                '*.scm',
                '*.sd7',
                '*.skb',
                '*.skc',
                '*.skd',
                '*.skf',
                '*.skg',
                '*.ski',
                '*.skk',
                '*.skm',
                '*.sko',
                '*.skp',
                '*.skq',
                '*.sks',
                '*.skt',
                '*.skz',
                '*.spin',
                '*.stk',
                '*.swg',
                '*.tcl',
                '*.vb',
                '*.xpl',
                '*.xq',
                '*.xsl',
                '*.y'
            )
        }
        else {
            $this.CodeFileExtensions = $codeFileExtensions.Split(@("`n"), [StringSplitOptions]::RemoveEmptyEntries)
            for ($i = 0; $i -lt $this.CodeFileExtensions.Length; $i++) {
                $this.CodeFileExtensions[$i] = "*.$($this.CodeFileExtensions[$i])"
            }
        }
    }

    hidden [void] InitializeMetrics([string] $gitDiffSummary) {
        [Logger]::Log('* [CodeMetrics]::InitializeMetrics() hidden')
        $lines = $gitDiffSummary.Split("`n")
        $filesAll = @{}

        # Skip the last line as it will always be empty.
        for ($i = 0; $i -lt $lines.Length - 1; $i++) {
            $elements = $lines[$i] -split '\s'
            $fileName = [string]::Empty
            for ($j = 2; $j -lt $elements.Length; $j++) {
                if ($elements[$j] -ne '=>') {
                    $lastIndex = $elements[$j].IndexOf('{')
                    if ($lastIndex -ge 0) {
                        $elements[$j] = $elements[$j].Substring(0, $lastIndex)
                    }

                    $fileName += $elements[$j]
                }
            }

            if ($elements[0] -ne '-') {
                $fileName = $fileName.Replace('}', [string]::Empty)
                $filesAll.Add($fileName, [int]$elements[0])
            }
        }

        [string[]] $filesFiltered = Select-Match -ItemPath $filesAll.Keys -Pattern $this.FileMatchingPatterns
        $filesFilteredIndex = 0
        foreach ($file in $filesAll.GetEnumerator()) {
            # The next if statement works on the principal that the result from Select-Match is guaranteed to be in the
            # same order as the input.
            if ($null -ne $filesFiltered -and
                $filesFilteredIndex -lt $filesFiltered.Length -and
                $filesFiltered[$filesFilteredIndex] -eq $file.Key) {
                $filesFilteredIndex++

                $updatedMetrics = $false
                foreach ($codeFileExtension in $this.CodeFileExtensions) {
                    if ($file.Key -ilike $codeFileExtension) {
                        if ($file.Key -ilike '*Test*') {
                            $this.Metrics.TestCode += $file.Value
                        }
                        else {
                            $this.Metrics.ProductCode += $file.Value
                        }

                        $updatedMetrics = $true
                        break
                    }
                }

                if (!$updatedMetrics) {
                    $this.Metrics.Ignored += $file.Value
                }
            }
            else {
                if ($file.Value -ne '0') {
                    $this.IgnoredFilesWithLinesAdded.Add($file.Key)
                }
                else {
                    $this.IgnoredFilesWithoutLinesAdded.Add($file.Key)
                }

                $this.Metrics.Ignored += $file.Value
            }
        }

        $this.Metrics.Subtotal = $this.Metrics.ProductCode + $this.Metrics.TestCode
        $this.Metrics.Total = $this.Metrics.Subtotal + $this.Metrics.Ignored
    }

    hidden [void] InitializeSize() {
        [Logger]::Log('* [CodeMetrics]::InitializeSize() hidden')
        $indicators = @(
            'XS'
            'S'
            'M'
            'L'
            'XL'
        )
        $this.Size = $indicators[1]
        $currentSize = $this.BaseSize
        $index = 1

        if ($this.Metrics.Subtotal -eq 0) {
            $this.Size = $indicators[0]
        }
        else {
            # Calculate the smaller sizes.
            if ($this.Metrics.ProductCode -lt ($this.BaseSize / $this.GrowthRate)) {
                $this.Size = $indicators[0]
            }

            # Calculate the larger sizes.
            if ($this.Metrics.ProductCode -gt $this.BaseSize) {
                while ($this.Metrics.ProductCode -gt $currentSize) {
                    $index++
                    $currentSize *= $this.GrowthRate

                    if ($index -lt $indicators.Length) {
                        $this.Size = $indicators[$index]
                    }
                    else {
                        $this.Size = ($index - $indicators.Length + 2).ToString() + $indicators[-1]
                    }
                }
            }
        }
    }

    [string] $Size
    [Hashtable] $Metrics
    [System.Collections.Generic.List[string]] $IgnoredFilesWithLinesAdded
    [System.Collections.Generic.List[string]] $IgnoredFilesWithoutLinesAdded
    [int] $BaseSize
    [int] $ExpectedTestCode
    hidden [double] $GrowthRate
    hidden [double] $TestFactor
    hidden [string[]] $FileMatchingPatterns
    hidden [string[]] $CodeFileExtensions

    hidden [bool] $SufficientTestCode
}
