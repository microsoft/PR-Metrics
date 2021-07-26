// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { RequestParameters } from '@octokit/types'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import IReposInvoker from './iReposInvoker'
import Logger from '../utilities/logger'
import OctokitWrapper from '../wrappers/octokitWrapper'
import PullRequestDetails from './pullRequestDetails'
import PullRequestMetadata from './pullRequestMetadata'
import TaskLibWrapper from '../wrappers/taskLibWrapper'
import UpdatePullRequest from '../wrappers/octokitInterfaces/updatePullRequest'
import UpdatePullResponse from '../wrappers/octokitInterfaces/updatePullResponse'

/**
 * A class for invoking GitHub Repos functionality.
 */
@singleton()
export default class GitHubReposInvoker implements IReposInvoker {
  private readonly _logger: Logger
  private readonly _octokitWrapper: OctokitWrapper
  private readonly _taskLibWrapper: TaskLibWrapper

  private _isInitialized: boolean = false
  private _owner: string | undefined
  private _repo: string | undefined
  private _pullRequestId: number | undefined

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param logger The logger.
   * @param octokitWrapper The wrapper around the Octokit library.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (logger: Logger, octokitWrapper: OctokitWrapper, taskLibWrapper: TaskLibWrapper) {
    this._logger = logger
    this._octokitWrapper = octokitWrapper
    this._taskLibWrapper = taskLibWrapper
  }

  public get isCommentsFunctionalityAvailable (): boolean {
    this._logger.logDebug('* GitHubReposInvoker.isCommentsFunctionalityAvailable')

    return false
  }

  public get isAccessTokenAvailable (): boolean {
    this._logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')

    return true
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')

    this.initialize()
    const result: GetPullResponse = await this._octokitWrapper.getPull({
      owner: this._owner!,
      repo: this._repo!,
      pull_number: this._pullRequestId!
    })
    this._logger.logDebug(JSON.stringify(result))

    return {
      title: result.data.title,
      description: result.data.body ?? undefined
    }
  }

  public async getCurrentIteration (): Promise<number> {
    this._logger.logDebug('* GitHubReposInvoker.getCurrentIteration()')

    throw Error('GitHubReposInvoker.getCurrentIteration() not yet implemented.')
  }

  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* GitHubReposInvoker.getCommentThreads()')

    throw Error('GitHubReposInvoker.getCommentThreads() not yet implemented.')
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')

    this.initialize()
    const payload: RequestParameters & UpdatePullRequest = {
      owner: this._owner!,
      repo: this._repo!,
      pull_number: this._pullRequestId!
    }

    if (title !== null) {
      payload.title = title
    }

    if (description !== null) {
      payload.body = description
    }

    const result: UpdatePullResponse = await this._octokitWrapper.updatePull(payload)
    this._logger.logDebug(JSON.stringify(result))
  }

  public async createComment (_: string, __: number, ___: number): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.createComment()')

    throw Error('GitHubReposInvoker.createComment() not yet implemented.')
  }

  public async createCommentThread (_: string, __: CommentThreadStatus, ___?: string, ____?: boolean): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.createCommentThread()')

    throw Error('GitHubReposInvoker.createCommentThread() not yet implemented.')
  }

  public async setCommentThreadStatus (_: number, __: CommentThreadStatus): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setCommentThreadStatus()')

    throw Error('GitHubReposInvoker.setCommentThreadStatus() not yet implemented.')
  }

  public async addMetadata (_: PullRequestMetadata[]): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.addMetadata()')

    throw Error('GitHubReposInvoker.addMetadata() not yet implemented.')
  }

  private initialize (): void {
    this._logger.logDebug('* GitHubReposInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    this._octokitWrapper.initialize({
      auth: Validator.validate(this._taskLibWrapper.getVariable('GitHub.PAT'), 'GitHub.PAT', 'GitHubReposInvoker.initialize()'),
      userAgent: 'PRMetrics/v1.1.8'
    })

    const sourceRepositoryUri: string = Validator.validate(process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI, 'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', 'GitHubReposInvoker.initialize()')
    const expectedEnding: string = '.git'
    const sourceRepositoryUriElements: string[] = sourceRepositoryUri.split('/')
    if (!sourceRepositoryUri.startsWith('https://github.com/') || !sourceRepositoryUri.endsWith(expectedEnding) || sourceRepositoryUriElements.length !== 5) {
      throw Error(`SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${sourceRepositoryUri}' is in an unexpected format.`)
    }

    this._owner = sourceRepositoryUriElements[3]
    this._repo = sourceRepositoryUriElements[4]!.substring(0, sourceRepositoryUriElements[4]!.length - expectedEnding.length)
    this._pullRequestId = parseInt(Validator.validate(process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER, 'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER', 'GitHubReposInvoker.initialize()'))
    Validator.validate(this._pullRequestId, 'this._pullRequestId', 'GitHubReposInvoker.initialize()')

    this._isInitialized = true
  }
}
