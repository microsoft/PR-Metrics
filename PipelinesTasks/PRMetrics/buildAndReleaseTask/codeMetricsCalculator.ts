// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import CommentData from './updaters/commentData'
import PullRequest from './updaters/pullRequest'
import PullRequestComments from './updaters/pullRequestComments'
import TaskLibWrapper from './wrappers/taskLibWrapper'

/**
 * A class for calculating and updating the code metrics within pull requests.
 */
export default class CodeMetricsCalculator {
  private _pullRequest: PullRequest;
  private _pullRequestComments: PullRequestComments;
  private _taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `CodeMetricsCalculator` class.
   * @param pullRequest The pull request modification logic.
   * @param pullRequestComments The pull request comments modification logic.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (pullRequest: PullRequest, pullRequestComments: PullRequestComments, taskLibWrapper: TaskLibWrapper) {
    this._pullRequest = pullRequest
    this._pullRequestComments = pullRequestComments
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public get isPullRequest (): boolean {
    this._taskLibWrapper.debug('* CodeMetricsCalculator.isPullRequest')

    return this._pullRequest.isPullRequest
  }

  /**
   * Determines whether the task can obtain the OAuth access token.
   * @returns A value indicating whether the task can obtain the OAuth access token.
   */
  public get isAccessTokenAvailable (): boolean {
    this._taskLibWrapper.debug('* CodeMetricsCalculator.isAccessTokenAvailable')

    // TODO: Update once dependencies are added
    return true
  }

  /**
   * Updates the pull request details.
   */
  public updateDetails (): void {
    this._taskLibWrapper.debug('* CodeMetricsCalculator.updateDetails()')

    // TODO: Update once dependencies are added
    // $details = $this.AzureReposInvoker.GetDetails()
    const description: string | null = this._pullRequest.getUpdatedDescription('TODO')
    const title: string | null = this._pullRequest.getUpdatedTitle('TODO')
    // $this.AzureReposInvoker.SetDetails($updatedDescription, $updatedTitle)

    this._taskLibWrapper.debug(description!)
    this._taskLibWrapper.debug(title!)
  }

  /**
   * Updates the pull request comments.
   */
  public async updateComments (): Promise<void> {
    this._taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')

    // TODO: Update once dependencies are added
    // $commentThreads = $this.AzureReposInvoker.GetCommentThreads()
    // $iterations = $this.AzureReposInvoker.GetIterations()
    const commentData: CommentData = await this._pullRequestComments.getCommentData(1)

    this._taskLibWrapper.debug((commentData.commentId ?? 0).toLocaleString())
  }
}
