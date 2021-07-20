// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { singleton } from 'tsyringe'
import IReposInvoker from './iReposInvoker'
import Logger from '../utilities/logger'
import PullRequestDetails from './pullRequestDetails'
import PullRequestMetadata from './pullRequestMetadata'

/**
 * A class for invoking GitHub Repos functionality.
 */
@singleton()
export default class GitHubReposInvoker implements IReposInvoker {
  private readonly _logger: Logger

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param logger The logger.
   */
  public constructor (logger: Logger) {
    this._logger = logger
  }

  get isFunctionalityComplete (): boolean {
    this._logger.logDebug('* GitHubReposInvoker.isFunctionalityComplete')

    return false
  }

  public get isAccessTokenAvailable (): boolean {
    this._logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async getCurrentIteration (): Promise<number> {
    this._logger.logDebug('* GitHubReposInvoker.getCurrentIteration()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* GitHubReposInvoker.getCommentThreads()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async setTitleAndDescription (_: string | null, __: string | null): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async createComment (_: string, __: number, ___: number): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.createComment()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async createCommentThread (_: string, __: CommentThreadStatus, ___?: string, ____?: boolean): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.createCommentThread()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async setCommentThreadStatus (_: number, __: CommentThreadStatus): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setCommentThreadStatus()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async addMetadata (_: PullRequestMetadata[]): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.addMetadata()')

    throw Error('GitHub functionality not yet implemented.')
  }
}
