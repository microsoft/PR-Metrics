# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    Unit tests for the class used to logging telemetry.
#>

#Requires -Version 5.0

BeforeAll {
    Set-StrictMode -Version 'Latest'

    . $PSCommandPath.Replace('.Tests.ps1','.ps1')
}

Describe -Name 'Logger' {
    BeforeEach {
        Set-StrictMode -Version 'Latest'

        Mock -CommandName 'Write-Verbose' -MockWith {
            throw [System.NotImplementedException]"Write-Verbose must not be called but was called with '$Message'."
        }
        Mock -CommandName 'Write-Information' -MockWith {
            throw [System.NotImplementedException]"Write-Information must not be called but was called with '$MessageData'."
        }
        Mock -CommandName 'Invoke-RestMethod' -MockWith {
            throw [System.NotImplementedException]"Invoke-RestMethod must not be called but was called with '$Uri'."
        }
    }

    Context -Name 'Log' {
        It -Name 'Performs the expected actions' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '0123456789'
            }
            [Logger]::Statements.Clear()

            # Act
            [Logger]::Log('0123456789')

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 1
            [Logger]::Statements.Count | Should -Be 1
            [Logger]::Statements[0] | Should -Be '0123456789'
        }
    }

    Context -Name 'OutputAll' {
        It -Name 'Performs the expected actions' {
            # Arrange
            Set-StrictMode -Version 'Latest'
            Mock -CommandName 'Write-Verbose' -MockWith {} -Verifiable -ParameterFilter {
                $Message -eq '0123456789'
            }
            Mock -CommandName 'Write-Information' -MockWith {} -Verifiable -ParameterFilter {
                $MessageData -eq '0123456789'
            }
            [Logger]::Statements.Clear()
            for ($i = 0; $i -lt 10; $i++) {
                [Logger]::Log('0123456789')
            }

            # Act
            [Logger]::OutputAll()

            # Assert
            Assert-MockCalled -CommandName 'Write-Verbose' -Exactly 10
            Assert-MockCalled -CommandName 'Write-Information' -Exactly 10
            [Logger]::Statements.Count | Should -Be 10
            foreach ($statement in [Logger]::Statements) {
                $statement | Should -Be '0123456789'
            }
        }
    }
}
