# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Unit tests for the class invoking Azure Repos REST APIs.
#>

#Requires -Version 5.0

. $PSScriptRoot\..\Utilities\Logger.ps1
. $PSScriptRoot\AzureReposCommentThreadStatus.ps1
. $PSScriptRoot\AzureReposInvoker.ps1

BeforeAll {
    # DON'T use $MyInvocation.MyCommand.Path
    . $PSCommandPath.Replace('.Tests.ps1','.ps1')
}

Describe -Name 'AzureReposInvoker' {
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

        $OriginalBuildRepositoryId = $env:BUILD_REPOSITORY_ID
        $OriginalSystemAccessToken = $env:SYSTEM_ACCESSTOKEN
        $OriginalSystemPullRequestPullRequestId = $env:SYSTEM_PULLREQUEST_PULLREQUESTID
        $OriginalSystemTeamFoundationCollectionUri = $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
        $OriginalSystemTeamProject = $env:SYSTEM_TEAMPROJECT

        $env:BUILD_REPOSITORY_ID = '41d31ec7-6c0a-467d-9e51-0cac9ae9a598'
        $env:SYSTEM_ACCESSTOKEN = 'ACCESSTOKEN'
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/prmetrics/'
        $env:SYSTEM_TEAMPROJECT = 'AzureReposInvoker'

        Write-Verbose -Message "Global:ErrorActionPreference: $GlobalErrorActionPreference"
        Write-Verbose -Message "BUILD_REPOSITORY_ID: $OriginalBuildRepositoryId"
        Write-Verbose -Message "SYSTEM_ACCESSTOKEN: $OriginalSystemAccessToken"
        Write-Verbose -Message "SYSTEM_PULLREQUEST_PULLREQUESTID: $OriginalSystemPullRequestPullRequestId"
        Write-Verbose -Message "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: $OriginalSystemTeamFoundationCollectionUri"
        Write-Verbose -Message "SYSTEM_TEAMPROJECT: $OriginalSystemTeamProject"
    }

    AfterAll {
        Set-StrictMode -Version 'Latest'

        $env:BUILD_REPOSITORY_ID = $OriginalBuildRepositoryId
        $env:SYSTEM_ACCESSTOKEN = $OriginalSystemAccessToken
        $env:SYSTEM_PULLREQUEST_PULLREQUESTID = $OriginalSystemPullRequestPullRequestId
        $env:SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = $OriginalSystemTeamFoundationCollectionUri
        $env:SYSTEM_TEAMPROJECT = $OriginalSystemTeamProject

        $Global:ErrorActionPreference = $GlobalErrorActionPreference
    }

    Context -Name 'Constructor' {
        It -Name 'Initializes expected data' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }

            # Act
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $AzureReposInvoker.OAuthHeader.Count | Should -Be 1
            $AzureReposInvoker.OAuthHeader.Authorization | Should -Be 'Bearer ACCESSTOKEN'
            $AzureReposInvoker.BaseUri | Should -Be ('https://dev.azure.com/prmetrics/AzureReposInvoker/' +
                                              '_apis/git/repositories/41d31ec7-6c0a-467d-9e51-0cac9ae9a598/' +
                                              'pullRequests/12345')
        }
    }

    Context -Name 'GetDetails' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
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
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Details Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Details Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $response = $AzureReposInvoker.GetDetails()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
            $response.value | Should -Be 'Details Data'
        }
    }

    Context -Name 'GetIterations' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetIterations()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeGetMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('GET ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Iterations Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/iterations' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Iterations Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $response = $AzureReposInvoker.GetIterations()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
            $response.value | Should -Be 'Iterations Data'
        }
    }

    Context -Name 'GetCommentThreads' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
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
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Comment Threads Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'GET' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Comment Threads Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $response = $AzureReposInvoker.GetCommentThreads()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
            $response.value | Should -Be 'Comment Threads Data'
        }
    }

    Context -Name 'SetDetails with a $null description and title' {
        It -Name 'Invokes no REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {} -Verifiable
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails($null, $null)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 0
        }
    }

    Context -Name 'SetDetails with an empty string description and title' {
        It -Name 'Invokes no REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {} -Verifiable
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails('', '')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 0
        }
    }

    Context -Name 'SetDetails with a description and title consisting solely of white space characters' {
        It -Name 'Invokes no REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {} -Verifiable
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails(' ', ' ')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 2
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 0
        }
    }

    Context -Name 'SetDetails with a description and a title' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"description":"Description","title":"Title"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"description":"Description","title":"Title"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails('Description', 'Title')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a description and a $null title' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"description":"Description"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"description":"Description"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails('Description', $null)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a description and an empty string title' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"description":"Description"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"description":"Description"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails('Description', '')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a description and a title consisting solely of white space characters' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"description":"Description"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"description":"Description"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails('Description', ' ')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a title and a $null description' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"title":"Title"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"title":"Title"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails($null, 'Title')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a title and an empty string description' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"title":"Title"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"title":"Title"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails('', 'Title')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a title and a description consisting solely of white space characters' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"title":"Title"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"title":"Title"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails(' ', 'Title')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetCommentThreadStatus' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetCommentThreadStatus()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/' +
                              '1?api-version=5.1 {"status":2}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/1?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"status":2}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetCommentThreadStatus(1, [AzureReposCommentThreadStatus]::Fixed)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'SetDetails with a title containing a quotation mark and a $null description' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::SetDetails()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1 ' +
                              '{"title":"\""}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"title":"\""}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.SetDetails($null, '"')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'CreateCommentThread with no file specified' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateCommentThread()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1 ' +
                              '{"comments":[{"content":"Comment"}]}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Comment Thread Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"comments":[{"content":"Comment"}]}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Comment Thread Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $response = $AzureReposInvoker.CreateCommentThread('Comment', $null, $true)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 7
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
            $response.value | Should -Be 'Comment Thread Data'
        }
    }

    Context -Name 'CreateCommentThread with a file containing additions specified' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateCommentThread()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1 ' +
                              '{"comments":[{"content":"Comment"}],"threadContext":{"filePath":"/File.cs",' +
                              '"rightFileStart":{"line":1,"offset":1},"rightFileEnd":{"line":1,"offset":2}}}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Comment Thread Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ('{"comments":[{"content":"Comment"}],"threadContext":{"filePath":"/File.cs",' +
                           '"rightFileStart":{"line":1,"offset":1},"rightFileEnd":{"line":1,"offset":2}}}') -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Comment Thread Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $response = $AzureReposInvoker.CreateCommentThread('Comment', 'File.cs', $true)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 7
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
            $response.value | Should -Be 'Comment Thread Data'
        }
    }

    Context -Name 'CreateCommentThread with a file containing no additions specified' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateCommentThread()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1 ' +
                              '{"comments":[{"content":"Comment"}],"threadContext":{"filePath":"/File.cs",' +
                              '"leftFileStart":{"line":1,"offset":1},"leftFileEnd":{"line":1,"offset":2}}}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Comment Thread Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq ('{"comments":[{"content":"Comment"}],"threadContext":{"filePath":"/File.cs",' +
                           '"leftFileStart":{"line":1,"offset":1},"leftFileEnd":{"line":1,"offset":2}}}') -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Comment Thread Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $response = $AzureReposInvoker.CreateCommentThread('Comment', 'File.cs', $false)

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 7
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
            $response.value | Should -Be 'Comment Thread Data'
        }
    }

    Context -Name 'CreateComment' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::CreateComment()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::InvokeActionMethod() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('POST ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/1/' +
                              'comments?api-version=5.1 {"parentCommentId":2,"content":"Comment"}')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'POST' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/threads/1/comments' +
                          '?api-version=5.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '{"parentCommentId":2,"content":"Comment"}' -and
                $ContentType -eq 'application/json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.CreateComment(1, 2, 'Comment')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 8
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'AddMetadata' {
        It -Name 'Invokes expected REST API' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::new()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::AddMetadata()'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::GetUri() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ('PATCH ' +
                              'https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                              '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/properties?' +
                              'api-version=5.1-preview.1 ' +
                              '[{"op":"replace","path":"/Element4","value":1},' +
                              '{"op":"replace","path":"/Element2","value":"Value2"},' +
                              '{"op":"replace","path":"/Element1","value":"Value1"},' +
                              '{"op":"replace","path":"/Element3","value":true}]')
            }
            Mock -CommandName 'Invoke-RestMethod' -MockWith {
                return [PSCustomObject]@{
                    value = 'Fake Data'
                }
            } -Verifiable -ParameterFilter {
                $Method -eq 'PATCH' -and
                $Uri -eq ('https://dev.azure.com/prmetrics/AzureReposInvoker/_apis/git/repositories/' +
                          '41d31ec7-6c0a-467d-9e51-0cac9ae9a598/pullRequests/12345/properties?' +
                          'api-version=5.1-preview.1') -and
                $Headers.Count -eq 1 -and
                $Headers.Authorization -eq 'Bearer ACCESSTOKEN' -and
                $Body -eq '[{"op":"replace","path":"/Element4","value":1},' +
                          '{"op":"replace","path":"/Element2","value":"Value2"},' +
                          '{"op":"replace","path":"/Element1","value":"Value1"},' +
                          '{"op":"replace","path":"/Element3","value":true}]' -and
                $ContentType -eq 'application/json-patch+json; charset=utf-8'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::WriteOutput() hidden'
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ("{$([Environment]::NewLine)" +
                              "    `"value`":  `"Fake Data`"$([Environment]::NewLine)" +
                              '}')
            }
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq ''
            }
            $AzureReposInvoker = [AzureReposInvoker]::new()

            # Act
            $AzureReposInvoker.AddMetadata(@{
                '/Element1' = 'Value1'
                '/Element2' = 'Value2'
                '/Element3' = $true
                '/Element4' = 1
            })

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 7
            Assert-MockCalled -CommandName 'Invoke-RestMethod' -Exactly 1
        }
    }

    Context -Name 'IsAccessTokenAvailable with access token' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalAccessToken = $env:SYSTEM_ACCESSTOKEN
            $env:SYSTEM_ACCESSTOKEN = 'ACCESSTOKEN'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }

            # Act
            $response = [AzureReposInvoker]::IsAccessTokenAvailable()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be $true
            $env:SYSTEM_ACCESSTOKEN = $OriginalAccessToken
        }
    }

    Context -Name 'IsAccessTokenAvailable without access token' {
        It -Name 'Returns expected output' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            $OriginalAccessToken = $env:SYSTEM_ACCESSTOKEN
            $env:SYSTEM_ACCESSTOKEN = $null
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '* [AzureReposInvoker]::IsAccessTokenAvailable() static'
            }

            # Act
            $response = [AzureReposInvoker]::IsAccessTokenAvailable()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            $response | Should -Be $false
            $env:SYSTEM_ACCESSTOKEN = $OriginalAccessToken
        }
    }
}
