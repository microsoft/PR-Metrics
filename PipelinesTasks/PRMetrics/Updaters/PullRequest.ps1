# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    A class for interacting with pull requests.
#>

#Requires -Version 5.0

class PullRequest {
    static [bool] IsPullRequest() {
        [Logger]::Log('* [PullRequest]::IsPullRequest() static')
        return $env:SYSTEM_PULLREQUEST_PULLREQUESTID
    }

    static [string] GetUpdatedDescription([PSCustomObject] $details) {
        [Logger]::Log('* [PullRequest]::GetUpdatedDescription() static')
        if ([System.Linq.Enumerable]::Any($details.PSObject.Properties) -and
            $details.PSObject.Properties.Name -contains 'description' -and
            ![string]::IsNullOrWhiteSpace($details.description)) {
            return $null
        }

        return "$([char]0x274C) **Add a description.**"
    }

    static [string] GetUpdatedTitle([string] $title, [string] $sizeIndicator) {
        [Logger]::Log('* [PullRequest]::GetUpdatedTitle() static')
        if ($title.StartsWith("$sizeIndicator $([char]0x25FE) ")) {
            return $null
        }

        $originalTitle = $title -replace ("^(XS|S|M|L|XL|\d+XL)($([char]0x2714)|$([char]0x26A0)$([char]0xFE0F))" +
                                          "\s$([char]0x25FE)\s"),
                                         ''
        return "$sizeIndicator $([char]0x25FE) $originalTitle"
    }

    static [int] GetCurrentIteration([PSCustomObject] $iterations) {
        [Logger]::Log('* [PullRequest]::GetCurrentIteration() static')
        return $iterations.value[-1].id
    }

    static [Hashtable] GetCommentData([PSCustomObject] $commentThreads,
                                      [int] $currentIteration,
                                      [System.Collections.Generic.List[string]] $ignoredFilesWithLinesAdded,
                                      [System.Collections.Generic.List[string]] $ignoredFilesWithoutLinesAdded) {
        [Logger]::Log('* [PullRequest]::GetCommentData() static')
        $result = @{
            IsMetricsPresent = $false
            MetricsThreadId = 0
            MetricsCommentId = 0
            IgnoredFilesWithLinesAdded = $ignoredFilesWithLinesAdded
            IgnoredFilesWithoutLinesAdded = $ignoredFilesWithoutLinesAdded
        }

        foreach ($commentThread in $commentThreads.value) {
            if (!$commentThread.threadContext) {
                [PullRequest]::GetMetricsCommentData($result, $commentThread, $currentIteration)
            }
            else {
                $fileName = $commentThread.threadContext.filePath.Substring(1)

                if ($result.IgnoredFilesWithLinesAdded.Contains($fileName)) {
                    [PullRequest]::GetIgnoredCommentData($result.IgnoredFilesWithLinesAdded, $fileName, $commentThread)
                }

                if ($result.IgnoredFilesWithoutLinesAdded.Contains($fileName)) {
                    [PullRequest]::GetIgnoredCommentData($result.IgnoredFilesWithoutLinesAdded,
                                                         $fileName,
                                                         $commentThread)
                }
            }
        }

        return $result
    }

    static [int] GetCommentThreadId([PSCustomObject] $commentThread) {
        [Logger]::Log('* [PullRequest]::GetCommentThreadId() static')
        return $commentThread.id
    }

    static [string] GetMetricsComment([CodeMetrics] $codeMetrics, [int] $currentIteration) {
        [Logger]::Log('* [PullRequest]::GetMetricsComment() static')
        $comment = [System.Text.StringBuilder]::new()
        $comment.AppendLine("$([PullRequest]::MetricsComment)$currentIteration")
        [PullRequest]::AddCommentStatuses($comment, $codeMetrics)

        $comment.AppendLine('||Lines')
        $comment.AppendLine('-|-:')
        [PullRequest]::AddCommentMetrics($comment, 'Product Code', $codeMetrics.Metrics.ProductCode, $false, $true)
        [PullRequest]::AddCommentMetrics($comment, 'Test Code', $codeMetrics.Metrics.TestCode, $false, $true)
        [PullRequest]::AddCommentMetrics($comment, 'Subtotal', $codeMetrics.Metrics.Subtotal, $true, $true)
        [PullRequest]::AddCommentMetrics($comment, 'Ignored', $codeMetrics.Metrics.Ignored, $false, $true)
        [PullRequest]::AddCommentMetrics($comment, 'Total', $codeMetrics.Metrics.Total, $true, $false)

        return $comment.ToString()
    }

    static [AzureReposCommentThreadStatus] GetMetricsCommentStatus([CodeMetrics] $codeMetrics) {
        [Logger]::Log('* [PullRequest]::GetMetricsCommentStatus() static')
        if ($codeMetrics.IsSmall() -and $codeMetrics.HasSufficientTestCode()) {
            return [AzureReposCommentThreadStatus]::Closed
        }
        else {
            return [AzureReposCommentThreadStatus]::Active
        }
    }

    static [string] GetIgnoredComment() {
        [Logger]::Log('* [PullRequest]::GetIgnoredComment() static')
        return "$([char]0x2757) **This file may not need to be reviewed.**"
    }

    hidden static [void] GetMetricsCommentData([Hashtable] $commentData,
                                               [PSCustomObject] $commentThread,
                                               [int] $currentIteration) {
        [Logger]::Log('* [PullRequest]::GetMetricsCommentData() hidden static')
        foreach ($comment in $commentThread.comments) {
            if ($comment.author.displayName.StartsWith([PullRequest]::Author)) {
                if ($comment.content.StartsWith([PullRequest]::MetricsComment)) {
                    $commentData.MetricsThreadId = $commentThread.id
                    $commentData.MetricsCommentId = $comment.id

                    if ($comment.content.StartsWith("$([PullRequest]::MetricsComment)$currentIteration")) {
                        $commentData.IsMetricsPresent = $true
                    }
                }
            }
        }
    }

    hidden static [void] GetIgnoredCommentData([System.Collections.Generic.List[string]] $ignoredFiles,
                                               [string] $fileName,
                                               [PSCustomObject] $commentThread) {
        [Logger]::Log('* [PullRequest]::GetIgnoredCommentData() hidden static')
        if ($commentThread.comments[0].author.displayName.StartsWith([PullRequest]::Author)) {
            if ($commentThread.comments[0].content -eq [PullRequest]::GetIgnoredComment()) {
                $ignoredFiles.Remove($fileName)
            }
        }
    }

    hidden static [void] AddCommentStatuses([System.Text.StringBuilder] $comment, [CodeMetrics] $codeMetrics) {
        [Logger]::Log('* [PullRequest]::AddCommentStatuses() hidden static')
        if ($codeMetrics.IsSmall()) {
            $comment.AppendLine("$([char]0x2714) **Thanks for keeping your pull request small.**")
        }
        else {
            $comment.AppendLine(("$([char]0x274C) **Try to keep pull requests smaller than " +
                                 "$($codeMetrics.BaseSize.ToString('N0')) lines of new product code by following the " +
                                 '[Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**'))
        }

        if ($codeMetrics.AreTestsExpected()) {
            if ($codeMetrics.HasSufficientTestCode()) {
                $comment.AppendLine("$([char]0x2714) **Thanks for adding tests.**")
            }
            else {
                $comment.AppendLine("$([char]0x26A0)$([char]0xFE0F) **Consider adding additional tests.**")
            }
        }
    }

    hidden static [void] AddCommentMetrics([System.Text.StringBuilder] $comment,
                                           [string] $title,
                                           [int] $metrics,
                                           [bool] $highlight,
                                           [bool] $addNewLine) {
        [Logger]::Log('* [PullRequest]::AddCommentMetrics() hidden static')

        $surround = ''
        if ($highlight) {
            $surround = '**'
        }

        $line = "$surround$title$surround|$surround$($metrics.ToString('N0'))$surround"
        if ($addNewLine) {
            $comment.AppendLine($line)
        } else {
            $comment.Append($line)
        }
    }

    hidden static [string] $Author = 'Project Collection Build Service ('
    hidden static [string] $MetricsComment = '# Metrics for iteration '
}
