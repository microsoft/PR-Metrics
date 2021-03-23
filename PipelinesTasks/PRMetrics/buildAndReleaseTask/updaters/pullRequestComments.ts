// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as os from 'os'
import Metrics from './metrics'
import TaskLibWrapper from '../wrappers/taskLibWrapper'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'

/**
 * A class for managing pull requests comments.
 */
class PullRequestComments {
  private readonly _taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the data used for constructing the comment within the pull request.
   * @returns The data used for constructing the comment within the pull request.
   */
  public getCommentData (): string {
    this._taskLibWrapper.debug('* PullRequestComments.getCommentData()')

    return 'TODO' // TODO: Update once dependencies are added
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
   * @param metrics The code metrics with which to populate the comment.
   * @returns The comment to add to the comment thread.
   */
  public getMetricsComment (metrics: Metrics): string {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')

    // TODO: Update once dependencies are added
    let result: string = `${this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', '1')}${os.EOL}`
    result += this.addCommentSizeStatus(1000, true)
    result += this.addCommentTestStatus(true)

    result += `||${this._taskLibWrapper.loc('updaters.pullRequestComments.tableLines')}${os.EOL}`
    result += `-|-:${os.EOL}`
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableProductCode'), metrics.productCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableTestCode'), metrics.testCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableSubtotal'), metrics.subtotal, true)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableIgnoredCode'), metrics.ignoredCode, false)
    result += this.addCommentMetrics(this._taskLibWrapper.loc('updaters.pullRequestComments.tableTotal'), metrics.total, true)

    result += os.EOL
    result += this._taskLibWrapper.loc('updaters.pullRequestComments.commentFooter')

    return result
  }

  /**
   * Gets the status to which to update the comment thread.
   * @param isSmall A value indicating whether the pull request is small or extra small.
   * @param hasSufficientTestCode A value indicating whether the pull request has sufficient test code.
   * @returns The status to which to update the comment thread.
   */
  public getMetricsCommentStatus (isSmall: boolean, hasSufficientTestCode: boolean | null): CommentThreadStatus {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')

    if (isSmall && hasSufficientTestCode) {
      return CommentThreadStatus.Closed
    }

    return CommentThreadStatus.Active
  }

  /**
   * Gets the comment to add to ignored files within the pull request.
   * @returns The comment to add to ignored files within the pull request.
   */
  public getIgnoredComment (): string {
    this._taskLibWrapper.debug('* PullRequestComments.getIgnoredComment()')

    return this._taskLibWrapper.loc('updaters.pullRequestComments.fileIgnoredComment')
  }

  private addCommentSizeStatus (baseSize: number, isSmall: boolean): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')

    let result: string = ''
    if (isSmall) {
      result += this._taskLibWrapper.loc('updaters.pullRequestComments.smallPullRequestComment')
    } else {
      result += this._taskLibWrapper.loc('updaters.pullRequestComments.largePullRequestComment', baseSize.toLocaleString())
    }

    result += os.EOL
    return result
  }

  private addCommentTestStatus (hasSufficientTestCode: boolean | null): string {
    this._taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')

    let result: string = ''
    if (hasSufficientTestCode !== null) {
      if (hasSufficientTestCode) {
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

export default PullRequestComments
