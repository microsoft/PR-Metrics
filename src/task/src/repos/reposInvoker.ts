/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from '../utilities/validator'
import AzureReposInvoker from './azureReposInvoker'
import CommentData from './interfaces/commentData'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import GenericReposInvoker from './genericReposInvoker'
import GitHubReposInvoker from './gitHubReposInvoker'
import Logger from '../utilities/logger'
import PullRequestDetails from './interfaces/pullRequestDetails'
import RunnerInvoker from '../runners/runnerInvoker'
import { singleton } from 'tsyringe'

/**
 * A class for invoking repository functionality with any underlying repository store.
 */
@singleton()
export default class ReposInvoker implements GenericReposInvoker {
  private readonly azureReposInvoker: AzureReposInvoker
  private readonly gitHubReposInvoker: GitHubReposInvoker
  private readonly logger: Logger

  private reposInvoker: GenericReposInvoker | undefined

  /**
   * Initializes a new instance of the `ReposInvoker` class.
   * @param azureReposInvoker The wrapper around the Azure Repos functionality.
   * @param gitHubReposInvoker The wrapper around the GitHub Repos functionality.
   * @param logger The logger.
   */
  public constructor (azureReposInvoker: AzureReposInvoker, gitHubReposInvoker: GitHubReposInvoker, logger: Logger) {
    this.azureReposInvoker = azureReposInvoker
    this.gitHubReposInvoker = gitHubReposInvoker
    this.logger = logger
  }

  public async isAccessTokenAvailable (): Promise<string | null> {
    this.logger.logDebug('* ReposInvoker.isAccessTokenAvailable()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.isAccessTokenAvailable()
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this.logger.logDebug('* ReposInvoker.getTitleAndDescription()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.getTitleAndDescription()
  }

  public async getComments (): Promise<CommentData> {
    this.logger.logDebug('* ReposInvoker.getComments()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.getComments()
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this.logger.logDebug('* ReposInvoker.setTitleAndDescription()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.setTitleAndDescription(title, description)
  }

  public async createComment (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void> {
    this.logger.logDebug('* ReposInvoker.createComment()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.createComment(content, status, fileName, isFileDeleted)
  }

  public async updateComment (commentThreadId: number, content: string | null, status: CommentThreadStatus | null): Promise<void> {
    this.logger.logDebug('* ReposInvoker.updateComment()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.updateComment(commentThreadId, content, status)
  }

  public async deleteCommentThread (commentThreadId: number): Promise<void> {
    this.logger.logDebug('* ReposInvoker.deleteCommentThread()')

    const reposInvoker: GenericReposInvoker = this.getReposInvoker()
    return reposInvoker.deleteCommentThread(commentThreadId)
  }

  private getReposInvoker (): GenericReposInvoker {
    this.logger.logDebug('* ReposInvoker.getReposInvoker()')

    if (this.reposInvoker !== undefined) {
      return this.reposInvoker
    }

    // If a GitHub runner is in use, only GitHub repos are supported.
    if (RunnerInvoker.isGitHub) {
      this.reposInvoker = this.gitHubReposInvoker
      return this.reposInvoker
    }

    const repoProvider: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'ReposInvoker.getReposInvoker()')
    switch (repoProvider) {
      case 'TfsGit':
        this.reposInvoker = this.azureReposInvoker
        break
      case 'GitHub':
      case 'GitHubEnterprise':
        this.reposInvoker = this.gitHubReposInvoker
        break
      default:
        throw new RangeError(`BUILD_REPOSITORY_PROVIDER '${repoProvider}' is unsupported.`)
    }

    return this.reposInvoker
  }
}
