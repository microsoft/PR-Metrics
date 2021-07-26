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
import PullRequestMetadata from './pullRequestMetadata'

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

  public async getCurrentIteration (): Promise<number> {
    this._logger.logDebug('* ReposInvoker.getCurrentIteration()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.getCurrentIteration()
  }

  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* ReposInvoker.getCommentThreads()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.getCommentThreads()
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* ReposInvoker.setTitleAndDescription()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.setTitleAndDescription(title, description)
  }

  public async createComment (commentContent: string, commentThreadId: number, parentCommentId: number): Promise<void> {
    this._logger.logDebug('* ReposInvoker.createComment()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.createComment(commentContent, commentThreadId, parentCommentId)
  }

  public async createCommentThread (commentContent: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void> {
    this._logger.logDebug('* ReposInvoker.createCommentThread()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.createCommentThread(commentContent, status, fileName, isFileDeleted)
  }

  public async setCommentThreadStatus (commentThreadId: number, status: CommentThreadStatus): Promise<void> {
    this._logger.logDebug('* ReposInvoker.setCommentThreadStatus()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.setCommentThreadStatus(commentThreadId, status)
  }

  public async addMetadata (metadata: PullRequestMetadata[]): Promise<void> {
    this._logger.logDebug('* ReposInvoker.addMetadata()')

    const reposInvoker: IReposInvoker = this.getReposInvoker()
    return reposInvoker.addMetadata(metadata)
  }

  private getReposInvoker (): IReposInvoker {
    this._logger.logDebug('* ReposInvoker.getReposInvoker()')

    if (this._reposInvoker) {
      return this._reposInvoker
    }

    const variable: string = Validator.validate(process.env.BUILD_REPOSITORY_PROVIDER, 'BUILD_REPOSITORY_PROVIDER', 'ReposInvoker.getReposInvoker()')
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
