// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests comments.
 */
class PullRequestComments {
  private taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this.taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the data used for constructing the comment within the pull request.
   * @returns The data used for constructing the comment within the pull request.
   */
  public getCommentData (): string {
    this.taskLibWrapper.debug('* PullRequestComments.getCommentData()')

    return 'TODO' // TODO: Update once dependencies are added
  }

  /**
   * Gets the ID of the comment thread used by this task.
   * @returns The ID of the comment thread used by this task or `null` if no comment thread exists.
   */
  public getCommentThreadId (): number | null {
    this.taskLibWrapper.debug('* PullRequestComments.getCommentThreadId()')

    return 1 // TODO: Update once dependencies are added
  }

  /**
   * Gets the comment to add to the comment thread.
   * @returns The comment to add to the comment thread.
   */
  public getMetricsComment (): string {
    this.taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')

    return 'TODO' // TODO: Update once dependencies are added
  }

  /**
   * Gets the status to which to update the comment thread.
   * @returns The status to which to update the comment thread.
   */
  public getMetricsCommentStatus (): string {
    this.taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')

    return 'TODO' // TODO: Update once dependencies are added
  }

  /**
   * Gets the comment to add to ignored files within the pull request.
   * @returns The comment to add to ignored files within the pull request.
   */
  public getIgnoredComment (): string {
    this.taskLibWrapper.debug('* PullRequestComments.getIgnoredComment()')

    return this.taskLibWrapper.loc('updaters.pullRequestComments.fileIgnoredComment')
  }
}

export default PullRequestComments
