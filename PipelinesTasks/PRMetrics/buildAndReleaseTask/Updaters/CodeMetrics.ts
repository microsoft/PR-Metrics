/* eslint-disable spaced-comment */
/* eslint-disable no-array-constructor */
/* eslint-disable space-before-function-paren */
/* eslint-disable indent */
/* eslint-disable semi */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IMetrics } from './iMetrics';
import { isNullOrWhitespace } from './CodeMetricsHelpers';

class CodeMetrics {
    public Size: string;
    public Metrics: IMetrics; // was [Hashtable]
    public IgnoredFilesWithLinesAdded: Array<string>; // was [System.Collections.Generic.List[string]]
    public IgnoredFilesWithoutLinesAdded: Array<string>; // was [System.Collections.Generic.List[string]]
    public BaseSize: number;
    public ExpectedTestCode: number;
    private GrowthRate: number;
    private TestFactor: number;
    private FileMatchingPatterns: Array<string>; // was [string[]]
    private CodeFileExtensions: Array<string>; // was [string[]]
    private SufficientTestCode: boolean;

    constructor(
        baseSize: string,
        growthRate: string,
        testFactor: string,
        fileMatchingPatterns: string,
        codeFileExtensions: string,
        gitDiffSummary: string
    ) {
        // [Logger]::Log('* [CodeMetrics]::new()')

        this.Size = '';
        this.BaseSize = 0;
        this.TestFactor = 0;
        this.GrowthRate = 0;

        this.CodeFileExtensions = new Array<string>();
        this.FileMatchingPatterns = new Array<string>();

        this.Metrics = {
            ProductCode: 0,
            TestCode: 0,
            Subtotal: 0,
            Ignored: 0,
            Total: 0
        };

        this.IgnoredFilesWithLinesAdded = new Array<string>();
        this.IgnoredFilesWithoutLinesAdded = new Array<string>();
        this.NormalizeParameters(
            baseSize,
            growthRate,
            testFactor,
            fileMatchingPatterns,
            codeFileExtensions
        );
        this.InitializeMetrics(gitDiffSummary);
        this.ExpectedTestCode = this.Metrics.ProductCode * this.TestFactor;
        this.SufficientTestCode =
            this.Metrics.TestCode >= this.ExpectedTestCode;
        this.InitializeSize();
    }

    public GetSizeIndicator(): string {
        // [Logger]::Log('* [CodeMetrics]::GetSizeIndicator()');
        let indicator = this.Size;

        if (this.SufficientTestCode) {
            indicator += '$([char]0x2714)';
        } else {
            indicator += '$([char]0x26A0)$([char]0xFE0F)';
        }

        return indicator;
    }

    public IsSmall(): boolean {
        // [Logger]::Log('* [CodeMetrics]::IsSmall()')
        return this.Metrics.ProductCode <= this.BaseSize;
    }

    public AreTestsExpected(): boolean {
        // [Logger]::Log('* [CodeMetrics]::AreTestsExpected()');
        return this.TestFactor > 0.0;
    }

    public HasSufficientTestCode(): boolean {
        // [Logger]::Log('* [CodeMetrics]::HasSufficientTestCode()')
        return this.SufficientTestCode;
    }

    private NormalizeParameters(
        baseSize: string,
        growthRate: string,
        testFactor: string,
        fileMatchingPatterns: string,
        codeFileExtensions: string
    ): void {
        // [Logger]::Log('* [CodeMetrics]::NormalizeParameters() private');

        let integerOutput = 0;
        integerOutput = parseInt(baseSize);
        if (
            isNullOrWhitespace(baseSize) ||
            !integerOutput ||
            integerOutput < 0
        ) {
            //Write-Information -MessageData 'Adjusting base size parameter to 250.' -InformationAction 'Continue';
            this.BaseSize = 250;
        } else {
            this.BaseSize = integerOutput;
        }

        let doubleOutput = 0.0;
        doubleOutput = parseFloat(growthRate);
        if (
            isNullOrWhitespace(growthRate) ||
            !doubleOutput ||
            doubleOutput < 1.0
        ) {
            //Write-Information -MessageData 'Adjusting growth rate parameter to 2.0.' -InformationAction 'Continue';
            this.GrowthRate = 2.0;
        } else {
            this.GrowthRate = doubleOutput;
        }

        doubleOutput = parseFloat(testFactor);
        if (
            isNullOrWhitespace(testFactor) ||
            !doubleOutput ||
            doubleOutput < 0.0
        ) {
            //Write-Information -MessageData 'Adjusting test factor parameter to 1.5.' -InformationAction 'Continue';
            this.TestFactor = 1.5;
        } else {
            this.TestFactor = doubleOutput;
        }

        if (isNullOrWhitespace(fileMatchingPatterns)) {
            // Write-Information -MessageData "Adjusting file matching patterns to **"/*."" -InformationAction 'Continue';
            this.FileMatchingPatterns.push('**/*');
        } else {
            this.FileMatchingPatterns = fileMatchingPatterns.split('\n');
        }

        this.NormalizeCodeFileExtensionsParameter(codeFileExtensions);
    }

    private NormalizeCodeFileExtensionsParameter(
        codeFileExtensions: string
    ): void {
        //        [Logger]::Log('* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() private')

        if (isNullOrWhitespace(codeFileExtensions)) {
            //Write-Information -MessageData 'Adjusting code file extensions parameter to default values.' -InformationAction 'Continue'

            this.CodeFileExtensions = [
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
            ];
        } else {
            this.CodeFileExtensions = codeFileExtensions.split('\n');
            for (let $i = 0; $i < this.CodeFileExtensions.length; $i++) {
                this.CodeFileExtensions[
                    $i
                ] = `*.${this.CodeFileExtensions[$i]}`;
            }
        }
    }

    private InitializeMetrics(gitDiffSummary: string): void {
        /*
        [Logger]::Log('* [CodeMetrics]::InitializeMetrics() private')
        $lines = gitDiffSummary.Split("`n")
        $filesAll = @{}

        # Skip the last line as it will always be empty.
        for ($i = 0; $i < $lines.Length - 1; $i++) {
            $elements = $lines[$i] -split '\s'
            $fileName = [string]::Empty
            for ($j = 2; $j < $elements.Length; $j++) {
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

        [string[]] $filesFiltered = Select-Match -ItemPath $filesAll.Keys -Pattern this.FileMatchingPatterns
        $filesFilteredIndex = 0
        foreach ($file in $filesAll.GetEnumerator()) {
            # The next if statement works on the principal that the result from Select-Match is guaranteed to be in the
            # same order as the input.
            if ($null -ne $filesFiltered -and
                $filesFilteredIndex < $filesFiltered.Length -and
                $filesFiltered[$filesFilteredIndex] -eq $file.Key) {
                $filesFilteredIndex++

                $updatedMetrics = $false
                foreach ($codeFileExtension in this.CodeFileExtensions) {
                    if ($file.Key -ilike $codeFileExtension) {
                        if ($file.Key -ilike '*Test*') {
                            this.Metrics.TestCode += $file.Value
                        }
                        else {
                            this.Metrics.ProductCode += $file.Value
                        }

                        $updatedMetrics = $true
                        break
                    }
                }

                if (!$updatedMetrics) {
                    this.Metrics.Ignored += $file.Value
                }
            }
            else {
                if ($file.Value -ne '0') {
                    this.IgnoredFilesWithLinesAdded.Add($file.Key)
                }
                else {
                    this.IgnoredFilesWithoutLinesAdded.Add($file.Key)
                }

                this.Metrics.Ignored += $file.Value
            }
        }

        this.Metrics.Subtotal = this.Metrics.ProductCode + this.Metrics.TestCode;
        this.Metrics.Total = this.Metrics.Subtotal + this.Metrics.Ignored;
        */
    }

    private InitializeSize(): void {
        // [Logger]::Log('* [CodeMetrics]::InitializeSize() private')
        const indicators: string[] = new Array('XS', 'S', 'M', 'L', 'XL');

        this.Size = indicators[1];
        let currentSize = this.BaseSize;
        let index = 1;

        if (this.Metrics.Subtotal === 0) {
            this.Size = indicators[0];
        } else {
            // Calculate the smaller sizes.
            if (this.Metrics.ProductCode < this.BaseSize / this.GrowthRate) {
                this.Size = indicators[0];
            }

            // Calculate the larger sizes.
            if (this.Metrics.ProductCode > this.BaseSize) {
                while (this.Metrics.ProductCode > currentSize) {
                    index++;
                    currentSize *= this.GrowthRate;

                    if (index < indicators.length) {
                        this.Size = indicators[index];
                    } else {
                        this.Size =
                            (index - indicators.length + 2).toString() +
                            indicators[-1];
                    }
                }
            }
        }
    }
}

export default CodeMetrics;
