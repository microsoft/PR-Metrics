// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { injectable } from 'tsyringe'
import GitInvoker from '../git/gitInvoker'
import Logger from '../utilities/logger'
import PullRequest from '../pullRequests/pullRequest'
import PullRequestComments from '../pullRequests/pullRequestComments'
import PullRequestCommentsData from '../pullRequests/pullRequestCommentsData'
import PullRequestDetails from '../repos/pullRequestDetails'
import ReposInvoker from '../repos/reposInvoker'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for calculating and updating the code metrics within pull requests.
 */
@injectable()
export default class CodeMetricsCalculator {
  private readonly _gitInvoker: GitInvoker
  private readonly _logger: Logger
  private readonly _pullRequest: PullRequest
  private readonly _pullRequestComments: PullRequestComments
  private readonly _reposInvoker: ReposInvoker
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `CodeMetricsCalculator` class.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param pullRequest The pull request modification logic.
   * @param pullRequestComments The pull request comments modification logic.
   * @param reposInvoker The repos invoker logic.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (gitInvoker: GitInvoker, logger: Logger, pullRequest: PullRequest, pullRequestComments: PullRequestComments, reposInvoker: ReposInvoker, taskLibWrapper: TaskLibWrapper) {
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

    const accessTokenAvailable: string | null = this._reposInvoker.isAccessTokenAvailable
    if (accessTokenAvailable !== null) {
      return accessTokenAvailable
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

    if (!this._reposInvoker.isCommentsFunctionalityAvailable) {
      this._logger.logDebug('Skipping comments functionality as it is unavailable.')
      return
    }

    const promises: Promise<void>[] = []

    const commentData: PullRequestCommentsData = await this._pullRequestComments.getCommentData()
    promises.push(this.updateMetricsComment(commentData))

    commentData.filesNotRequiringReview.forEach((fileName: string): void => {
      promises.push(this.updateNoReviewRequiredComment(fileName, false))
    })

    commentData.deletedFilesNotRequiringReview.forEach((fileName: string): void => {
      promises.push(this.updateNoReviewRequiredComment(fileName, true))
    })

    commentData.commentThreadsRequiringDeletion.forEach((commentThreadId: number): void => {
      promises.push(this._reposInvoker.deleteCommentThread(commentThreadId))
    })

    await Promise.all(promises)
  }

  private async updateMetricsComment (commentData: PullRequestCommentsData): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.updateMetricsComment()')

    const content: string = await this._pullRequestComments.getMetricsComment()
    const status: CommentThreadStatus = await this._pullRequestComments.getMetricsCommentStatus()
    if (commentData.metricsCommentThreadId === null) {
      await this._reposInvoker.createComment(content, status)
    } else {
      await this._reposInvoker.updateComment(
        commentData.metricsCommentContent !== content ? content : null,
        commentData.metricsCommentThreadStatus !== status ? status : null,
        commentData.metricsCommentThreadId)
    }
  }

  private async updateNoReviewRequiredComment (fileName: string, isFileDeleted: boolean): Promise<void> {
    this._logger.logDebug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')

    const noReviewRequiredComment: string = this._pullRequestComments.noReviewRequiredComment
    await this._reposInvoker.createComment(noReviewRequiredComment, CommentThreadStatus.Closed, fileName, isFileDeleted)
  }
}
