# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Unit tests for the class for interacting with pull requests.
#>

#Requires -Version 5.0

$env:SYSTEM_CULTURE = 'en-US'
. $PSScriptRoot\..\Utilities\Logger.ps1
. $PSScriptRoot\..\Invokers\AzureReposCommentThreadStatus.ps1
. $PSScriptRoot\CodeMetrics.ps1
. $PSScriptRoot\PullRequest.ps1
Import-Module -Name "$PSScriptRoot\..\..\..\Release\PipelinesTasks\PRMetrics\ps_modules\VstsTaskSdk\VstsTaskSdk.psm1"

Describe -Name 'PullRequest' {
    BeforeEach {
        Set-StrictMode -Version 'Latest'

        Mock -CommandName 'Write-Verbose' -MockWith {
            throw [System.NotImplementedException]"Write-Verbose must not be called but was called with '$Message'."
        }
    }

    BeforeAll {
        Set-StrictMode -Version 'Latest'

        $GlobalErrorActionPreference = $Global:ErrorActionPreference
        $Global:ErrorActionPreference = 'Stop'

        Write-Verbose -Message "Global:ErrorActionPreference: $GlobalErrorActionPreference"
    }

    AfterAll {
        Set-StrictMode -Version 'Latest'

        $Global:ErrorActionPreference = $GlobalErrorActionPreference
    }

    Context -Name 'IsPullRequest with a pull request ID' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }

            # Act
            $response = [PullRequest]::IsPullRequest()

            # Assert
            $response | Should -Be $true

            # Teardown
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalPullRequestId
        }
    }

    Context -Name 'IsPullRequest with no pull request ID' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $null
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }

            # Act
            $response = [PullRequest]::IsPullRequest()

            # Assert
            $response | Should -Be $false

            # Teardown
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalPullRequestId
        }
    }

    Context -Name 'GetUpdatedDescription with a valid description' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            $details = [PSCustomObject]@{
                description = 'Description'
            }

            # Act
            $response = [PullRequest]::GetUpdatedDescription($details)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -BeNullOrEmpty
        }
    }

    Context -Name 'GetUpdatedDescription with a $null description' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            $details = [PSCustomObject]@{
                description = $null
            }

            # Act
            $response = [PullRequest]::GetUpdatedDescription($details)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "$([char]0x274C) **Add a description.**"
        }
    }

    Context -Name 'GetUpdatedDescription with an empty description' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            $details = [PSCustomObject]@{
                description = ''
            }

            # Act
            $response = [PullRequest]::GetUpdatedDescription($details)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "$([char]0x274C) **Add a description.**"
        }
    }

    Context -Name 'GetUpdatedDescription with a description consisting solely of white space characters' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            $details = [PSCustomObject]@{
                description = ' '
            }

            # Act
            $response = [PullRequest]::GetUpdatedDescription($details)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "$([char]0x274C) **Add a description.**"
        }
    }

    Context -Name 'GetUpdatedDescription without a description' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            $details = [PSCustomObject]@{
                title = ''
            }

            # Act
            $response = [PullRequest]::GetUpdatedDescription($details)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "$([char]0x274C) **Add a description.**"
        }
    }

    Context -Name 'GetUpdatedDescription without a description and no fields' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            $details = [PSCustomObject]@{
            }

            # Act
            $response = [PullRequest]::GetUpdatedDescription($details)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "$([char]0x274C) **Add a description.**"
        }
    }

    Context -Name 'GetUpdatedTitle with size indicator already present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("XS$([char]0x2714) $([char]0x25FE) Title", "XS$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -BeNullOrEmpty
        }
    }

    Context -Name 'GetUpdatedTitle with no size indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle('Title', "XS$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "XS$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [XS-Warning] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("XS$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title",
                                                       "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [S-Check] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("S$([char]0x2714) $([char]0x25FE) Title", "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [M-Warning] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("M$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title",
                                                       "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [L-Check] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("L$([char]0x2714) $([char]0x25FE) Title", "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [XL-Warning] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("XL$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title",
                                                       "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [2XL-Check] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response =
                [PullRequest]::GetUpdatedTitle("2XL$([char]0x2714) $([char]0x25FE) Title", "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with [10XL-Warning] indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response = [PullRequest]::GetUpdatedTitle("10XL$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title",
                                                       "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title"
        }
    }

    Context -Name 'GetUpdatedTitle with no valid size indicator present' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }

            # Act
            $response =
                [PullRequest]::GetUpdatedTitle("Title XL$([char]0x2714) $([char]0x25FE) ", "10XL$([char]0x2714)")

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "10XL$([char]0x2714) $([char]0x25FE) Title XL$([char]0x2714) $([char]0x25FE) "
        }
    }

    Context -Name 'GetCurrentIteration with 1 iteration' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCurrentIteration() static'
            }
            $iterations = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCurrentIteration($iterations)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be 1
        }
    }

    Context -Name 'GetCurrentIteration with multiple iterations' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCurrentIteration() static'
            }
            $iterations = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                    }
                    @{
                        id = 2
                    }
                    @{
                        id = 3
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCurrentIteration($iterations)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be 3
        }
    }

    Context -Name 'GetCommentData with no comment threads' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 1, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 0
            $response.MetricsCommentId | Should -Be 0
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with no relevant comment thread' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 2
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = 'Comment'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 1, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 0
            $response.MetricsCommentId | Should -Be 0
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with no relevant comment thread associated with the pull request itself' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = @{
                            filePath = '/File.cs'
                        }
                        comments = @(
                            @{
                                id = 2
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 0
            $response.MetricsCommentId | Should -Be 0
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a relevant comment thread with the wrong author' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 2
                                author = @{
                                    displayName = 'Muiris Woulfe'
                                }
                                content = '# Metrics for iteration 1'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 0
            $response.MetricsCommentId | Should -Be 0
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a relevant comment thread' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 2
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 1
            $response.MetricsCommentId | Should -Be 2
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a relevant comment thread including irrelevant information' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 2
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                            @{
                                id = 3
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = 'Comment'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 1
            $response.MetricsCommentId | Should -Be 2
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a relevant comment thread and an irrelevant comment thread ' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 3
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = 'Description'
                            }
                        )
                    }
                    @{
                        id = 2
                        threadContext = $null
                        comments = @(
                            @{
                                id = 4
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 3
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 2
            $response.MetricsCommentId | Should -Be 4
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a relevant comment thread and an irrelevant comment thread' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 3
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                        )
                    }
                    @{
                        id = 2
                        threadContext = $null
                        comments = @(
                            @{
                                id = 4
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = 'Description'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 3
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $false
            $response.MetricsThreadId | Should -Be 1
            $response.MetricsCommentId | Should -Be 3
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a comment thread for the current iteration' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 2
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                            @{
                                id = 3
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 2'
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $true
            $response.MetricsThreadId | Should -Be 1
            $response.MetricsCommentId | Should -Be 3
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithLinesAdded[0] | Should -Be 'Ignored1.cs'
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a comment thread for the current iteration and one ignored comment' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetIgnoredCommentData() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetIgnoredComment() static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 3
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                            @{
                                id = 4
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 2'
                            }
                        )
                    }
                    @{
                        id = 2
                        threadContext = @{
                            filePath = '/Ignored1.cs'
                        }
                        comments = @(
                            @{
                                id = 5
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = "$([char]0x2757) **This file may not need to be reviewed.**"
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 4
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $true
            $response.MetricsThreadId | Should -Be 1
            $response.MetricsCommentId | Should -Be 4
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 1
            $response.IgnoredFilesWithoutLinesAdded[0] | Should -Be 'Ignored2.cs'
        }
    }

    Context -Name 'GetCommentData with a comment thread for the current iteration and all ignored comments' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetIgnoredCommentData() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetIgnoredComment() static'
            }
            $commentThreads = [PSCustomObject]@{
                value = @(
                    @{
                        id = 1
                        threadContext = $null
                        comments = @(
                            @{
                                id = 3
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 1'
                            }
                            @{
                                id = 4
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = '# Metrics for iteration 2'
                            }
                        )
                    }
                    @{
                        id = 2
                        threadContext = @{
                            filePath = '/Ignored1.cs'
                        }
                        comments = @(
                            @{
                                id = 5
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = "$([char]0x2757) **This file may not need to be reviewed.**"
                            }
                        )
                    }
                    @{
                        id = 2
                        threadContext = @{
                            filePath = '/Ignored2.cs'
                        }
                        comments = @(
                            @{
                                id = 6
                                author = @{
                                    displayName = 'Project Collection Build Service (prmetrics)'
                                }
                                content = "$([char]0x2757) **This file may not need to be reviewed.**"
                            }
                        )
                    }
                )
            }

            # Act
            $response = [PullRequest]::GetCommentData($commentThreads, 2, @('Ignored1.cs'), @('Ignored2.cs'))

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            $response.Count | Should -Be 5
            $response.IsMetricsPresent | Should -Be $true
            $response.MetricsThreadId | Should -Be 1
            $response.MetricsCommentId | Should -Be 4
            $response.IgnoredFilesWithLinesAdded.Count | Should -Be 0
            $response.IgnoredFilesWithoutLinesAdded.Count | Should -Be 0
        }
    }

    Context -Name 'GetCommentThreadId' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentThreadId() static'
            }
            $commentThread = [PSCustomObject]@{
                id = 1
            }

            # Act
            $response = [PullRequest]::GetCommentThreadId($commentThread)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be 1
        }
    }

    Context -Name 'GetMetricsComment without binary files' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "200	300	File.cs`n")

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 1)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 1$([Environment]::NewLine)" +
                                   $([char]0x274C) +
                                   ' **Try to keep pull requests smaller than 50 lines of new product code by ' +
                                   'following the ' +
                                   '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**' +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|200$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**200**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**200**')
        }
    }

    Context -Name 'GetMetricsComment with large test factor' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '2.5', '**/*', 'cs', "200	300	File.cs`n")

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 1)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 1$([Environment]::NewLine)" +
                                   $([char]0x274C) +
                                   ' **Try to keep pull requests smaller than 50 lines of new product code by ' +
                                   'following the ' +
                                   '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**' +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|200$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**200**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**200**')
        }
    }

    Context -Name 'GetMetricsComment with binary product files' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', "cs`ndll", ("200	300	File.cs`n" +
                                                                                      "-	-	File.dll`n"))

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 2)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 2$([Environment]::NewLine)" +
                                   $([char]0x274C) +
                                   ' **Try to keep pull requests smaller than 50 lines of new product code by ' +
                                   'following the ' +
                                   '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**' +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|200$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**200**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**200**')
        }
    }

    Context -Name 'GetMetricsComment with binary test files' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', "cs`ndll", ("200	300	File.cs`n" +
                                                                                      "20	30	Test.cs`n" +
                                                                                      "-	-	Test.dll`n"))

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 3)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 3$([Environment]::NewLine)" +
                                   $([char]0x274C) +
                                   ' **Try to keep pull requests smaller than 50 lines of new product code by ' +
                                   'following the ' +
                                   '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**' +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|200$([Environment]::NewLine)" +
                                   "Test Code|20$([Environment]::NewLine)" +
                                   "**Subtotal**|**220**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**220**')
        }
    }

    Context -Name 'GetMetricsComment with ignored files' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50',
                                              '2.5',
                                              '1.0',
                                              ("**/*`n" +
                                               "!Ignored.*"),
                                              'cs',
                                              ("200	300	Ignored.cs`n" +
                                               "20	30	File.cs`n"))

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 3)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 3$([Environment]::NewLine)" +
                                   "$([char]0x2714) **Thanks for keeping your pull request small.**" +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|20$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**20**$([Environment]::NewLine)" +
                                   "Ignored|200$([Environment]::NewLine)" +
                                   '**Total**|**220**')
        }
    }

    Context -Name 'GetMetricsComment with binary ignored files' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50',
                                              '2.5',
                                              '1.0',
                                              ("**/*`n" +
                                               "!Ignored.*"),
                                              'cs',
                                              ("200	300	File.cs`n" +
                                               "20	30	Ignored.cs`n" +
                                               "-	-	Ignored.dll`n"))

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 3)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 3$([Environment]::NewLine)" +
                                   $([char]0x274C) +
                                   ' **Try to keep pull requests smaller than 50 lines of new product code by ' +
                                   'following the ' +
                                   '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**' +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|200$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**200**$([Environment]::NewLine)" +
                                   "Ignored|20$([Environment]::NewLine)" +
                                   '**Total**|**220**')
        }
    }

    Context -Name 'GetMetricsComment with a small set of changes' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "1	2	File.cs`n")

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 4)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 4$([Environment]::NewLine)" +
                                   "$([char]0x2714) **Thanks for keeping your pull request small.**" +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|1$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**1**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**1**')
        }
    }

    Context -Name 'GetMetricsComment with sufficient test coverage' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', @("2	3	File.cs`n" +
                                                                                  "2	3	Test.cs`n"))

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 5)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 5$([Environment]::NewLine)" +
                                   "$([char]0x2714) **Thanks for keeping your pull request small.**" +
                                   $([Environment]::NewLine) +
                                   "$([char]0x2714) **Thanks for adding tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|2$([Environment]::NewLine)" +
                                   "Test Code|2$([Environment]::NewLine)" +
                                   "**Subtotal**|**4**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**4**')
        }
    }

    Context -Name 'GetMetricsComment with a zero test factor' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '0.0', '**/*', 'cs', "200	300	Test.cs`n")

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 5)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 14
            $response | Should -Be ("# Metrics for iteration 5$([Environment]::NewLine)" +
                                   "$([char]0x2714) **Thanks for keeping your pull request small.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|0$([Environment]::NewLine)" +
                                   "Test Code|200$([Environment]::NewLine)" +
                                   "**Subtotal**|**200**$([Environment]::NewLine)" +
                                   "Ignored|0$([Environment]::NewLine)" +
                                   '**Total**|**200**')
        }
    }

    Context -Name 'GetMetricsComment with sufficient tests but no test code' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '!**/*', 'cs', "200	300	File.cs`n")

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 5)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 5$([Environment]::NewLine)" +
                                   "$([char]0x2714) **Thanks for keeping your pull request small.**" +
                                   $([Environment]::NewLine) +
                                   "$([char]0x2714) **Thanks for adding tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|0$([Environment]::NewLine)" +
                                   "Test Code|0$([Environment]::NewLine)" +
                                   "**Subtotal**|**0**$([Environment]::NewLine)" +
                                   "Ignored|200$([Environment]::NewLine)" +
                                   '**Total**|**200**')
        }
    }

    Context -Name 'GetMetricsComment with large numbers' {
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
                $Message -eq '* [PullRequest]::GetMetricsComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentStatuses() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::AreTestsExpected()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::AddCommentMetrics() hidden static'
            }
            $codeMetrics = [CodeMetrics]::new('1000000',
                                              '2.5',
                                              '1.0',
                                              ("**/*`n" +
                                               "!Ignored.cs"),
                                              'cs',
                                              ("2000000	2000000	File.cs`n" +
                                               "1000000	1000000	Test.cs`n" +
                                               "1000000	1000000	Ignored.cs`n"))

            # Act
            $response = [PullRequest]::GetMetricsComment($codeMetrics, 5)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 15
            $response | Should -Be ("# Metrics for iteration 5$([Environment]::NewLine)" +
                                   $([char]0x274C) +
                                   ' **Try to keep pull requests smaller than 1,000,000 lines of new product code by ' +
                                   'following the ' +
                                   '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**' +
                                   $([Environment]::NewLine) +
                                   "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                                   $([Environment]::NewLine) +
                                   "||Lines$([Environment]::NewLine)" +
                                   "-|-:$([Environment]::NewLine)" +
                                   "Product Code|2,000,000$([Environment]::NewLine)" +
                                   "Test Code|1,000,000$([Environment]::NewLine)" +
                                   "**Subtotal**|**3,000,000**$([Environment]::NewLine)" +
                                   "Ignored|1,000,000$([Environment]::NewLine)" +
                                   '**Total**|**4,000,000**')
        }
    }

    Context -Name 'GetMetricsCommentStatus with a small set of changes and sufficient test coverage' {
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
                $Message -eq '* [PullRequest]::GetMetricsCommentStatus() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("2	3	File.cs`n" +
                                                                                 "2	3	Test.cs`n"))

            # Act
            $response = [PullRequest]::GetMetricsCommentStatus($codeMetrics)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            $response | Should -Be Closed
        }
    }

    Context -Name 'GetMetricsCommentStatus with a small set of changes and insufficient test coverage' {
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
                $Message -eq '* [PullRequest]::GetMetricsCommentStatus() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::HasSufficientTestCode()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', "2	3	File.cs`n")

            # Act
            $response = [PullRequest]::GetMetricsCommentStatus($codeMetrics)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            $response | Should -Be Active
        }
    }

    Context -Name 'GetMetricsCommentStatus with a large set of changes and sufficient test coverage' {
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
                $Message -eq '* [PullRequest]::GetMetricsCommentStatus() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::IsSmall()'
            }
            $codeMetrics = [CodeMetrics]::new('50', '2.5', '1.0', '**/*', 'cs', ("200	300	File.cs`n" +
                                                                                 "200	300	Test.dll`n"))

            # Act
            $response = [PullRequest]::GetMetricsCommentStatus($codeMetrics)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 7
            $response | Should -Be Active
        }
    }

    Context -Name 'GetIgnoredComment' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetIgnoredComment() static'
            }

            # Act
            $response = [PullRequest]::GetIgnoredComment()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be "$([char]0x2757) **This file may not need to be reviewed.**"
        }
    }
}
