// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { injectable } from 'tsyringe'
import CodeMetrics from './codeMetrics'
import CodeMetricsData from './codeMetricsData'
import GitInvoker from '../git/gitInvoker'
import Logger from '../utilities/logger'
import PullRequest from '../pullRequests/pullRequest'
import PullRequestComments from '../pullRequests/pullRequestComments'
import PullRequestCommentsData from '../pullRequests/pullRequestCommentsData'
import PullRequestDetails from '../repos/pullRequestDetails'
import PullRequestMetadata from '../repos/pullRequestMetadata'
import ReposInvoker from '../repos/reposInvoker'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for calculating and updating the code metrics within pull requests.
 */
@injectable()
export default class CodeMetricsCalculator {
  private readonly _codeMetrics: CodeMetrics
  private readonly _gitInvoker: GitInvoker
  private readonly _logger: Logger
  private readonly _pullRequest: PullRequest
  private readonly _pullRequestComments: PullRequestComments
  private readonly _reposInvoker: ReposInvoker
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `CodeMetricsCalculator` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param pullRequest The pull request modification logic.
   * @param pullRequestComments The pull request comments modification logic.
   * @param reposInvoker The repos invoker logic.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (codeMetrics: CodeMetrics, gitInvoker: GitInvoker, logger: Logger, pullRequest: PullRequest, pullRequestComments: PullRequestComments, reposInvoker: ReposInvoker, taskLibWrapper: TaskLibWrapper) {
    this._codeMetrics = codeMetrics
    this._gitInvoker = gitInvoker
    this._logger = logger
    this._pullRequest = pullRequest
    this._pullRequestComments = pullRequestComments
    this._reposInvoker = reposInvoker
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets a message if the task should be skipped.
   * @returns `null` if the task should continue, or a message to be displayed if the task should be skipped.
   */
  public get shouldSkip (): string | null {
    this._logger.logDebug('* CodeMetricsCalculator.shouldSkip')

    if (!this._pullRequest.isPullRequest) {
      return this._taskLibWrapper.loc('metrics.codeMetricsCalculator.noPullRequest')
    }

    const provider: boolean | string = this._pullRequest.isSupportedProvider
    if (provider !== true) {
      return this._taskLibWrapper.loc('metrics.codeMetricsCalculator.unsupportedProvider', provider)
    }

    return null
  }

  /**
   * Gets a message if the task should be stopped.
   * @returns A promise containing `null` if the task should continue, or a message to be displayed if the task should be stopped.
   */
  public async shouldStop (): Promise<string | null> {
    this._logger.logDebug('* CodeMetricsCalculator.shouldStop()')

    if (!this._reposInvoker.isAccessTokenAvailable) {
      return this._taskLibWrapper.loc('metrics.codeMetricsCalculator.noAccessToken')
    }

    if (!await this._gitInvoker.isGitEnlistment()) {
      return this._taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitEnlistment')
    }

    if (!await this._gitInvoker.isGitHistoryAvailable()) {
      return this._taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitHistory')
    }

    return null
  }

  /**
   * Updates the pull request details.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async updateDetails (): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.updateDetails()')

    const details: PullRequestDetails = await this._reposInvoker.getTitleAndDescription()
    const updatedTitle: string | null = await this._pullRequest.getUpdatedTitle(details.title)
    const updatedDescription: string | null = this._pullRequest.getUpdatedDescription(details.description)

    await this._reposInvoker.setTitleAndDescription(updatedTitle, updatedDescription)
  }

  /**
   * Updates the pull request comments.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async updateComments (): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.updateComments()')

    if (!this._reposInvoker.isFunctionalityComplete) {
      return
    }

    const promises: Promise<void>[] = []

    const currentIteration: number = await this._reposInvoker.getCurrentIteration()
    const commentData: PullRequestCommentsData = await this._pullRequestComments.getCommentData(currentIteration)
    if (!commentData.isMetricsCommentPresent) {
      promises.push(this.updateMetricsComment(commentData, currentIteration))
      promises.push(this.addMetadata())
    }

    commentData.filesNotRequiringReview.forEach((fileName: string): void => {
      promises.push(this.updateNoReviewRequiredComment(fileName, false))
    })

    commentData.deletedFilesNotRequiringReview.forEach((fileName: string): void => {
      promises.push(this.updateNoReviewRequiredComment(fileName, true))
    })

    await Promise.all(promises)
  }

  private async updateMetricsComment (commentData: PullRequestCommentsData, currentIteration: number): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.updateMetricsComment()')

    const comment: string = await this._pullRequestComments.getMetricsComment(currentIteration)
    const status: CommentThreadStatus = await this._pullRequestComments.getMetricsCommentStatus()
    if (commentData.metricsCommentThreadId !== null) {
      await this._reposInvoker.createComment(comment, commentData.metricsCommentThreadId, commentData.metricsCommentId!)
      await this._reposInvoker.setCommentThreadStatus(commentData.metricsCommentThreadId, status)
    } else {
      await this._reposInvoker.createCommentThread(comment, status)
    }
  }

  private async addMetadata (): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.addMetadata()')

    const metrics: CodeMetricsData = await this._codeMetrics.getMetrics()
    const metadata: PullRequestMetadata[] = [
      {
        key: 'Size',
        value: await this._codeMetrics.getSize()
      },
      {
        key: 'ProductCode',
        value: metrics.productCode
      },
      {
        key: 'TestCode',
        value: metrics.testCode
      },
      {
        key: 'Subtotal',
        value: metrics.subtotal
      },
      {
        key: 'IgnoredCode',
        value: metrics.ignoredCode
      },
      {
        key: 'Total',
        value: metrics.total
      }
    ]

    const isSufficientlyTested: boolean | null = await this._codeMetrics.isSufficientlyTested()
    if (isSufficientlyTested !== null) {
      metadata.push({
        key: 'TestCoverage',
        value: isSufficientlyTested
      })
    }

    await this._reposInvoker.addMetadata(metadata)
  }

  private async updateNoReviewRequiredComment (fileName: string, isFileDeleted: boolean): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')

    const noReviewRequiredComment: string = this._pullRequestComments.noReviewRequiredComment
    await this._reposInvoker.createCommentThread(noReviewRequiredComment, CommentThreadStatus.Closed, fileName, isFileDeleted)
  }
}
