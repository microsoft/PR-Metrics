// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import AzureReposInvoker from './azureReposInvoker'
import GitHubReposInvoker from './gitHubReposInvoker'
import IReposInvoker from './iReposInvoker'
import Logger from '../utilities/logger'
import PullRequestDetails from './pullRequestDetails'

/**
 * A class for invoking repository functionality with any underlying repository store.
 */
@singleton()
export default class ReposInvoker implements IReposInvoker {
  private readonly _azureReposInvoker: AzureReposInvoker
  private readonly _gitHubReposInvoker: GitHubReposInvoker
  private readonly _logger: Logger

  private _reposInvoker: IReposInvoker | undefined

  /**
   * Initializes a new instance of the `ReposInvoker` class.
   * @param azureReposInvoker The wrapper around the Azure Repos functionality.
   * @param gitHubReposInvoker The wrapper around the GitHub Repos functionality.
   * @param logger The logger.
   */
  public constructor (azureReposInvoker: AzureReposInvoker, gitHubReposInvoker: GitHubReposInvoker, logger: Logger) {
    this._azureReposInvoker = azureReposInvoker
    this._gitHubReposInvoker = gitHubReposInvoker
    this._logger = logger
  }

  public get isCommentsFunctionalityAvailable (): boolean {
    this._logger.logDebug('* ReposInvoker.isCommentsFunctionalityAvailable')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.isCommentsFunctionalityAvailable
  }

  public get isAccessTokenAvailable (): boolean {
    this._logger.logDebug('* ReposInvoker.isAccessTokenAvailable')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.isAccessTokenAvailable
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* ReposInvoker.getTitleAndDescription()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.getTitleAndDescription()
  }

  public async getComments (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* ReposInvoker.getComments()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.getComments()
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* ReposInvoker.setTitleAndDescription()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.setTitleAndDescription(title, description)
  }

  public async createComment (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void> {
    this._logger.logDebug('* ReposInvoker.createComment()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.createComment(content, status, fileName, isFileDeleted)
  }

  public async updateComment (content: string | null, status: CommentThreadStatus | null, commentThreadId: number, commentId: number): Promise<void> {
    this._logger.logDebug('* ReposInvoker.updateComment()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.updateComment(content, status, commentThreadId, commentId)
  }

  private getReposInvoker (): IReposInvoker {
    this._logger.logDebug('* ReposInvoker.getReposInvoker()')

    if (this._reposInvoker) {
      return this._reposInvoker
    }

    const variable: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'ReposInvoker.getReposInvoker()')
    switch (variable) {
      case 'TfsGit':
        this._reposInvoker = this._azureReposInvoker
        break
      case 'GitHub':
        this._reposInvoker = this._gitHubReposInvoker
        break
      default:
        throw RangeError(`BUILD_REPOSITORY_PROVIDER '${variable}' is unsupported.`)
    }

    return this._reposInvoker
  }
}
