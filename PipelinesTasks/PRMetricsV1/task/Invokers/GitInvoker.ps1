# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    A class invoking Git commands.
#>

#Requires -Version 5.1

class GitInvoker {
    [string] GetDiffSummary() {
        [Logger]::Log('* [GitInvoker]::GetDiffSummary()')
        $startIndex = 'refs/heads/'.Length
        $targetBranch = $env:SYSTEM_PULLREQUEST_TARGETBRANCH.Substring($startIndex)
        $parameters = @(
            'diff'
            '--numstat'
            "origin/$targetBranch...pull/$env:SYSTEM_PULLREQUEST_PULLREQUESTID/merge"
        )

        return $this.InvokeGit($parameters)
    }

    hidden [string] InvokeGit([string[]] $arguments) {
        [Logger]::Log('* [GitInvoker]::InvokeGit() hidden')
        [Logger]::Log("Git $arguments")

        $processInfo = New-Object -TypeName 'System.Diagnostics.ProcessStartInfo' -Property @{
            Arguments = $arguments
            FileName = 'git'
            RedirectStandardOutput = $true
            UseShellExecute = $false
            WorkingDirectory = $env:BUILD_REPOSITORY_LOCALPATH
        }

        $process = New-Object -TypeName 'System.Diagnostics.Process' -Property @{
            StartInfo = $processInfo
        }

        try {
            $process.Start() | Out-Null

            $out = $process.StandardOutput.ReadToEnd()
            $exited = $process.WaitForExit([GitInvoker]::TimeoutInMilliseconds)
            if (!$exited) {
                throw [System.TimeoutException]'Git failed to run within the allocated time.'
            }

            [Logger]::Log($out)
            return $out
        }
        finally {
            $process.Close()
        }
    }

    static hidden [int] $TimeoutInMilliseconds = 5 * 60 * 1000;
}
