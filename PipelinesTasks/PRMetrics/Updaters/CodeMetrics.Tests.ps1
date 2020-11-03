# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Unit tests for the class representing metrics around software code.
#>

#Requires -Version 5.0

BeforeAll {
    $env:SYSTEM_CULTURE = 'en-US'
    . $PSScriptRoot\..\Utilities\Logger.ps1
    . $PSCommandPath.Replace('.Tests.ps1','.ps1')
    Import-Module -Name "$PSScriptRoot\..\..\..\Release\PipelinesTasks\PRMetrics\ps_modules\VstsTaskSdk\VstsTaskSdk.psm1"
}

Describe -Name 'CodeMetrics' {
    BeforeEach {
        Set-StrictMode -Version 'Latest'

        Mock -CommandName 'Write-Information' -MockWith {
            throw [System.NotImplementedException]"Write-Information must not be called but was called with '$MessageData'."
        }
        Mock -CommandName 'Write-Verbose' -MockWith {
            throw [System.NotImplementedException]"Write-Verbose must not be called but was called with '$Message'."
        }
    }

    BeforeAll {
        Set-StrictMode -Version 'Latest'

        $GlobalErrorActionPreference = $Global:ErrorActionPreference
        $Global:ErrorActionPreference = 'Stop'

        $OriginalBuildRepositoryName = $env:BUILD_REPOSITORY_NAME
        $OriginalSystemPullRequestPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
        $OriginalSystemTeamFoundationCollectionUri = $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
        $OriginalSystemTeamProject = $env:SYSTEM_TEAMPROJECT

        $env:BUILD_REPOSITORY_NAME = 'Repository'
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/prmetrics/'
        $env:SYSTEM_TEAMPROJECT = 'CodeMetrics'

        Write-Verbose -Message "Global:ErrorActionPreference: $GlobalErrorActionPreference"
        Write-Verbose -Message "BUILD_REPOSITORY_NAME: $OriginalBuildRepositoryName"
        Write-Verbose -Message "SYSTEM_PULLREQUEST_PULLREQUESTID: $OriginalSystemPullRequestPullRequestId"
        Write-Verbose -Message "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: $OriginalSystemTeamFoundationCollectionUri"
        Write-Verbose -Message "SYSTEM_TEAMPROJECT: $OriginalSystemTeamProject"
    }

    AfterAll {
        Set-StrictMode -Version 'Latest'

        $env:BUILD_REPOSITORY_NAME = $OriginalBuildRepositoryName
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalSystemPullRequestPullRequestId
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = $OriginalSystemTeamFoundationCollectionUri
        $env:SYSTEM_TEAMPROJECT = $OriginalSystemTeamProject

        $Global:ErrorActionPreference = $GlobalErrorActionPreference
    }

    Context -Name 'Constructor called with a single file' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "9	1	File1.cs`n")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 9
            $codeMetrics.Metrics.TestCode | Should -Be 0
            $codeMetrics.Metrics.Subtotal | Should -Be 9
            $codeMetrics.Metrics.Ignored | Should -Be 0
            $codeMetrics.Metrics.Total | Should -Be 9
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
            $codeMetrics.ExpectedTestCode | Should -Be 9
        }
    }

    Context -Name 'Constructor called with text changes' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '2.0', '**/*', 'cs', ("9	1	File1.cs`n" +
                                                                                 "0	9	File2.cs`n"))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 9
            $codeMetrics.Metrics.TestCode | Should -Be 0
            $codeMetrics.Metrics.Subtotal | Should -Be 9
            $codeMetrics.Metrics.Ignored | Should -Be 0
            $codeMetrics.Metrics.Total | Should -Be 9
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
            $codeMetrics.ExpectedTestCode | Should -Be 18
        }
    }

    Context -Name 'Constructor called with text and binary changes' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '2.5', '**/*', "cs`ndll", ("9	1	File1.cs`n" +
                                                                                      "0	9	File2.cs`n" +
                                                                                      "-	-	File.dll`n"))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 9
            $codeMetrics.Metrics.TestCode | Should -Be 0
            $codeMetrics.Metrics.Subtotal | Should -Be 9
            $codeMetrics.Metrics.Ignored | Should -Be 0
            $codeMetrics.Metrics.Total | Should -Be 9
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
            $codeMetrics.ExpectedTestCode | Should -Be 22
        }
    }

    Context -Name 'Constructor called with text and binary changes for product and test files' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', "cs`ndll", ("9	1	File1.cs`n" +
                                                                                      "0	9	File2.cs`n" +
                                                                                      "-	-	File.dll`n" +
                                                                                      "9	1	FileTest1.cs`n" +
                                                                                      "0	9	Filetest2.cs`n" +
                                                                                      "-	-	FileTest.dll`n" +
                                                                                      "9	1	test/File1.cs`n" +
                                                                                      "0	9	test/File2.cs`n" +
                                                                                      "-	-	test/File.dll`n"))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 9
            $codeMetrics.Metrics.TestCode | Should -Be 18
            $codeMetrics.Metrics.Subtotal | Should -Be 27
            $codeMetrics.Metrics.Ignored | Should -Be 0
            $codeMetrics.Metrics.Total | Should -Be 27
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
            $codeMetrics.ExpectedTestCode | Should -Be 9
        }
    }

    Context -Name 'Constructor called with space padding' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "9 1 File1.cs`n")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 9
            $codeMetrics.Metrics.TestCode | Should -Be 0
            $codeMetrics.Metrics.Subtotal | Should -Be 9
            $codeMetrics.Metrics.Ignored | Should -Be 0
            $codeMetrics.Metrics.Total | Should -Be 9
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
            $codeMetrics.ExpectedTestCode | Should -Be 9
        }
    }

    Context -Name 'Constructor called with ignored files' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50',
                                              '2.5',
                                              '1.0',
                                              ("**/*`n" +
                                               "!File*.cs`n" +
                                               "!**/*.dll`n" +
                                               "!test/File*.cs`n" +
                                               "test/File2.cs"),
                                              "cs`ndll",
                                              ("9	1	File1.cs`n" +
                                               "0	9	File2.cs`n" +
                                               "-	-	File.dll`n" +
                                               "9	1	FileTest1.cs`n" +
                                               "0	9	Filetest2.cs`n" +
                                               "-	-	FileTest.dll`n" +
                                               "9	1	test/File1.cs`n" +
                                               "0	9	test/File2.cs`n" +
                                               "-	-	test/File.dll`n"))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 0
            $codeMetrics.Metrics.TestCode | Should -Be 0
            $codeMetrics.Metrics.Subtotal | Should -Be 0
            $codeMetrics.Metrics.Ignored | Should -Be 27
            $codeMetrics.Metrics.Total | Should -Be 27
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 3
            $codeMetrics.IgnoredFilesWithLinesAdded[0] | Should -Be 'File1.cs'
            $codeMetrics.IgnoredFilesWithLinesAdded[1] | Should -Be 'test/File1.cs'
            $codeMetrics.IgnoredFilesWithLinesAdded[2] | Should -Be 'FileTest1.cs'
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 2
            $codeMetrics.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'File2.cs'
            $codeMetrics.IgnoredFilesWithoutLinesAdded[1] | Should -Be 'Filetest2.cs'
            $codeMetrics.ExpectedTestCode | Should -Be 0
        }
    }

    Context -Name 'Constructor called with only ignored files' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50',
                                              '2.5',
                                              '1.0',
                                              ("**/*`n" +
                                               "!File1.cs"),
                                              'cs',
                                              "9	1	File1.cs`n")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 0
            $codeMetrics.Metrics.TestCode | Should -Be 0
            $codeMetrics.Metrics.Subtotal | Should -Be 0
            $codeMetrics.Metrics.Ignored | Should -Be 9
            $codeMetrics.Metrics.Total | Should -Be 9
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $codeMetrics.IgnoredFilesWithLinesAdded[0] | Should -Be 'File1.cs'
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
            $codeMetrics.ExpectedTestCode | Should -Be 0
        }
    }

    Context -Name 'Constructor called with ignored and renamed files' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }

            # Act
            $codeMetrics = [CodeMetrics]::new('50',
                                              '2.5',
                                              '1.0',
                                              ("**/*`n" +
                                               "!File*.cs`n" +
                                               "!**/*.dll`n" +
                                               "!test/File*.cs`n" +
                                               "test/File2.cs"),
                                              "cs`ndll",
                                              ("9	1	File1.cs`n" +
                                               "0	9	File2.cs`n" +
                                               "-	-	File.dll`n" +
                                               "9	1	{Folder_Old => Folder}/FileTest1.cs`n" +
                                               "0	9	File{a => t}est2.cs`n" +
                                               "-	-	F{a => i}leT{b => e}st.d{c => l}l`n" +
                                               "9	1	{test/File.cs => test/File1.cs}`n" +
                                               "0	9	{product => test}/File2.cs`n" +
                                               "-	-	{product => test}/File.dll`n"))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 5
            $codeMetrics.Metrics.Count | Should -Be 5
            $codeMetrics.Metrics.ProductCode | Should -Be 0
            $codeMetrics.Metrics.TestCode | Should -Be 9
            $codeMetrics.Metrics.Subtotal | Should -Be 9
            $codeMetrics.Metrics.Ignored | Should -Be 18
            $codeMetrics.Metrics.Total | Should -Be 27
            $codeMetrics.IgnoredFilesWithLinesAdded.Count | Should -Be 2
            $codeMetrics.IgnoredFilesWithLinesAdded[0] | Should -Be 'File1.cs'
            $codeMetrics.IgnoredFilesWithLinesAdded[1] | Should -Be 'test/File1.cs'
            $codeMetrics.IgnoredFilesWithoutLinesAdded.Count | Should -Be 2
            $codeMetrics.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'File2.cs'
            $codeMetrics.IgnoredFilesWithoutLinesAdded[1] | Should -Be 'Filetest2.cs'
            $codeMetrics.ExpectedTestCode | Should -Be 0
        }
    }

    Context -Name 'GetSizeIndicator called with the defaults' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with null base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting base size parameter to 250.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new($null, '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with empty base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting base size parameter to 250.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('', '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with whitespace base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting base size parameter to 250.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new(' ', '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with a non-integer base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting base size parameter to 250.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('baseSize', '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with zero base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting base size parameter to 250.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('0', '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with negative base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting base size parameter to 250.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('-1', '2.5', '1.0', '**/*', 'cs', "0	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with null growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', $null, '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with empty growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with whitespace growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', ' ', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with non-double growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', 'growthRate', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with zero growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '0.0', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with negative growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '-1.0', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with 1.0 growth rate' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting growth rate parameter to 2.0.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '1.0', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with null test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting test factor parameter to 1.5.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', $null, '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with empty test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting test factor parameter to 1.5.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with whitespace test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting test factor parameter to 1.5.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', ' ', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with non-double test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting test factor parameter to 1.5.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', 'testFactor', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with negative test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting test factor parameter to 1.5.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '-1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with zero test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '0.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called with a null set of file matching patterns' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting file matching patterns to **/*.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', $null, 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with an empty set of file matching patterns' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting file matching patterns to **/*.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with a whitespace set of file matching patterns' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting file matching patterns to **/*.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', ' ', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with a null set of code file extensions' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting code file extensions parameter to default values.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', $null, ("7	0	File.cs`n" +
                                                                                  "1000000	0	File.unknown`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with an empty set of code file extensions' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting code file extensions parameter to default values.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', '', ("7	0	File.cs`n" +
                                                                               "1000000	0	File.unknown`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called with a whitespace set of code file extensions' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Adjusting code file extensions parameter to default values.'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', ' ', ("7	0	File.cs`n" +
                                                                                "1000000	0	File.unknown`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 1
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called for an extra small set of changes with insufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "7	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "XS$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called for an extra small set of changes with sufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("1	0	File.cs`n" +
                                                                                 "2	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "XS$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called for a small set of changes with insufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "50	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "S$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called for a medium set of changes with sufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("51	0	File.cs`n" +
                                                                                 "51	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "M$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called for a large set of changes with insufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "126	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "L$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called for an extra large set of changes with sufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("313	0	File.cs`n" +
                                                                                 "314	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "XL$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called for a 2XL set of changes with insufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "782	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "2XL$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called for a 3XL set of changes with sufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("1954	0	File.cs`n" +
                                                                                 "1955	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "3XL$([char]0x2714)"
        }
    }

    Context -Name 'GetSizeIndicator called for a 4XL set of changes with insufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "4883	0	File.cs`n")

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "4XL$([char]0x26A0)$([char]0xFE0F)"
        }
    }

    Context -Name 'GetSizeIndicator called for a 10XL set of changes with sufficient test coverage' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("2500000	0	File.cs`n" +
                                                                                 "2500001	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.GetSizeIndicator()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be "10XL$([char]0x2714)"
        }
    }

    Context -Name 'IsSmall with a set of changes equal to base size' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "50	0	File.cs`n")

            # Act
            $response = $codeMetrics.IsSmall()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $true
        }
    }

    Context -Name 'IsSmall with a small set of changes' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "1	0	File.cs`n")

            # Act
            $response = $codeMetrics.IsSmall()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $true
        }
    }

    Context -Name 'IsSmall with a large set of changes' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "100	0	File.cs`n")

            # Act
            $response = $codeMetrics.IsSmall()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $false
        }
    }

    Context -Name 'AreTestsExpected with a zero test factor' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '0.0', '**/*', 'cs', "100	0	File.cs`n")

            # Act
            $response = $codeMetrics.AreTestsExpected()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $false
        }
    }

    Context -Name 'AreTestsExpected with a non-zero test factor and product code' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "100	0	File.cs`n")

            # Act
            $response = $codeMetrics.AreTestsExpected()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $true
        }
    }

    Context -Name 'HasSufficientTestCode with tests equal to the product code' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("50	0	File.cs`n" +
                                                                                 "50	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.HasSufficientTestCode()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $true
        }
    }

    Context -Name 'HasSufficientTestCode with sufficient tests' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("50	0	File.cs`n" +
                                                                                 "100	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.HasSufficientTestCode()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $true
        }
    }

    Context -Name 'HasSufficientTestCode with insufficient tests' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '2.5', '**/*', 'cs', ("50	0	File.cs`n" +
                                                                                 "10	0	Test.cs`n"))

            # Act
            $response = $codeMetrics.HasSufficientTestCode()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response | Should -Be $false
        }
    }
}
