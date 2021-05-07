// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { injectable } from 'tsyringe'
import { Validator } from '../utilities/validator'
import * as os from 'os'
import AzureReposInvoker from '../azureRepos/azureReposInvoker'
import CodeMetrics from '../metrics/codeMetrics'
import CodeMetricsData from '../metrics/codeMetricsData'
import Inputs from '../metrics/inputs'
import Logger from '../utilities/logger'
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
  private readonly _logger: Logger
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param azureReposInvoker The Azure Repos invoker logic.
   * @param codeMetrics The code metrics calculation logic.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (azureReposInvoker: AzureReposInvoker, codeMetrics: CodeMetrics, inputs: Inputs, logger: Logger, taskLibWrapper: TaskLibWrapper) {
    this._azureReposInvoker = azureReposInvoker
    this._codeMetrics = codeMetrics
    this._inputs = inputs
    this._logger = logger
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the comment to add to files within the pull request that do not require review.
   * @returns The comment to add to files that do not require review.
   */
  public get noReviewRequiredComment (): string {
    this._logger.logDebug('* PullRequestComments.noReviewRequiredComment')

    return this._taskLibWrapper.loc('pullRequests.pullRequestComments.noReviewRequiredComment')
  }

  /**
   * Gets the data used for constructing the comment within the pull request.
   * @param The number of the current iteration.
   * @returns A promise containing the data used for constructing the comment within the pull request.
   */
  public async getCommentData (currentIteration: number): Promise<PullRequestCommentsData> {
    this._logger.logDebug('* PullRequestComments.getCommentData()')

    const filesNotRequiringReview: string[] = await this._codeMetrics.getFilesNotRequiringReview()
    const deletedFilesNotRequiringReview: string[] = await this._codeMetrics.getDeletedFilesNotRequiringReview()
    let result: PullRequestCommentsData = new PullRequestCommentsData(filesNotRequiringReview, deletedFilesNotRequiringReview)

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

        const fileIndex: number = filesNotRequiringReview.indexOf(fileName)
        if (fileIndex !== -1) {
          result.filesNotRequiringReview = this.getNoReviewRequiredCommentData(result.filesNotRequiringReview, fileIndex, commentThread, i)
          continue
        }

        const deletedFileIndex: number = deletedFilesNotRequiringReview.indexOf(fileName)
        if (deletedFileIndex !== -1) {
          result.deletedFilesNotRequiringReview = this.getNoReviewRequiredCommentData(result.deletedFilesNotRequiringReview, deletedFileIndex, commentThread, i)
          continue
        }
      }
    }

    return result
  }

  /**
   * Gets the comment to add to the comment thread.
   * @param The number of the current iteration.
   * @returns A promise containing the comment to add to the comment thread.
   */
  public async getMetricsComment (currentIteration: number): Promise<string> {
    this._logger.logDebug('* PullRequestComments.getMetricsComment()')

    const metrics: CodeMetricsData = await this._codeMetrics.getMetrics()

    let result: string = `${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', currentIteration.toLocaleString())}${os.EOL}`
    result += await this.addCommentSizeStatus()
    result += await this.addCommentTestStatus()

    result += `||${this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableLines')}${os.EOL}`
    result += `-|-:${os.EOL}`
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableProductCode'), metrics.productCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableTestCode'), metrics.testCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableSubtotal'), metrics.subtotal, true)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableIgnoredCode'), metrics.ignoredCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('pullRequests.pullRequestComments.tableTotal'), metrics.total, true)

    result += os.EOL
    result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentFooter')

    return result
  }

  /**
   * Gets the status to which to update the comment thread.
   * @returns A promise containing the status to which to update the comment thread.
   */
  public async getMetricsCommentStatus (): Promise<CommentThreadStatus> {
    this._logger.logDebug('* PullRequestComments.getMetricsCommentStatus()')

    if (await this._codeMetrics.isSmall()) {
      const isSufficientlyTested: boolean | null = await this._codeMetrics.isSufficientlyTested()

      if (isSufficientlyTested || isSufficientlyTested === null) {
        return CommentThreadStatus.Closed
      }
    }

    return CommentThreadStatus.Active
  }

  private getMetricsCommentData (result: PullRequestCommentsData, currentIteration: number, commentThread: GitPullRequestCommentThread, commentThreadIndex: number): PullRequestCommentsData {
    this._logger.logDebug('* PullRequestComments.getMetricsCommentData()')

    const comments: Comment[] = Validator.validate(commentThread.comments, `commentThread[${commentThreadIndex}].comments`, 'PullRequestComments.getMetricsCommentData()')
    for (let i: number = 0; i < comments.length; i++) {
      const comment: Comment = comments[i]!

      if (comment.content) {
        const commentHeaderRegExp: RegExp = new RegExp(`^${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', '.+')}`)
        if (!commentHeaderRegExp.test(comment.content)) {
          continue
        }

        result.isMetricsCommentPresent = comment.content.startsWith(`${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', currentIteration.toLocaleString())}${os.EOL}`)
        result.metricsCommentThreadId = Validator.validate(commentThread.id, `commentThread[${commentThreadIndex}].id`, 'PullRequestComments.getMetricsCommentData()')
        result.metricsCommentId = Validator.validate(comment.id, `commentThread[${commentThreadIndex}].comments[${i}].id`, 'PullRequestComments.getMetricsCommentData()')
      }
    }

    return result
  }

  private getNoReviewRequiredCommentData (filesNotRequiringReview: string[], fileNameIndex: number, commentThread: GitPullRequestCommentThread, commentThreadIndex: number): string[] {
    this._logger.logDebug('* PullRequestComments.getNoReviewRequiredCommentData()')

    const comments: Comment[] = Validator.validate(commentThread.comments, `commentThread[${commentThreadIndex}].comments`, 'PullRequestComments.getNoReviewRequiredCommentData()')
    const comment: Comment = Validator.validate(comments[0], `commentThread[${commentThreadIndex}].comments[0]`, 'PullRequestComments.getNoReviewRequiredCommentData()')

    const content: string = Validator.validate(comment.content, `commentThread[${commentThreadIndex}].comments[0].content`, 'PullRequestComments.getNoReviewRequiredCommentData()')
    if (content !== this.noReviewRequiredComment) {
      return filesNotRequiringReview
    }

    filesNotRequiringReview.splice(fileNameIndex, 1)
    return filesNotRequiringReview
  }

  private async addCommentSizeStatus (): Promise<string> {
    this._logger.logDebug('* PullRequestComments.addCommentSizeStatus()')

    let result: string = ''
    if (await this._codeMetrics.isSmall()) {
      result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.smallPullRequestComment')
    } else {
      result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', this._inputs.baseSize.toLocaleString())
    }

    result += os.EOL
    return result
  }

  private async addCommentTestStatus (): Promise<string> {
    this._logger.logDebug('* PullRequestComments.addCommentTestStatus()')

    let result: string = ''
    const isSufficientlyTested: boolean | null = await this._codeMetrics.isSufficientlyTested()
    if (isSufficientlyTested !== null) {
      if (isSufficientlyTested) {
        result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.testsSufficientComment')
      } else {
        result += this._taskLibWrapper.loc('pullRequests.pullRequestComments.testsInsufficientComment')
      }

      result += os.EOL
    }

    return result
  }

  private addCommentMetrics (title: string, metric: number, highlight: boolean): string {
    this._logger.logDebug('* PullRequestComments.addCommentMetrics()')

    let surround: string = ''
    if (highlight) {
      surround = '**'
    }

    return `${surround}${title}${surround}|${surround}${metric.toLocaleString()}${surround}${os.EOL}`
  }
}
