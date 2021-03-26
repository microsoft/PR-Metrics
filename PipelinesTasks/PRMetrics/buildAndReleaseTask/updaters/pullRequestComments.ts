// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { injectable } from 'tsyringe'
import { Validator } from '../utilities/validator'
import * as os from 'os'
import AzureReposInvoker from '../invokers/azureReposInvoker'
import CodeMetrics from './codeMetrics'
import Parameters from './parameters'
import PullRequestCommentsData from './pullRequestCommentsData'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests comments.
 */
@injectable()
export default class PullRequestComments {
  private readonly _azureReposInvoker: AzureReposInvoker
  private readonly _codeMetrics: CodeMetrics
  private readonly _parameters: Parameters
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param azureReposInvoker The Azure Repos invoker logic.
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
  public async getCommentData (currentIteration: number): Promise<PullRequestCommentsData> {
    this._taskLibWrapper.debug('* PullRequestComments.getCommentData()')

    let result: PullRequestCommentsData = new PullRequestCommentsData(this._codeMetrics.ignoredFilesWithLinesAdded, this._codeMetrics.ignoredFilesWithoutLinesAdded)

    const commentThreads: GitPullRequestCommentThread[] = await this._azureReposInvoker.getCommentThreads()
    for (let i: number = 0; i < commentThreads.length; i++) {
      const commentThread: GitPullRequestCommentThread = commentThreads[i]!
      if (!commentThread.pullRequestThreadContext || !commentThread.pullRequestThreadContext.trackingCriteria) {
        // If the current comment thread is not applied to a specified file, check if it is the metrics comment thread.
        result = this.getMetricsCommentData(result, currentIteration, commentThread, i)
      } else {
        // If the current comment thread is applied to a specified file, check if it already contains a comment related to files that can be ignored.
        const filePath: string = Validator.validateField(commentThread.pullRequestThreadContext.trackingCriteria.origFilePath, `commentThread[${i}].pullRequestThreadContext.trackingCriteria.origFilePath`, 'PullRequestComments.getCommentData()')
        if (filePath.length <= 1) {
          throw RangeError(`'commentThread[${i}].pullRequestThreadContext.trackingCriteria.origFilePath' '${filePath}' is of length '${filePath.length}'.`)
        }

        const fileName: string = filePath.substring(1)

        const withLinesAddedIndex: number = this._codeMetrics.ignoredFilesWithLinesAdded.indexOf(fileName)
        if (withLinesAddedIndex !== -1) {
          result.ignoredFilesWithLinesAdded = this.getIgnoredCommentData(result.ignoredFilesWithLinesAdded, withLinesAddedIndex, commentThread, i)
          continue
        }

        const withoutLinesAddedIndex: number = this._codeMetrics.ignoredFilesWithoutLinesAdded.indexOf(fileName)
        if (withoutLinesAddedIndex !== -1) {
          result.ignoredFilesWithoutLinesAdded = this.getIgnoredCommentData(result.ignoredFilesWithoutLinesAdded, withoutLinesAddedIndex, commentThread, i)
        }
      }
    }

    return result
  }

  /**
   * Gets the comment to add to the comment thread.
   * @param The number of the current iteration.
   * @returns The comment to add to the comment thread.
   */
  public getMetricsComment (currentIteration: number): string {
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

  private getMetricsCommentData (result: PullRequestCommentsData, currentIteration: number, commentThread: GitPullRequestCommentThread, commentThreadIndex: number): PullRequestCommentsData {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')

    const comments: Comment[] = Validator.validateField(commentThread.comments, `commentThread[${commentThreadIndex}].comments`, 'PullRequestComments.getMetricsCommentData()')
    for (let i: number = 0; i < comments.length; i++) {
      const comment: Comment = comments[i]!

      const content: string = Validator.validateField(comment.content, `commentThread[${commentThreadIndex}].comments[${i}].content`, 'PullRequestComments.getMetricsCommentData()')
      const commentHeaderRegExp: RegExp = new RegExp(`^${this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', '.+')}`)
      if (!content.match(commentHeaderRegExp)) {
        continue
      }

      result.isPresent = content.startsWith(`${this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', currentIteration.toLocaleString())}${os.EOL}`)
      result.threadId = Validator.validateField(commentThread.id, `commentThread[${commentThreadIndex}].id`, 'PullRequestComments.getMetricsCommentData()')
      result.commentId = Validator.validateField(comment.id, `commentThread[${commentThreadIndex}].comments[${i}].id`, 'PullRequestComments.getMetricsCommentData()')
    }

    return result
  }

  private getIgnoredCommentData (ignoredFiles: string[], fileNameIndex: number, commentThread: GitPullRequestCommentThread, commentThreadIndex: number): string[] {
    this._taskLibWrapper.debug('* PullRequestComments.getIgnoredCommentData()')

    const comments: Comment[] = Validator.validateField(commentThread.comments, `commentThread[${commentThreadIndex}].comments`, 'PullRequestComments.getIgnoredCommentData()')
    const comment: Comment = Validator.validateField(comments[0], `commentThread[${commentThreadIndex}].comments[0]`, 'PullRequestComments.getIgnoredCommentData()')

    const content: string = Validator.validateField(comment.content, `commentThread[${commentThreadIndex}].comments[0].content`, 'PullRequestComments.getIgnoredCommentData()')
    if (content !== this.ignoredComment) {
      return ignoredFiles
    }

    ignoredFiles.splice(fileNameIndex, 1)
    return ignoredFiles
  }

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
