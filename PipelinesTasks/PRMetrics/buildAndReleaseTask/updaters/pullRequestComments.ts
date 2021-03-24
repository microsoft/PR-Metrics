// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import * as os from 'os'
import AzureReposInvoker from '../invokers/azureReposInvoker'
import CodeMetrics from './codeMetrics'
import CommentData from './commentData'
import Parameters from './parameters'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests comments.
 */
export default class PullRequestComments {
  private readonly _azureReposInvoker: AzureReposInvoker;
  private readonly _codeMetrics: CodeMetrics;
  private readonly _parameters: Parameters;
  private readonly _taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param parameters The parameters passed to the task.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (azureReposInvoker: AzureReposInvoker, codeMetrics: CodeMetrics, parameters: Parameters, taskLibWrapper: TaskLibWrapper) {
    this._azureReposInvoker = azureReposInvoker
    this._codeMetrics = codeMetrics
    this._parameters = parameters
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the comment to add to ignored files within the pull request.
   * @returns The comment to add to ignored files within the pull request.
   */
  public get ignoredComment (): string {
    this._taskLibWrapper.debug('* PullRequestComments.ignoredComment')

    return this._taskLibWrapper.loc('updaters.pullRequestComments.fileIgnoredComment')
  }

  /**
   * Gets the data used for constructing the comment within the pull request.
   * @param The number of the current iteration.
   * @returns A promise containing the data used for constructing the comment within the pull request.
   */
  public async getCommentData (currentIteration: number): Promise<CommentData> {
    this._taskLibWrapper.debug('* PullRequestComments.getCommentData()')

    const result: CommentData = {
      isPresent: false,
      threadId: 0,
      commentId: 0,
      ignoredFilesWithLinesAdded: this._codeMetrics.ignoredFilesWithLinesAdded,
      ignoredFilesWithoutLinesAdded: this._codeMetrics.ignoredFilesWithoutLinesAdded
    }

    const commentThreads: GitPullRequestCommentThread[] = await this._azureReposInvoker.getCommentThreads()
    for (let i: number = 0; i < commentThreads.length; i++) {
      const commentThread: GitPullRequestCommentThread = commentThreads[i]!
      if (!commentThread.pullRequestThreadContext) {
        this.getMetricsCommentData(result, commentThread, currentIteration)
      } else {
        // const fileName: string = commentThread.pullRequestThreadContext.trackingCriteria?.origFilePath.Substring(1)

        // if (IgnoredFilesWithLinesAdded.Contains($fileName)) {
        //     [PullRequest]::GetIgnoredCommentData($result.IgnoredFilesWithLinesAdded, $fileName, $commentThread)
        // }

        // if (IgnoredFilesWithoutLinesAdded.Contains($fileName)) {
        //     [PullRequest]::GetIgnoredCommentData($result.IgnoredFilesWithoutLinesAdded,
        //                                          $fileName,
        //                                          $commentThread)
        // }
      }
    }

    return result
  }

  /**
   * Gets the ID of the comment thread used by this task.
   * @returns The ID of the comment thread used by this task or `null` if no comment thread exists.
   */
  public getCommentThreadId (): number | null {
    this._taskLibWrapper.debug('* PullRequestComments.getCommentThreadId()')

    return 1 // TODO: Update once dependencies are added
  }

  /**
   * Gets the comment to add to the comment thread.
   * @param The number of the current iteration.
   * @returns A promise containing the comment to add to the comment thread.
   */
  public async getMetricsComment (currentIteration: number): Promise<string> {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')

    let result: string = `${this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', currentIteration.toLocaleString())}${os.EOL}`
    result += this.addCommentSizeStatus()
    result += this.addCommentTestStatus()

    result += `||${this._taskLibWrapper.loc('updaters.pullRequestComments.tableLines')}${os.EOL}`
    result += `-|-:${os.EOL}`
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableProductCode'), this._codeMetrics.metrics.productCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableTestCode'), this._codeMetrics.metrics.testCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableSubtotal'), this._codeMetrics.metrics.subtotal, true)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableIgnoredCode'), this._codeMetrics.metrics.ignoredCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableTotal'), this._codeMetrics.metrics.total, true)

    result += os.EOL
    result += this._taskLibWrapper.loc('updaters.pullRequestComments.commentFooter')

    return result
  }

  /**
   * Gets the status to which to update the comment thread.
   * @returns The status to which to update the comment thread.
   */
  public getMetricsCommentStatus (): CommentThreadStatus {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')

    if (this._codeMetrics.isSmall && this._codeMetrics.isSufficientlyTested) {
      return CommentThreadStatus.Closed
    }

    return CommentThreadStatus.Active
  }

  private getMetricsCommentData (result: CommentData, commentThread: GitPullRequestCommentThread, currentIteration: number): void {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')

    this.validateField(commentThread.comments, 'commentThread.comments')

    for (let i: number = 0; i < commentThread.comments!.length; i++) {
      const comment: Comment = commentThread.comments![i]!

      this.validateField(comment.author, 'comment.author')
      this.validateField(comment.author!.displayName, 'comment.author.displayName')

      if (comment.author!.displayName!.startsWith('Project Collection Build Service (')) {
        this.validateField(comment.content, 'comment.content')

        const commentHeader: RegExp = new RegExp(`^${this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', currentIteration.toLocaleString())}`)
        if (!comment.content!.match(commentHeader)) {
          this.validateField(commentThread.id, 'commentThread.id')
          this.validateField(comment.id, 'comment.id')

          result.threadId = commentThread!.id!
          result.commentId = comment.id!
          const commentHeader: string = this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', currentIteration.toLocaleString())
          if (comment.content!.startsWith(commentHeader)) {
            result.isPresent = true
          }
        }
      }
    }
  }

  private validateField<T> (field: T | null | undefined, fieldName: string): void {
    if (!field) {
      throw new Error(`Field '${fieldName}' is null or undefined.`)
    }
  }

    // hidden static [void] GetIgnoredCommentData([System.Collections.Generic.List[string]] $ignoredFiles,
    //                                            [string] $fileName,
    //                                            [PSCustomObject] $commentThread) {
    //     [Logger]::Log('* [PullRequest]::GetIgnoredCommentData() hidden static')
    //     if ($commentThread.comments[0].author.displayName.StartsWith([PullRequest]::Author)) {
    //         if ($commentThread.comments[0].content -eq [PullRequest]::GetIgnoredComment()) {
    //             $ignoredFiles.Remove($fileName)
    //         }
    //     }
    // }

  private addCommentSizeStatus (): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')

    let result: string = ''
    if (this._codeMetrics.isSmall) {
      result += this._taskLibWrapper.loc('updaters.pullRequestComments.smallPullRequestComment')
    } else {
      result += this._taskLibWrapper.loc('updaters.pullRequestComments.largePullRequestComment', this._parameters.baseSize.toLocaleString())
    }

    result += os.EOL
    return result
  }

  private addCommentTestStatus (): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')

    let result: string = ''
    if (this._codeMetrics.isSufficientlyTested !== null) {
      if (this._codeMetrics.isSufficientlyTested) {
        result += this._taskLibWrapper.loc('updaters.pullRequestComments.testsSufficientComment')
      } else {
        result += this._taskLibWrapper.loc('updaters.pullRequestComments.testsInsufficientComment')
      }

      result += os.EOL
    }

    return result
  }

  private addCommentMetrics (title: string, metric: number, highlight: boolean): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')

    let surround: string = ''
    if (highlight) {
      surround = '**'
    }

    return `${surround}${title}${surround}|${surround}${metric.toLocaleString()}${surround}${os.EOL}`
  }
}
