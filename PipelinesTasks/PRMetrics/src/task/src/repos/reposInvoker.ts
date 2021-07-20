// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { singleton } from 'tsyringe'
import AzureReposInvoker from './azureReposInvoker'
import GitHubReposInvoker from './gitHubReposInvoker'
import IReposInvoker from './iReposInvoker'
import Logger from '../utilities/logger'
import PullRequestDetails from './pullRequestDetails'
import PullRequestMetadata from './pullRequestMetadata'
import { Validator } from '../utilities/validator'

/**
 * A class for invoking repository functionality with any underlying repository store.
 */
@singleton()
export default class ReposInvoker implements IReposInvoker {
  private readonly _azureReposInvoker: AzureReposInvoker
  private readonly _gitHubReposInvoker: GitHubReposInvoker
  private readonly _logger: Logger

  private _isAzureRepos: boolean = true
  private _isInitialized: boolean = false

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

  public get isFunctionalityComplete (): boolean {
    this._logger.logDebug('* ReposInvoker.isFunctionalityComplete')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.isFunctionalityComplete
    } else {
      return this._gitHubReposInvoker.isFunctionalityComplete
    }
  }

  public get isAccessTokenAvailable (): boolean {
    this._logger.logDebug('* ReposInvoker.isAccessTokenAvailable')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.isAccessTokenAvailable
    } else {
      return this._gitHubReposInvoker.isAccessTokenAvailable
    }
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* ReposInvoker.getTitleAndDescription()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.getTitleAndDescription()
    } else {
      return this._gitHubReposInvoker.getTitleAndDescription()
    }
  }

  public async getCurrentIteration (): Promise<number> {
    this._logger.logDebug('* ReposInvoker.getCurrentIteration()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.getCurrentIteration()
    } else {
      return this._gitHubReposInvoker.getCurrentIteration()
    }
  }

  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* ReposInvoker.getCommentThreads()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.getCommentThreads()
    } else {
      return this._gitHubReposInvoker.getCommentThreads()
    }
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* ReposInvoker.setTitleAndDescription()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.setTitleAndDescription(title, description)
    } else {
      return this._gitHubReposInvoker.setTitleAndDescription(title, description)
    }
  }

  public async createComment (commentContent: string, commentThreadId: number, parentCommentId: number): Promise<void> {
    this._logger.logDebug('* ReposInvoker.createComment()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.createComment(commentContent, commentThreadId, parentCommentId)
    } else {
      return this._gitHubReposInvoker.createComment(commentContent, commentThreadId, parentCommentId)
    }
  }

  public async createCommentThread (commentContent: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void> {
    this._logger.logDebug('* ReposInvoker.createCommentThread()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.createCommentThread(commentContent, status, fileName, isFileDeleted)
    } else {
      return this._gitHubReposInvoker.createCommentThread(commentContent, status, fileName, isFileDeleted)
    }
  }

  public async setCommentThreadStatus (commentThreadId: number, status: CommentThreadStatus): Promise<void> {
    this._logger.logDebug('* ReposInvoker.setCommentThreadStatus()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.setCommentThreadStatus(commentThreadId, status)
    } else {
      return this._gitHubReposInvoker.setCommentThreadStatus(commentThreadId, status)
    }
  }

  public async addMetadata (metadata: PullRequestMetadata[]): Promise<void> {
    this._logger.logDebug('* ReposInvoker.addMetadata()')

    this.initialize()
    if (this._isAzureRepos) {
      return this._azureReposInvoker.addMetadata(metadata)
    } else {
      return this._gitHubReposInvoker.addMetadata(metadata)
    }
  }

  private initialize (): void {
    this._logger.logDebug('* ReposInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    this._isInitialized = true

    const variable: string = Validator.validate(process.env.BUILD_REPOSITORY_PROVIDER, 'BUILD_REPOSITORY_PROVIDER', 'ReposInvoker.initialize')
    switch (variable) {
      case 'TfsGit':
        this._isAzureRepos = true
        break
      case 'GitHub':
        this._isAzureRepos = false
        break
      default:
        throw RangeError(`BUILD_REPOSITORY_PROVIDER '${variable}' is unsupported.`)
    }
  }
}
