# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Tests for the Azure Repos build task for updating the title, description and comments of pull requests to include
    calculated code metrics.
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
    . $PSScriptRoot\CodeMetricsCalculator.ps1
    Import-Module -Name "$PSScriptRoot\..\..\Release\PipelinesTasks\PRMetrics\ps_modules\VstsTaskSdk\VstsTaskSdk.psm1"
}

function Do-Stuff()
{
    
}

Describe -Name 'PRMetrics' {
    BeforeEach {
        Set-StrictMode -Version 'Latest'

        Mock -CommandName 'Get-Input' -MockWith {
            throw [System.NotImplementedException]"Get-Input must not be called but was called with '$Name'."
        }
        Mock -CommandName 'Write-Information' -MockWith {
            throw [System.NotImplementedException]"Write-Information must not be called but was called with '$MessageData'."
        }
        Mock -CommandName 'Write-TaskError' -MockWith {
            throw [System.NotImplementedException]"Write-TaskError must not be called but was called with '$Message'."
        }
        Mock -CommandName 'Write-TaskWarning' -MockWith {
            throw [System.NotImplementedException]"Write-TaskWarning must not be called but was called with '$Message'."
        }
        Mock -CommandName 'Write-Verbose' -MockWith {
            throw [System.NotImplementedException]"Write-Verbose must not be called but was called with '$Message'."
        }

        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -like 'Entering *PRMetrics.ps1.'
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
        Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
            $Message -like 'Leaving *PRMetrics.ps1.'
        }
    }

    BeforeAll {
        Set-StrictMode -Version 'Latest'

        $GlobalErrorActionPreference = $Global:ErrorActionPreference
        $Global:ErrorActionPreference = 'Stop'

        $OriginalBuildRepositoryId = $env:BUILD_REPOSITORY_ID
        $OriginalBuildRepositoryLocalPath = $env:BUILD_REPOSITORY_LOCALPATH
        $OriginalSystemAccessToken = $env:SYSTEM_ACCESSTOKEN
        $OriginalSystemPullRequestPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
        $OriginalSystemPullRequestTargetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH
        $OriginalSystemTeamFoundationCollectionUri = $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
        $OriginalSystemTeamProject = $env:SYSTEM_TEAMPROJECT

        $env:BUILD_REPOSITORY_ID = '41d31ec7-6c0a-467d-9e51-0cac9ae9a598'
        $env:BUILD_REPOSITORY_LOCALPATH = 'C:\'
        $env:SYSTEM_ACCESSTOKEN = 'ACCESSTOKEN'
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
        $env:SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/prmetrics/'
        $env:SYSTEM_TEAMPROJECT = 'PRMetrics'

        Write-Verbose -Message "Global:ErrorActionPreference: $GlobalErrorActionPreference"
        Write-Verbose -Message "BUILD_REPOSITORY_ID: $OriginalBuildRepositoryId"
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
        $env:BUILD_REPOSITORY_LOCALPATH = $OriginalBuildRepositoryLocalPath
        $env:SYSTEM_ACCESSTOKEN = $OriginalSystemAccessToken
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalSystemPullRequestPullRequestId
        $env:SYSTEM_PULLREQUEST_TARGETBRANCH = $OriginalSystemPullRequestTargetBranch
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = $OriginalSystemTeamFoundationCollectionUri
        $env:SYSTEM_TEAMPROJECT = $OriginalSystemTeamProject

        $Global:ErrorActionPreference = $GlobalErrorActionPreference
    }

    Context -Name 'No pull request' {
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
            Mock -CommandName 'Write-TaskWarning' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('The build does not appear to be running against a pull request. ' +
                              'Canceling task with warning.');
            }

            # Act
            . $PSScriptRoot\PRMetrics.ps1

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 4
            Assert-MockCalled -CommandName 'Write-TaskWarning' -Exactly 1

            # Teardown
            $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalPullRequestId
        }
    }

    Context -Name 'No access token' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalAccessToken = $env:SYSTEM_ACCESSTOKEN
            $env:SYSTEM_ACCESSTOKEN = $null
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-TaskError' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('Could not access the OAuth token. Enable the option "Allow scripts to access OAuth ' +
                              'token" under the build process phase settings.');
            }

            # Act
            . $PSScriptRoot\PRMetrics.ps1

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 6
            Assert-MockCalled -CommandName 'Write-TaskError' -Exactly 1

            # Teardown
            $env:SYSTEM_ACCESSTOKEN = $OriginalAccessToken
        }
    }

    Context -Name 'With pull request' {
        It -Name 'Invokes expected APIs' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Get-Input' -MockWith {
                return '50'
            } -Verifiable -ParameterFilter {
                $Name -eq 'BaseSize'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return '3.0'
            } -Verifiable -ParameterFilter {
                $Name -eq 'GrowthRate'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return '1.0'
            } -Verifiable -ParameterFilter {
                $Name -eq 'TestFactor'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return '**/*'
            } -Verifiable -ParameterFilter {
                $Name -eq 'FileMatchingPatterns'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return 'cs'
            } -Verifiable -ParameterFilter {
                $Name -eq 'CodeFileExtensions'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }
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
                              'https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?' +
                          'api-version=5.1') -and
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
                $Message -eq ('PATCH https://dev.azure.com/prmetrics/PRMetrics/_apis/' +
                              'git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
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
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET https://dev.azure.com/prmetrics/PRMetrics/_apis/' +
                              'git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
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
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
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

            # Act
            . $PSScriptRoot\PRMetrics.ps1

            # Assert
            Assert-MockCalled -CommandName 'Get-Input' -Exactly 5
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 69
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 4
        }
    }

    Context -Name 'Throws an exception' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Get-Input' -MockWith {
                return '50'
            } -Verifiable -ParameterFilter {
                $Name -eq 'BaseSize'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return '3.0'
            } -Verifiable -ParameterFilter {
                $Name -eq 'GrowthRate'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return '1.0'
            } -Verifiable -ParameterFilter {
                $Name -eq 'TestFactor'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return '**/*'
            } -Verifiable -ParameterFilter {
                $Name -eq 'FileMatchingPatterns'
            }
            Mock -CommandName 'Get-Input' -MockWith {
                return 'cs'
            } -Verifiable -ParameterFilter {
                $Name -eq 'CodeFileExtensions'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [PullRequest]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }
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
                              'https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?' +
                          'api-version=5.1') -and
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
                $Message -eq ('PATCH https://dev.azure.com/prmetrics/PRMetrics/_apis/' +
                              'git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
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
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET https://dev.azure.com/prmetrics/PRMetrics/_apis/' +
                              'git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
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
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -like '*"value": *' -and
                $Message -like '*"threadContext": null*' #-and
                $Message -like '*"comments": *' -and
                $Message -like '*"author": *' -and
                $Message -like '*"displayName": "Project Collection Build Service (prmetrics)"*' -and
                $Message -like '*"id": 2*' -and
                $Message -like '*"content": "# Metrics for iteration 1"*' -and
                $Message -like '*"id": 1*'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                              'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                              'iterations?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                throw [System.NotImplementedException]'Invoke-RestMethod must not be called.'
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                          'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
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
            Mock -CommandName 'Write-Error' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq 'System.NotImplementedException: Invoke-RestMethod must not be called.'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetricsCalculator]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [PullRequest]::IsPullRequest() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetricsCalculator]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetricsCalculator]::new()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [GitInvoker]::GetDiffSummary()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [GitInvoker]::InvokeGit() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq 'Git diff --numstat origin/develop...pull/12345/merge'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq "1 2 File.cs$([Environment]::NewLine)"
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetrics]::new()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetrics]::NormalizeParameters() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetrics]::NormalizeCodeFileExtensionsParameter() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetrics]::InitializeMetrics() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetrics]::InitializeSize() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetricsCalculator]::UpdateDetails()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::GetDetails()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ('GET ' +
                                  'https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                                  'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
                                  '12345?api-version=5.1')
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ("{$([Environment]::NewLine)" +
                                  "  `"description`": `"`",$([Environment]::NewLine)" +
                                  "  `"title`": `"Title`"$([Environment]::NewLine)" +
                                  '}')
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ''
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [PullRequest]::GetUpdatedDescription() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetrics]::GetSizeIndicator()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [PullRequest]::GetUpdatedTitle() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ('PATCH https://dev.azure.com/prmetrics/PRMetrics/' +
                                  '_apis/git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
                                  '12345?api-version=5.1 ' +
                                  "{`"description`":`"$([char]0x274C) **Add a description.**`"," +
                                  "`"title`":`"XS$([char]0x26A0)$([char]0xFE0F) $([char]0x25FE) Title`"}")
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ("{$([Environment]::NewLine)" +
                                  "  `"value`": `"Fake Data`"$([Environment]::NewLine)" +
                                  '}')
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [CodeMetricsCalculator]::UpdateComment()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::GetCommentThreads()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ('GET https://dev.azure.com/prmetrics/PRMetrics/' +
                                  '_apis/git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/' +
                                  '12345/threads?api-version=5.1')
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -like '*"value": *' -and
                $MessageData -like '*"threadContext": null*' #-and
                $MessageData -like '*"comments": *' -and
                $MessageData -like '*"author": *' -and
                $MessageData -like '*"displayName": "Project Collection Build Service (prmetrics)"*' -and
                $MessageData -like '*"id": 2*' -and
                $MessageData -like '*"content": "# Metrics for iteration 1"*' -and
                $MessageData -like '*"id": 1*'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq ('GET ' +
                                  'https://dev.azure.com/prmetrics/PRMetrics/_apis/git/' +
                                  'repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/' +
                                  'iterations?api-version=5.1')
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [PullRequest]::GetCurrentIteration() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [PullRequest]::GetCommentData() static'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '* [PullRequest]::GetMetricsCommentData() hidden static'
            }
            [Logger]::Statements.Clear()

            # Act
            . $PSScriptRoot\PRMetrics.ps1

            # Assert
            Assert-MockCalled -CommandName 'Get-Input' -Exactly 5
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 63
            Assert-MockCalled -CommandName 'New-Object' -Exactly 1
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 4
            Assert-MockCalled -CommandName 'Write-Error' -Exactly 1
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 45
        }
    }
}
