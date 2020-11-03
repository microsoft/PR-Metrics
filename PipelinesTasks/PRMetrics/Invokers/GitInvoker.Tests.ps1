# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Unit tests for the class invoking Git commands.
#>

#Requires -Version 5.0

Describe -Name 'GitInvoker' {
    BeforeEach {
        Set-StrictMode -Version 'Latest'

        Mock -CommandName 'Write-Verbose' -MockWith {
            throw [System.NotImplementedException]"Write-Verbose must not be called but was called with '$Message'."
        }
    }

    BeforeAll {
        Set-StrictMode -Version 'Latest'

        . $PSScriptRoot\..\Utilities\Logger.ps1
        . $PSScriptRoot\GitInvoker.ps1

        $GlobalErrorActionPreference = $Global:ErrorActionPreference
        $Global:ErrorActionPreference = 'Stop'

        $OriginalBuildRepositoryLocalPath = $env:BUILD_REPOSITORY_LOCALPATH
        $OriginalSystemPullRequestPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
        $OriginalSystemPullRequestTargetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH

        $env:BUILD_REPOSITORY_LOCALPATH = 'C:\'
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
        $env:SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'

        Write-Verbose -Message "Global:ErrorActionPreference: $GlobalErrorActionPreference"
        Write-Verbose -Message "BUILD_REPOSITORY_LOCALPATH: $OriginalBuildRepositoryLocalPath"
        Write-Verbose -Message "SYSTEM_PULLREQUEST_PULLREQUESTID: $OriginalSystemPullRequestPullRequestId"
        Write-Verbose -Message "SYSTEM_PULLREQUEST_TARGETBRANCH: $OriginalSystemPullRequestTargetBranch"
    }

    AfterAll {
        Set-StrictMode -Version 'Latest'

        $env:BUILD_REPOSITORY_LOCALPATH = $OriginalBuildRepositoryLocalPath
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalSystemPullRequestPullRequestId
        $env:SYSTEM_PULLREQUEST_TARGETBRANCH = $OriginalSystemPullRequestTargetBranch

        $Global:ErrorActionPreference = $GlobalErrorActionPreference
    }

    Context -Name 'GetDiffSummary' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::GetDiffSummary()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::InvokeGit() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq 'Git diff --numstat origin/develop...pull/12345/merge'
            }
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Information'
                        '-MessageData'
                        "'0123456789'"
                        '-InformationAction'
                        "Continue"
                    )
                    FileName = 'powershell'
                    RedirectStandardOutput = $true
                    UseShellExecute = $false
                }
            } -Verifiable -ParameterFilter {
                $TypeName -eq 'System.Diagnostics.ProcessStartInfo' -and
                $Property.Count -eq 5 -and
                $Property.Arguments.Count -eq 3 -and
                $Property.Arguments[0] -eq 'diff' -and
                $Property.Arguments[1] -eq '--numstat' -and
                $Property.Arguments[2] -eq 'origin/develop...pull/12345/merge' -and
                $Property.FileName -eq 'git' -and
                $Property.RedirectStandardOutput -eq $true -and
                $Property.UseShellExecute -eq $false -and
                $Property.WorkingDirectory -eq 'C:\'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq "0123456789$([Environment]::NewLine)"
            }
            $gitInvoker = [GitInvoker]::new()

            # Act
            $response = $gitInvoker.GetDiffSummary()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 4
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            $response | Should Be "0123456789$([Environment]::NewLine)"
        }
    }

    Context -Name 'GetDiffSummary with path containing /' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $env:SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop/merge'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::GetDiffSummary()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::InvokeGit() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq 'Git diff --numstat origin/develop/merge...pull/12345/merge'
            }
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Information'
                        '-MessageData'
                        "'0123456789'"
                        '-InformationAction'
                        "Continue"
                    )
                    FileName = 'powershell'
                    RedirectStandardOutput = $true
                    UseShellExecute = $false
                }
            } -Verifiable -ParameterFilter {
                $TypeName -eq 'System.Diagnostics.ProcessStartInfo' -and
                $Property.Count -eq 5 -and
                $Property.Arguments.Count -eq 3 -and
                $Property.Arguments[0] -eq 'diff' -and
                $Property.Arguments[1] -eq '--numstat' -and
                $Property.Arguments[2] -eq 'origin/develop/merge...pull/12345/merge' -and
                $Property.FileName -eq 'git' -and
                $Property.RedirectStandardOutput -eq $true -and
                $Property.UseShellExecute -eq $false -and
                $Property.WorkingDirectory -eq 'C:\'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq "0123456789$([Environment]::NewLine)"
            }
            $gitInvoker = [GitInvoker]::new()

            # Act
            $response = $gitInvoker.GetDiffSummary()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 4
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            $response | Should Be "0123456789$([Environment]::NewLine)"
            $env:SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
        }
    }

    Context -Name 'GetDiffSummary with a large string' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $inputObject = ''
            for ($i = 0; $i -le 2500; $i++) {
                $inputObject += '0123456789'
            }

            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::GetDiffSummary()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::InvokeGit() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq 'Git diff --numstat origin/develop...pull/12345/merge'
            }
            Mock -CommandName New-Object -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Information'
                        '-MessageData'
                        "'$inputObject'"
                        '-InformationAction'
                        "Continue"
                    )
                    FileName = 'powershell'
                    RedirectStandardOutput = $true
                    UseShellExecute = $false
                }
            } -Verifiable -ParameterFilter {
                $TypeName -eq 'System.Diagnostics.ProcessStartInfo' -and
                $Property.Count -eq 5 -and
                $Property.Arguments.Count -eq 3 -and
                $Property.Arguments[0] -eq 'diff' -and
                $Property.Arguments[1] -eq '--numstat' -and
                $Property.Arguments[2] -eq 'origin/develop...pull/12345/merge' -and
                $Property.FileName -eq 'git' -and
                $Property.RedirectStandardOutput -eq $true -and
                $Property.UseShellExecute -eq $false -and
                $Property.WorkingDirectory -eq 'C:\'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq "$inputObject$([Environment]::NewLine)"
            }
            $gitInvoker = [GitInvoker]::new()

            # Act
            $response = $gitInvoker.GetDiffSummary()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 4
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            $response | Should Be "$inputObject$([Environment]::NewLine)"
        }
    }

    Context -Name 'GetDiffSummary with timeout' {
        It -Name 'Throws expected exception' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $originalTimeoutInMilliseconds = [GitInvoker]::TimeoutInMilliseconds
            [GitInvoker]::TimeoutInMilliseconds = 0
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::GetDiffSummary()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [GitInvoker]::InvokeGit() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq 'Git diff --numstat origin/develop...pull/12345/merge'
            }
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Start-Sleep'
                        '-Milliseconds'
                        '1'
                    )
                    FileName = 'powershell'
                    RedirectStandardOutput = $true
                    UseShellExecute = $false
                }
            } -Verifiable -ParameterFilter {
                $TypeName -eq 'System.Diagnostics.ProcessStartInfo' -and
                $Property.Count -eq 5 -and
                $Property.Arguments.Count -eq 3 -and
                $Property.Arguments[0] -eq 'diff' -and
                $Property.Arguments[1] -eq '--numstat' -and
                $Property.Arguments[2] -eq 'origin/develop...pull/12345/merge' -and
                $Property.FileName -eq 'git' -and
                $Property.RedirectStandardOutput -eq $true -and
                $Property.UseShellExecute -eq $false -and
                $Property.WorkingDirectory -eq 'C:\'
            }
            $gitInvoker = [GitInvoker]::new()

            # Act & Assert
            { $gitInvoker.GetDiffSummary() } | Should Throw 'Git failed to run within the allocated time.'
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 3
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            [GitInvoker]::TimeoutInMilliseconds = $originalTimeoutInMilliseconds
        }
    }
}
