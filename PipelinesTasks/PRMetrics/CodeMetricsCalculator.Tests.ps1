# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Unit tests for the class for calculating and updating the code metrics within pull requests.
#>

#Requires -Version 5.0

BeforeAll {
    Set-StrictMode -Version 'Latest'

    $env:SYSTEM_CULTURE = 'en-US'
    . $PSScriptRoot\Utilities\Logger.ps1
    . $PSScriptRoot\Invokers\GitInvoker.ps1
    . $PSScriptRoot\Invokers\AzureReposCommentThreadStatus.ps1
    . $PSScriptRoot\Invokers\AzureReposInvoker.ps1
    . $PSScriptRoot\Updaters\CodeMetrics.ps1
    . $PSScriptRoot\Updaters\PullRequest.ps1
    . $PSCommandPath.Replace('.Tests.ps1','.ps1')
    Import-Module -Name "$PSScriptRoot\..\..\Release\PipelinesTasks\PRMetrics\ps_modules\VstsTaskSdk\VstsTaskSdk.psm1"
}

Describe -Name 'CodeMetricsCalculator' {
    BeforeEach {
        Set-StrictMode -Version 'Latest'

        Mock -CommandName 'Write-Verbose' -MockWith {
            throw [System.NotImplementedException]"Write-Verbose must not be called but was called with '$Message'."
        }
        Mock -CommandName 'Invoke-RestMethod' -MockWith {
            throw [System.NotImplementedException]"Invoke-RestMethod must not be called but was called with '$Uri'."
        }

        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq 'Entering Select-Match.'
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.Dot: 'True'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq 'Entering Select-Match.'
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.Dot: 'True'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.FlipNegate: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.MatchBase: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoBrace: 'True'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoCase: 'True'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoComment: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoExt: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoGlobStar: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoNegate: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq "MatchOptions.NoNull: 'False'"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -like "Pattern: '*"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -like "Trimmed leading '!'. Pattern: '*"
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq 'Applying include pattern against original list.'
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq 'Applying exclude pattern against original list'
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -like '* matches'
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -like '* final results'
        }
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -eq 'Leaving Select-Match.'
        }
    }

    BeforeAll {
        Set-StrictMode -Version 'Latest'

        $GlobalErrorActionPreference = $Global:ErrorActionPreference
        $Global:ErrorActionPreference = 'Stop'

        $OriginalBuildRepositoryId = $env:BUILD_REPOSITORY_ID
        $OriginalBuildRepositoryName = $env:BUILD_REPOSITORY_NAME
        $OriginalBuildRepositoryLocalPath = $env:BUILD_REPOSITORY_LOCALPATH
        $OriginalSystemAccessToken = $env:SYSTEM_ACCESSTOKEN
        $OriginalSystemPullRequestPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
        $OriginalSystemPullRequestTargetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH
        $OriginalSystemTeamFoundationCollectionUri = $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
        $OriginalSystemTeamProject = $env:SYSTEM_TEAMPROJECT

        $env:BUILD_REPOSITORY_ID = '41d31ec7-6c0a-467d-9e51-0cac9ae9a598'
        $env:BUILD_REPOSITORY_NAME = 'Repository'
        $env:BUILD_REPOSITORY_LOCALPATH = 'C:\'
        $env:SYSTEM_ACCESSTOKEN = 'ACCESSTOKEN'
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
        $env:SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/prmetrics/'
        $env:SYSTEM_TEAMPROJECT = 'CodeMetricsCalculator'

        Write-Verbose -Message "Global:ErrorActionPreference: $GlobalErrorActionPreference"
        Write-Verbose -Message "BUILD_REPOSITORY_ID: $OriginalBuildRepositoryId"
        Write-Verbose -Message "BUILD_REPOSITORY_NAME: $OriginalBuildRepositoryName"
        Write-Verbose -Message "BUILD_REPOSITORY_LOCALPATH: $OriginalBuildRepositoryLocalPath"
        Write-Verbose -Message "SYSTEM_ACCESSTOKEN: $OriginalSystemAccessToken"
        Write-Verbose -Message "SYSTEM_PULLREQUEST_PULLREQUESTID: $OriginalSystemPullRequestPullRequestId"
        Write-Verbose -Message "SYSTEM_PULLREQUEST_TARGETBRANCH: $OriginalSystemPullRequestTargetBranch"
        Write-Verbose -Message "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: $OriginalSystemTeamFoundationCollectionUri"
        Write-Verbose -Message "SYSTEM_TEAMPROJECT: $OriginalSystemTeamProject"
    }

    AfterAll {
        Set-StrictMode -Version 'Latest'

        $env:BUILD_REPOSITORY_ID = $OriginalBuildRepositoryId
        $env:BUILD_REPOSITORY_NAME = $OriginalBuildRepositoryName
        $env:BUILD_REPOSITORY_LOCALPATH = $OriginalBuildRepositoryLocalPath
        $env:SYSTEM_ACCESSTOKEN = $OriginalSystemAccessToken
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalSystemPullRequestPullRequestId
        $env:SYSTEM_PULLREQUEST_TARGETBRANCH = $OriginalSystemPullRequestTargetBranch
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = $OriginalSystemTeamFoundationCollectionUri
        $env:SYSTEM_TEAMPROJECT = $OriginalSystemTeamProject

        $Global:ErrorActionPreference = $GlobalErrorActionPreference
    }

    Context -Name 'UpdateDetails' {
        It -Name 'Invokes expected APIs' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::new()'
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
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Output'
                        '-InputObject'
                        "'1	2	File.cs'"
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
                $Message -eq "1 2 File.cs$([Environment]::NewLine)"
            }
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
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
                              '12345?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    description = ''
                    title = 'Title'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"description`": `"`",$([Environment]::NewLine)" +
                              "  `"title`": `"Title`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetUpdatedTitle() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
                              '12345?api-version=5.1 ' +
                              "{`"description`":`"$([char]0x274C) **Add a description.**`"," +
                              "`"title`":`"XS$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title`"}")
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ("{`"description`":`"$([char]0x274C) **Add a description.**`"," +
                           "`"title`":`"XS$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title`"}") -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            $codeMetricsCalculator = [CodeMetricsCalculator]::new('50', '2.5', '1.0', '**/*', 'cs')

            # Act
            $codeMetricsCalculator.UpdateDetails()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 45
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 2
        }
    }

    Context -Name 'UpdateComment with no relevant comment thread' {
        It -Name 'Invokes expected APIs' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::new()'
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
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Output'
                        '-InputObject'
                        "'1	2	File.cs'"
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
                $Message -eq "1 2 File.cs$([Environment]::NewLine)"
            }
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
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = $null
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": null$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'iterations?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = @(
                        @{
                            id = 1
                        }
                    )
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": [$([Environment]::NewLine)" +
                              "    {$([Environment]::NewLine)" +
                              "      `"id`": 1$([Environment]::NewLine)" +
                              "    }$([Environment]::NewLine)" +
                              "  ]$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCurrentIteration() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateMetricsComment() hidden'
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
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentStatus() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateCommentThread()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1 ' +
                              '{"comments":[{"content":"# Metrics for iteration 1' +
                              $([Environment]::NewLine) +
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
                              '**Total**|**1**"}]}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    id = 1
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ('{"comments":[{"content":"# Metrics for iteration 1' +
                           $([Environment]::NewLine) +
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
                           '**Total**|**1**"}]}') -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"id`": 1$([Environment]::NewLine)" +
                              "}")
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentThreadId() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetCommentThreadStatus()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/' +
                              '1?api-version=5.1 {"status":1}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/1' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"status":1}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                              "}")
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::AddMetadata() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::AddMetadata()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -like ('PATCH ' +
                                'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                                'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/properties?' +
                                'api-version=5.1-preview.1 *') -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Size","value":"XS"}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.TestCoverage","value":false}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.ProductCode","value":1}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.TestCode","value":0}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Subtotal","value":1}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Ignored","value":0}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Total","value":1}*'
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/properties?' +
                          'api-version=5.1-preview.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Size","value":"XS"}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.TestCoverage","value":false}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.ProductCode","value":1}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.TestCode","value":0}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Subtotal","value":1}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Ignored","value":0}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Total","value":1}*' -and
                $ContentType -eq 'application/json-patch+json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                              "}")
            }
            $codeMetricsCalculator = [CodeMetricsCalculator]::new('50', '2.5', '1.0', '**/*', 'cs')

            # Act
            $codeMetricsCalculator.UpdateComment()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 80
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 5
        }
    }

    Context -Name 'UpdateComment with a relevant comment thread' {
        It -Name 'Invokes expected APIs' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::new()'
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
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Output'
                        '-InputObject'
                        "'1	2	File.cs'"
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
                $Message -eq "1 2 File.cs$([Environment]::NewLine)"
            }
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
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
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
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -like '*"value": *' -and
                $Message -like '*"threadContext": null*' -and
                $Message -like '*"comments": *' -and
                $Message -like '*"author": *' -and
                $Message -like '*"displayName": "Project Collection Build Service (prmetrics)"*' -and
                $Message -like '*"id": 2*' -and
                $Message -like '*"content": "# Metrics for iteration 1"*' -and
                $Message -like '*"id": 1*'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'iterations?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = @(
                        @{
                            id = 1
                        }
                        @{
                            id = 2
                        }
                    )
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": [$([Environment]::NewLine)" +
                              "    {$([Environment]::NewLine)" +
                              "      `"id`": 1$([Environment]::NewLine)" +
                              "    },$([Environment]::NewLine)" +
                              "    {$([Environment]::NewLine)" +
                              "      `"id`": 2$([Environment]::NewLine)" +
                              "    }$([Environment]::NewLine)" +
                              "  ]$([Environment]::NewLine)" +
                              "}")
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCurrentIteration() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateMetricsComment() hidden'
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
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentStatus() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads/1/comments?api-version=5.1 ' +
                              '{"parentCommentId":2,"content":"# Metrics for iteration 2' +
                              $([Environment]::NewLine) +
                              "$([char]0x2714) **Thanks for keeping your pull request small.**" +
                              $([Environment]::NewLine) +
                              "$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**" +
                              ([Environment]::NewLine) +
                              "||Lines$([Environment]::NewLine)" +
                              "-|-:$([Environment]::NewLine)" +
                              "Product Code|1$([Environment]::NewLine)" +
                              "Test Code|0$([Environment]::NewLine)" +
                              "**Subtotal**|**1**$([Environment]::NewLine)" +
                              "Ignored|0$([Environment]::NewLine)" +
                              '**Total**|**1**"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/1/' +
                          'comments?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ('{"parentCommentId":2,"content":"# Metrics for iteration 2' +
                           $([Environment]::NewLine) +
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
                           '**Total**|**1**"}') -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                              "}")
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetCommentThreadStatus()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/' +
                              '1?api-version=5.1 {"status":1}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/1' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"status":1}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::AddMetadata() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::AddMetadata()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -like ('PATCH ' +
                                'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                                'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/properties?' +
                                'api-version=5.1-preview.1 *') -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Size","value":"XS"}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.TestCoverage","value":false}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.ProductCode","value":1}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.TestCode","value":0}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Subtotal","value":1}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Ignored","value":0}*' -and
                $Message -like '*{"op":"replace","path":"/PRMetrics.Total","value":1}*'
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/properties?' +
                          'api-version=5.1-preview.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Size","value":"XS"}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.TestCoverage","value":false}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.ProductCode","value":1}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.TestCode","value":0}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Subtotal","value":1}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Ignored","value":0}*' -and
                $Body -like '*{"op":"replace","path":"/PRMetrics.Total","value":1}*' -and
                $ContentType -eq 'application/json-patch+json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                              "}")
            }
            $codeMetricsCalculator = [CodeMetricsCalculator]::new('50', '2.5', '1.0', '**/*', 'cs')

            # Act
            $codeMetricsCalculator.UpdateComment()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 81
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 50
        }
    }

    Context -Name 'UpdateComment with an existing comment' {
        It -Name 'Invokes expected APIs' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::new()'
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
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Output'
                        '-InputObject'
                        "'1	2	File.cs'"
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
                $Message -eq "1 2 File.cs$([Environment]::NewLine)"
            }

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
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
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
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -like '*"value": *' -and
                $Message -like '*"threadContext": null*' -and
                $Message -like '*"comments": *' -and
                $Message -like '*"author": *' -and
                $Message -like '*"displayName": "Project Collection Build Service (prmetrics)"*' -and
                $Message -like '*"id": 2*' -and
                $Message -like '*"content": "# Metrics for iteration 1"*' -and
                $Message -like '*"id": 1*'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'iterations?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = @(
                        @{
                            id = 1
                        }
                    )
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": [$([Environment]::NewLine)" +
                              "    {$([Environment]::NewLine)" +
                              "      `"id`": 1$([Environment]::NewLine)" +
                              "    }$([Environment]::NewLine)" +
                              "  ]$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCurrentIteration() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            $codeMetricsCalculator = [CodeMetricsCalculator]::new('50', '2.5', '1.0', '**/*', 'cs')

            # Act
            $codeMetricsCalculator.UpdateComment()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 45
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 2
        }
    }

    Context -Name 'UpdateComment with an existing comment and files to ignore' {
        It -Name 'Invokes expected APIs' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::new()'
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
            Mock -CommandName 'New-Object' -MockWith {
                return New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
                    Arguments = @(
                        'Write-Output'
                        '-InputObject'
                        ("'1	2	File.cs`n" +
                         "1	2	Ignored1.cs`n" +
                         "1	2	Ignored2.cs`n" +
                         "0	0	Ignored3.cs'`n")
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
                $Message -eq ("1 2 File.cs`n" +
                              "1 2 Ignored1.cs`n" +
                              "1 2 Ignored2.cs`n" +
                              "0 0 Ignored3.cs$([Environment]::NewLine)")
            }
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
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
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
                            threadContext = @{
                                filePath = '/Ignored1.cs'
                            }
                            comments = @(
                                @{
                                    id = 4
                                    author = @{
                                        displayName = 'Project Collection Build Service (prmetrics)'
                                    }
                                    content = "$([char]0x2757) **This file may not need to be reviewed.**"
                                }
                            )
                        }
                    )
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -like '*"value": *' -and
                $Message -like '*"threadContext": null*' -and
                $Message -like '*"comments": *' -and
                $Message -like '*"author": *' -and
                $Message -like '*"displayName": "Project Collection Build Service (prmetrics)"*' -and
                $Message -like '*"id": 3*' -and
                $Message -like '*"content": "# Metrics for iteration 1"*' -and
                $Message -like '*"id": 1*' -and
                $Message -like '*"filePath": "/Ignored1.cs"*' -and
                $Message -like '*"id": 4*' -and
                $Message -like "*`"content`": `"$([char]0x2757) **This file may not need to be reviewed.**`"*" -and
                $Message -like '*"id": 2*'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'iterations?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = @(
                        @{
                            id = 1
                        }
                    )
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": [$([Environment]::NewLine)" +
                              "    {$([Environment]::NewLine)" +
                              "      `"id`": 1$([Environment]::NewLine)" +
                              "    }$([Environment]::NewLine)" +
                              "  ]$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCurrentIteration() static'
            }
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
                $Message -eq '* [CodeMetricsCalculator]::UpdateIgnoredComment() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetIgnoredComment() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateCommentThread()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1 ' +
                              '{"comments":[{"content":' +
                              "`"$([char]0x2757) **This file may not need to be reviewed.**`"}]," +
                              '"threadContext":{"filePath":"/Ignored2.cs",' +
                              '"rightFileStart":{"line":1,"offset":1},' +
                              '"rightFileEnd":{"line":1,"offset":2}}}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    id = 3
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ("{`"comments`":[{`"content`":`"$([char]0x2757) **This file may not need to be " +
                           'reviewed.**"}],' +
                           '"threadContext":{"filePath":"/Ignored2.cs",' +
                           '"rightFileStart":{"line":1,"offset":1},' +
                           '"rightFileEnd":{"line":1,"offset":2}}}') -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"id`": 3$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'threads?api-version=5.1 ' +
                              '{"comments":[{"content":' +
                              "`"$([char]0x2757) **This file may not need to be reviewed.**`"}]," +
                              '"threadContext":{"filePath":"/Ignored3.cs",' +
                              '"leftFileStart":{"line":1,"offset":1},' +
                              '"leftFileEnd":{"line":1,"offset":2}}}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    id = 3
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ("{`"comments`":[{`"content`":`"$([char]0x2757) **This file may not need to be " +
                           'reviewed.**"}],' +
                           '"threadContext":{"filePath":"/Ignored3.cs",' +
                           '"leftFileStart":{"line":1,"offset":1},' +
                           '"leftFileEnd":{"line":1,"offset":2}}}') -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"id`":  3$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::GetCommentThreadId() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetCommentThreadStatus()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/' +
                              '3?api-version=5.1 {"status":4}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/CodeMetricsCalculator/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/3' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"status":4}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            $codeMetricsCalculator = [CodeMetricsCalculator]::new('50', '2.5', '1.0', ("**/*`n" +
                                                                                       '!**/Ignored*'), 'cs')

            # Act
            $codeMetricsCalculator.UpdateComment()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 83
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 6
        }
    }

    Context -Name 'IsPullRequest with a pull request ID' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }

            # Act
            $response = [CodeMetricsCalculator]::IsPullRequest()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
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
                $Message -eq '* [CodeMetricsCalculator]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }

            # Act
            $response = [CodeMetricsCalculator]::IsPullRequest()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response | Should -Be $false

            # Teardown
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalPullRequestId
        }
    }

    Context -Name 'IsAccessTokenAvailable with a pull request ID' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalAccessToken = $env:SYSTEM_ACCESSTOKEN
            $env:SYSTEM_ACCESSTOKEN = 'ACCESSTOKEN'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }

            # Act
            $response = [CodeMetricsCalculator]::IsAccessTokenAvailable()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response | Should -Be $true

            # Teardown
            $env:SYSTEM_ACCESSTOKEN = $OriginalAccessToken
        }
    }

    Context -Name 'IsAccessTokenAvailable with no pull request ID' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalAccessToken = $env:SYSTEM_ACCESSTOKEN
            $env:SYSTEM_ACCESSTOKEN = $null
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }

            # Act
            $response = [CodeMetricsCalculator]::IsAccessTokenAvailable()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            $response | Should -Be $false

            # Teardown
            $env:SYSTEM_ACCESSTOKEN = $OriginalAccessToken
        }
    }
}
