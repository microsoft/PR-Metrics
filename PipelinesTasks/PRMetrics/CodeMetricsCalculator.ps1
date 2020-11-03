# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

<#
.SYNOPSIS
    A class for calculating and updating the code metrics within pull requests.
#>

#Requires -Version 5.0

class CodeMetricsCalculator {
    CodeMetricsCalculator([string] $baseSize,
                          [string] $growthRate,
                          [string] $testFactor,
                          [string] $fileMatchingPatterns,
                          [string] $codeFileExtensions) {
        [Logger]::Log('* [CodeMetricsCalculator]::new()')
        $gitInvoker = [GitInvoker]::new()
        $this.CodeMetrics = [CodeMetrics]::new($baseSize,
                                               $growthRate,
                                               $testFactor,
                                               $fileMatchingPatterns,
                                               $codeFileExtensions,
                                               $gitInvoker.GetDiffSummary())
        $this.AzureReposInvoker = [AzureReposInvoker]::new()
    }

    [void] UpdateDetails() {
        [Logger]::Log('* [CodeMetricsCalculator]::UpdateDetails()')
        $details = $this.AzureReposInvoker.GetDetails()
        $updatedDescription = [PullRequest]::GetUpdatedDescription($details)
        $updatedTitle = [PullRequest]::GetUpdatedTitle($details.title, $this.CodeMetrics.GetSizeIndicator())
        $this.AzureReposInvoker.SetDetails($updatedDescription, $updatedTitle)
    }

    [void] UpdateComment() {
        [Logger]::Log('* [CodeMetricsCalculator]::UpdateComment()')
        $commentThreads = $this.AzureReposInvoker.GetCommentThreads()
        $iterations = $this.AzureReposInvoker.GetIterations()
        $currentIteration = [PullRequest]::GetCurrentIteration($iterations)
        $commentData = [PullRequest]::GetCommentData($commentThreads,
                                                     $currentIteration,
                                                     $this.CodeMetrics.IgnoredFilesWithLinesAdded,
                                                     $this.CodeMetrics.IgnoredFilesWithoutLinesAdded)

        if (!$commentData.IsMetricsPresent) {
            $this.UpdateMetricsComment($commentData, $currentIteration)
            $this.AddMetadata()
        }

        foreach ($ignoredFile in $commentData.IgnoredFilesWithLinesAdded) {
            $this.UpdateIgnoredComment($ignoredFile, $true)
        }

        foreach ($ignoredFile in $commentData.IgnoredFilesWithoutLinesAdded) {
            $this.UpdateIgnoredComment($ignoredFile, $false)
        }
    }

    static [bool] IsPullRequest() {
        [Logger]::Log('* [CodeMetricsCalculator]::IsPullRequest() static')
        return [PullRequest]::IsPullRequest()
    }

    static [bool] IsAccessTokenAvailable() {
        [Logger]::Log('* [CodeMetricsCalculator]::IsAccessTokenAvailable() static')
        return [AzureReposInvoker]::IsAccessTokenAvailable()
    }

    hidden [void] UpdateMetricsComment([Hashtable] $commentData, [int] $currentIteration) {
        [Logger]::Log('* [CodeMetricsCalculator]::UpdateMetricsComment() hidden')
        $comment = [PullRequest]::GetMetricsComment($this.CodeMetrics, $currentIteration)
        $status = [PullRequest]::GetMetricsCommentStatus($this.CodeMetrics)
        if ($commentData.MetricsThreadId -ne 0) {
            $this.AzureReposInvoker.CreateComment($commentData.MetricsThreadId, $commentData.MetricsCommentId, $comment)
        }
        else {
            $commentThread = $this.AzureReposInvoker.CreateCommentThread($comment, $null, $true)
            $commentData.MetricsThreadId = [PullRequest]::GetCommentThreadId($commentThread)
        }

        $this.AzureReposInvoker.SetCommentThreadStatus($commentData.MetricsThreadId, $status)
    }

    hidden [void] AddMetadata() {
        [Logger]::Log('* [CodeMetricsCalculator]::AddMetadata() hidden')
        $metadata = @{
            '/PRMetrics.Size' = $this.CodeMetrics.Size
            '/PRMetrics.TestCoverage' = $this.CodeMetrics.HasSufficientTestCode()
            '/PRMetrics.ProductCode' = $this.CodeMetrics.Metrics.ProductCode
            '/PRMetrics.TestCode' = $this.CodeMetrics.Metrics.TestCode
            '/PRMetrics.Subtotal' = $this.CodeMetrics.Metrics.Subtotal
            '/PRMetrics.Ignored' = $this.CodeMetrics.Metrics.Ignored
            '/PRMetrics.Total' = $this.CodeMetrics.Metrics.Total
        }

        $this.AzureReposInvoker.AddMetadata($metadata)
    }

    hidden [void] UpdateIgnoredComment([string] $fileName, [bool] $withAdds) {
        [Logger]::Log('* [CodeMetricsCalculator]::UpdateIgnoredComment() hidden')
        $comment = [PullRequest]::GetIgnoredComment()
        $commentThread = $this.AzureReposInvoker.CreateCommentThread($comment, $fileName, $withAdds)
        $commentThreadId = [PullRequest]::GetCommentThreadId($commentThread)
        $this.AzureReposInvoker.SetCommentThreadStatus($commentThreadId, [AzureReposCommentThreadStatus]::Closed)
    }

    hidden [CodeMetrics] $CodeMetrics
    hidden [AzureReposInvoker] $AzureReposInvoker
}
