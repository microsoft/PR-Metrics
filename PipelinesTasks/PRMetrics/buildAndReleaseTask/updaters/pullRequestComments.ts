// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { validator } from '../utilities/validator'
import * as os from 'os'
import AzureReposInvoker from '../invokers/azureReposInvoker'
import CodeMetrics from './codeMetrics'
import CommentData from './commentData'
import Parameters from './parameters'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests comments.
 */
export default class PullRequestComments {
  private readonly _azureReposInvoker: AzureReposInvoker;
  private readonly _codeMetrics: CodeMetrics;
  private readonly _parameters: Parameters;
  private readonly _taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `PullRequestComments` class.
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
  public async getCommentData (currentIteration: number): Promise<CommentData> {
    this._taskLibWrapper.debug('* PullRequestComments.getCommentData()')

    const result: CommentData = {
      isPresent: false,
      threadId: 0,
      commentId: 0,
      ignoredFilesWithLinesAdded: this._codeMetrics.ignoredFilesWithLinesAdded,
      ignoredFilesWithoutLinesAdded: this._codeMetrics.ignoredFilesWithoutLinesAdded
    }

    const commentThreads: GitPullRequestCommentThread[] = await this._azureReposInvoker.getCommentThreads()
    for (let i: number = 0; i < commentThreads.length; i++) {
      const commentThread: GitPullRequestCommentThread = commentThreads[i]!
      if (!commentThread.pullRequestThreadContext) {
        this.getMetricsCommentData(result, commentThread, currentIteration)
      } else {
        const fileName: string = commentThread.pullRequestThreadContext.trackingCriteria!.origFilePath!.substring(1)

        if (this._codeMetrics.ignoredFilesWithLinesAdded.includes(fileName)) {
          this.getIgnoredCommentData(result.ignoredFilesWithLinesAdded, fileName, commentThread)
        } else if (this._codeMetrics.ignoredFilesWithoutLinesAdded.includes(fileName)) {
          this.getIgnoredCommentData(result.ignoredFilesWithoutLinesAdded, fileName, commentThread)
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

  private getMetricsCommentData (result: CommentData, commentThread: GitPullRequestCommentThread, currentIteration: number): void {
    this._taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')

    validator.validateField(commentThread.comments, 'commentThread.comments')

    for (let i: number = 0; i < commentThread.comments!.length; i++) {
      const comment: Comment = commentThread.comments![i]!

      validator.validateField(comment.author, 'comment.author')
      validator.validateField(comment.author!.displayName, 'comment.author.displayName')

      if (comment.author!.displayName!.startsWith('Project Collection Build Service (')) {
        validator.validateField(comment.content, 'comment.content')

        const commentHeader: RegExp = new RegExp(`^${this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', currentIteration.toLocaleString())}`)
        if (!comment.content!.match(commentHeader)) {
          validator.validateField(commentThread.id, 'commentThread.id')
          validator.validateField(comment.id, 'comment.id')

          result.threadId = commentThread!.id!
          result.commentId = comment.id!
          const commentHeader: string = this._taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', currentIteration.toLocaleString())
          if (comment.content!.startsWith(commentHeader)) {
            result.isPresent = true
          }
        }
      }
    }
  }

  private getIgnoredCommentData (ignoredFiles: string[], fileName: string, commentThread: GitPullRequestCommentThread): void {
    this._taskLibWrapper.debug('* PullRequestComments.getIgnoredCommentData()')

    validator.validateField(commentThread.comments, 'commentThread.comments')
    validator.validateField(commentThread.comments![0], 'commentThread.comments[0]')

    const comment: Comment = commentThread.comments![0]!
    validator.validateField(comment.author, 'comment.author')
    validator.validateField(comment.author!.displayName, 'comment.author.displayName')
    validator.validateField(comment.content, 'comment.content')

    if (comment.author!.displayName!.startsWith('Project Collection Build Service (')) {
      if (comment.content! === this.ignoredComment) {
        const index: number = ignoredFiles.indexOf(fileName)
        if (index === -1) {
          throw new Error(`Element ${fileName} not in array.`)
        }

        ignoredFiles.splice(index, 1)
      }
    }
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
