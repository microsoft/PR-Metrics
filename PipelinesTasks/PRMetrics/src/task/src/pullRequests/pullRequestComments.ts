// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { injectable } from 'tsyringe'
import * as os from 'os'
import CodeMetrics from '../metrics/codeMetrics'
import CodeMetricsData from '../metrics/codeMetricsData'
import FileCommentData from '../repos/interfaces/fileCommentData'
import Inputs from '../metrics/inputs'
import Logger from '../utilities/logger'
import PullRequestCommentData from '../repos/interfaces/pullRequestCommentData'
import CommentData from '../repos/interfaces/commentData'
import PullRequestCommentsData from './pullRequestCommentsData'
import ReposInvoker from '../repos/reposInvoker'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests comments.
 */
@injectable()
export default class PullRequestComments {
  private readonly _codeMetrics: CodeMetrics
  private readonly _inputs: Inputs
  private readonly _logger: Logger
  private readonly _reposInvoker: ReposInvoker
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param reposInvoker The repos invoker logic.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (codeMetrics: CodeMetrics, inputs: Inputs, logger: Logger, reposInvoker: ReposInvoker, taskLibWrapper: TaskLibWrapper) {
    this._codeMetrics = codeMetrics
    this._inputs = inputs
    this._logger = logger
    this._reposInvoker = reposInvoker
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
   * @returns A promise containing the data used for constructing the comment within the pull request.
   */
  public async getCommentData (): Promise<PullRequestCommentsData> {
    this._logger.logDebug('* PullRequestComments.getCommentData()')

    const filesNotRequiringReview: string[] = await this._codeMetrics.getFilesNotRequiringReview()
    const deletedFilesNotRequiringReview: string[] = await this._codeMetrics.getDeletedFilesNotRequiringReview()
    let result: PullRequestCommentsData = new PullRequestCommentsData(filesNotRequiringReview, deletedFilesNotRequiringReview)

    const comments: CommentData = await this._reposInvoker.getComments()

    // If the current comment thread is not applied to a specified file, check if it is the metrics comment thread.
    comments.pullRequestComments.forEach((comment: PullRequestCommentData): void => {
      result = this.getMetricsCommentData(result, comment)
    })

    // If the current comment thread is not applied to a specified file, check if it is the metrics comment thread.
    comments.fileComments.forEach((comment: FileCommentData): void => {
      result = this.getFilesRequiringCommentUpdates(result, comment)
    })

    return result
  }

  /**
   * Gets the comment to add to the comment thread.
   * @returns A promise containing the comment to add to the comment thread.
   */
  public async getMetricsComment (): Promise<string> {
    this._logger.logDebug('* PullRequestComments.getMetricsComment()')

    const metrics: CodeMetricsData = await this._codeMetrics.getMetrics()

    let result: string = `${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle')}${os.EOL}`
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

  private getMetricsCommentData (result: PullRequestCommentsData, comment: PullRequestCommentData): PullRequestCommentsData {
    this._logger.logDebug('* PullRequestComments.getMetricsCommentData()')

    if (!comment.content) {
      return result
    }

    if (!comment.content.startsWith(`${this._taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle')}${os.EOL}`)) {
      return result
    }

    result.metricsCommentThreadId = comment.id
    result.metricsCommentThreadStatus = comment.status
    result.metricsCommentContent = comment.content
    return result
  }

  private getFilesRequiringCommentUpdates (result: PullRequestCommentsData, comment: FileCommentData): PullRequestCommentsData {
    this._logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')

    if (comment.content !== this.noReviewRequiredComment) {
      return result
    }

    const fileIndex: number = result.filesNotRequiringReview.indexOf(comment.file)
    if (fileIndex !== -1) {
      result.filesNotRequiringReview.splice(fileIndex, 1)
      return result
    }

    const deletedFileIndex: number = result.deletedFilesNotRequiringReview.indexOf(comment.file)
    if (deletedFileIndex !== -1) {
      result.deletedFilesNotRequiringReview.splice(deletedFileIndex, 1)
      return result
    }

    result.commentThreadsRequiringDeletion.push(comment.id)
    return result
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
