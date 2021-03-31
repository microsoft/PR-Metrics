// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { injectable } from 'tsyringe'
import { Validator } from '../utilities/validator'
import * as os from 'os'
import AzureReposInvoker from '../azureRepos/azureReposInvoker'
import CodeMetrics from '../metrics/codeMetrics'
import Inputs from '../metrics/inputs'
import PullRequestCommentsData from './pullRequestCommentsData'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests comments.
 */
@injectable()
export default class PullRequestComments {
  private readonly _azureReposInvoker: AzureReposInvoker
  private readonly _codeMetrics: CodeMetrics
  private readonly _inputs: Inputs
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param azureReposInvoker The Azure Repos invoker logic.
   * @param codeMetrics The code metrics calculation logic.
   * @param inputs The inputs passed to the task.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (azureReposInvoker: AzureReposInvoker, codeMetrics: CodeMetrics, inputs: Inputs, taskLibWrapper: TaskLibWrapper) {
    this._azureReposInvoker = azureReposInvoker
    this._codeMetrics = codeMetrics
    this._inputs = inputs
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the comment to add to files within the pull request that do not require review.
   * @returns The comment to add to files that do not require review.
   */
  public get noReviewRequiredComment (): string {
    this._taskLibWrapper.debug('* PullRequestComments.noReviewRequiredComment')

    return this._taskLibWrapper.loc('pullRequests.pullRequestComments.noReviewRequiredComment')
  }

  /**
   * Gets the data used for constructing the comment within the pull request.
   * @param The number of the current iteration.
   * @returns A promise containing the data used for constructing the comment within the pull request.
   */
  public async getCommentData (currentIteration: number): Promise<PullRequestCommentsData> {
    this._taskLibWrapper.debug('* PullRequestComments.getCommentData()')

    let result: PullRequestCommentsData = new PullRequestCommentsData(this._codeMetrics.filesNotRequiringReview)

    const commentThreads: GitPullRequestCommentThread[] = await this._azureReposInvoker.getCommentThreads()
    for (let i: number = 0; i < commentThreads.length; i++) {
      const commentThread: GitPullRequestCommentThread = commentThreads[i]!
      if (!commentThread.threadContext) {
        // If the current comment thread is not applied to a specified file, check if it is the metrics comment thread.
        result = this.getMetricsCommentData(result, currentIteration, commentThread, i)
      } else {
        // If the current comment thread is applied to a specified file, check if it already contains a comment related to files that can be ignored.
        const filePath: string = Validator.validate(commentThread.threadContext.filePath, `commentThread[${i}].threadContext.filePath`, 'PullRequestComments.getCommentData()')
        if (filePath.length <= 1) {
          throw RangeError(`'commentThread[${i}].threadContext.filePath' '${filePath}' is of length '${filePath.length}'.`)
        }

        const fileName: string = filePath.substring(1)

        const index: number = this._codeMetrics.filesNotRequiringReview.indexOf(fileName)
        if (index !== -1) {
          result.filesNotRequiringReview = this.getNoReviewRequiredCommentData(result.filesNotRequiringReview, index, commentThread, i)
          continue
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

    let result: string = `${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', currentIteration.toLocaleString())}${os.EOL}`
    result += this.addCommentSizeStatus()
    result += this.addCommentTestStatus()

    result += `||${this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableLines')}${os.EOL}`
    result += `-|-:${os.EOL}`
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableProductCode'), this._codeMetrics.metrics.productCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableTestCode'), this._codeMetrics.metrics.testCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableSubtotal'), this._codeMetrics.metrics.subtotal, true)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableIgnoredCode'), this._codeMetrics.metrics.ignoredCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableTotal'), this._codeMetrics.metrics.total, true)

    result += os.EOL
    result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentFooter')

    return result
  }

  /**
   * Gets the status to which to update the comment thread.
   * @returns The status to which to update the comment thread.
   */
  public getMetricsCommentStatus (): CommentThreadStatus {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')

    if (this._codeMetrics.isSmall && (this._codeMetrics.isSufficientlyTested || this._codeMetrics.isSufficientlyTested === null)) {
      return CommentThreadStatus.Closed
    }

    return CommentThreadStatus.Active
  }

  private getMetricsCommentData (result: PullRequestCommentsData, currentIteration: number, commentThread: GitPullRequestCommentThread, commentThreadIndex: number): PullRequestCommentsData {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')

    const comments: Comment[] = Validator.validate(commentThread.comments, `commentThread[${commentThreadIndex}].comments`, 'PullRequestComments.getMetricsCommentData()')
    for (let i: number = 0; i < comments.length; i++) {
      const comment: Comment = comments[i]!

      const content: string = Validator.validate(comment.content, `commentThread[${commentThreadIndex}].comments[${i}].content`, 'PullRequestComments.getMetricsCommentData()')
      const commentHeaderRegExp: RegExp = new RegExp(`^${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', '.+')}`)
      if (!commentHeaderRegExp.test(content)) {
        continue
      }

      result.isMetricsCommentPresent = content.startsWith(`${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', currentIteration.toLocaleString())}${os.EOL}`)
      result.metricsCommentThreadId = Validator.validate(commentThread.id, `commentThread[${commentThreadIndex}].id`, 'PullRequestComments.getMetricsCommentData()')
      result.metricsCommentId = Validator.validate(comment.id, `commentThread[${commentThreadIndex}].comments[${i}].id`, 'PullRequestComments.getMetricsCommentData()')
    }

    return result
  }

  private getNoReviewRequiredCommentData (filesNotRequiringReview: string[], fileNameIndex: number, commentThread: GitPullRequestCommentThread, commentThreadIndex: number): string[] {
    this._taskLibWrapper.debug('* PullRequestComments.getNoReviewRequiredCommentData()')

    const comments: Comment[] = Validator.validate(commentThread.comments, `commentThread[${commentThreadIndex}].comments`, 'PullRequestComments.getNoReviewRequiredCommentData()')
    const comment: Comment = Validator.validate(comments[0], `commentThread[${commentThreadIndex}].comments[0]`, 'PullRequestComments.getNoReviewRequiredCommentData()')

    const content: string = Validator.validate(comment.content, `commentThread[${commentThreadIndex}].comments[0].content`, 'PullRequestComments.getNoReviewRequiredCommentData()')
    if (content !== this.noReviewRequiredComment) {
      return filesNotRequiringReview
    }

    filesNotRequiringReview.splice(fileNameIndex, 1)
    return filesNotRequiringReview
  }

  private addCommentSizeStatus (): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')

    let result: string = ''
    if (this._codeMetrics.isSmall) {
      result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.smallPullRequestComment')
    } else {
      result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', this._inputs.baseSize.toLocaleString())
    }

    result += os.EOL
    return result
  }

  private addCommentTestStatus (): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')

    let result: string = ''
    if (this._codeMetrics.isSufficientlyTested !== null) {
      if (this._codeMetrics.isSufficientlyTested) {
        result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.testsSufficientComment')
      } else {
        result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.testsInsufficientComment')
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
