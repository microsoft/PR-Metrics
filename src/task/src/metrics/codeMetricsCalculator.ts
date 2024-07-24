/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import GitInvoker from '../git/gitInvoker'
import Logger from '../utilities/logger'
import PullRequest from '../pullRequests/pullRequest'
import PullRequestComments from '../pullRequests/pullRequestComments'
import PullRequestCommentsData from '../pullRequests/pullRequestCommentsData'
import PullRequestDetails from '../repos/interfaces/pullRequestDetails'
import ReposInvoker from '../repos/reposInvoker'
import RunnerInvoker from '../runners/runnerInvoker'
import { injectable } from 'tsyringe'

/**
 * A class for calculating and updating the code metrics within pull requests.
 */
@injectable()
export default class CodeMetricsCalculator {
  private readonly gitInvoker: GitInvoker
  private readonly logger: Logger
  private readonly pullRequest: PullRequest
  private readonly pullRequestComments: PullRequestComments
  private readonly reposInvoker: ReposInvoker
  private readonly runnerInvoker: RunnerInvoker

  /**
   * Initializes a new instance of the `CodeMetricsCalculator` class.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param pullRequest The pull request modification logic.
   * @param pullRequestComments The pull request comments modification logic.
   * @param reposInvoker The repos invoker logic.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (gitInvoker: GitInvoker, logger: Logger, pullRequest: PullRequest, pullRequestComments: PullRequestComments, reposInvoker: ReposInvoker, runnerInvoker: RunnerInvoker) {
    this.gitInvoker = gitInvoker
    this.logger = logger
    this.pullRequest = pullRequest
    this.pullRequestComments = pullRequestComments
    this.reposInvoker = reposInvoker
    this.runnerInvoker = runnerInvoker
  }

  /**
   * Gets a message if the task should be skipped.
   * @returns `null` if the task should continue, or a message to be displayed if the task should be skipped.
   */
  public get shouldSkip (): string | null {
    this.logger.logDebug('* CodeMetricsCalculator.shouldSkip')

    if (!this.pullRequest.isPullRequest) {
      return this.runnerInvoker.loc('metrics.codeMetricsCalculator.noPullRequest')
    }

    const provider: boolean | string = this.pullRequest.isSupportedProvider
    if (provider !== true) {
      return this.runnerInvoker.loc('metrics.codeMetricsCalculator.unsupportedProvider', provider.toString())
    }

    return null
  }

  /**
   * Gets a message if the task should be stopped.
   * @returns A promise containing `null` if the task should continue, or a message to be displayed if the task should be stopped.
   */
  public async shouldStop (): Promise<string | null> {
    this.logger.logDebug('* CodeMetricsCalculator.shouldStop()')

    const accessTokenAvailable: string | null = await this.reposInvoker.isAccessTokenAvailable()
    if (accessTokenAvailable !== null) {
      return accessTokenAvailable
    }

    if (!await this.gitInvoker.isGitRepo()) {
      return RunnerInvoker.isGitHub
        ? this.runnerInvoker.loc('metrics.codeMetricsCalculator.noGitRepoGitHub')
        : this.runnerInvoker.loc('metrics.codeMetricsCalculator.noGitRepoAzureDevOps')
    }

    if (!this.gitInvoker.isPullRequestIdAvailable()) {
      return RunnerInvoker.isGitHub
        ? this.runnerInvoker.loc('metrics.codeMetricsCalculator.noPullRequestIdGitHub')
        : this.runnerInvoker.loc('metrics.codeMetricsCalculator.noPullRequestIdAzureDevOps')
    }

    if (!await this.gitInvoker.isGitHistoryAvailable()) {
      return RunnerInvoker.isGitHub
        ? this.runnerInvoker.loc('metrics.codeMetricsCalculator.noGitHistoryGitHub')
        : this.runnerInvoker.loc('metrics.codeMetricsCalculator.noGitHistoryAzureDevOps')
    }

    return null
  }

  /**
   * Updates the pull request details.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async updateDetails (): Promise<void> {
    this.logger.logDebug('* CodeMetricsCalculator.updateDetails()')

    const details: PullRequestDetails = await this.reposInvoker.getTitleAndDescription()
    const updatedTitle: string | null = await this.pullRequest.getUpdatedTitle(details.title)
    const updatedDescription: string | null = this.pullRequest.getUpdatedDescription(details.description)

    await this.reposInvoker.setTitleAndDescription(updatedTitle, updatedDescription)
  }

  /**
   * Updates the pull request comments.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async updateComments (): Promise<void> {
    this.logger.logDebug('* CodeMetricsCalculator.updateComments()')

    const promises: Promise<void>[] = []

    const commentData: PullRequestCommentsData = await this.pullRequestComments.getCommentData()
    promises.push(this.updateMetricsComment(commentData))

    for (const commentThreadId of commentData.commentThreadsRequiringDeletion) {
      promises.push(this.reposInvoker.deleteCommentThread(commentThreadId))
    }

    await Promise.all(promises)

    /* eslint-disable no-await-in-loop --  Comment creation can cause problems when called in parallel on GitHub. Therefore, there must be an await after each call to these APIs before continuing. */
    for (const fileName of commentData.filesNotRequiringReview) {
      await this.updateNoReviewRequiredComment(fileName, false)
    }

    for (const fileName of commentData.deletedFilesNotRequiringReview) {
      await this.updateNoReviewRequiredComment(fileName, true)
    }
    /* eslint-enable no-await-in-loop */
  }

  private async updateMetricsComment (commentData: PullRequestCommentsData): Promise<void> {
    this.logger.logDebug('* CodeMetricsCalculator.updateMetricsComment()')

    const content: string = await this.pullRequestComments.getMetricsComment()
    const status: CommentThreadStatus = await this.pullRequestComments.getMetricsCommentStatus()
    if (commentData.metricsCommentThreadId === null) {
      await this.reposInvoker.createComment(content, status)
    } else {
      await this.reposInvoker.updateComment(
        commentData.metricsCommentThreadId,
        commentData.metricsCommentContent === content ? null : content,
        commentData.metricsCommentThreadStatus === status ? null : status)
    }
  }

  private async updateNoReviewRequiredComment (fileName: string, isFileDeleted: boolean): Promise<void> {
    this.logger.logDebug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')

    const noReviewRequiredComment: string = this.pullRequestComments.noReviewRequiredComment
    await this.reposInvoker.createComment(noReviewRequiredComment, CommentThreadStatus.Closed, fileName, isFileDeleted)
  }
}
