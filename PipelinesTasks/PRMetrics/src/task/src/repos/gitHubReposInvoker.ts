// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { Octokit } from 'octokit'
import { RequestParameters } from '@octokit/types'
import { singleton } from 'tsyringe'
import IReposInvoker from './iReposInvoker'
import Logger from '../utilities/logger'
import PullRequestDetails from './pullRequestDetails'
import PullRequestMetadata from './pullRequestMetadata'
import PullsGetResponseType from './gitHubInterfaces/pullsGetResponseType'
import PullsUpdatePayload from './gitHubInterfaces/pullsUpdatePayload'
import PullsUpdateResponseType from './gitHubInterfaces/pullsUpdateResponseType'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for invoking GitHub Repos functionality.
 */
@singleton()
export default class GitHubReposInvoker implements IReposInvoker {
  private readonly _logger: Logger
  private readonly _taskLibWrapper: TaskLibWrapper

  private _octokit: Octokit | undefined

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param logger The logger.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (logger: Logger, taskLibWrapper: TaskLibWrapper) {
    this._logger = logger
    this._taskLibWrapper = taskLibWrapper
  }

  public get isFunctionalityComplete (): boolean {
    this._logger.logDebug('* GitHubReposInvoker.isFunctionalityComplete')

    return false
  }

  public get isAccessTokenAvailable (): boolean {
    this._logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')

    return true
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')

    const octokit: Octokit = new Octokit({
      userAgent: 'PRMetrics/v1.1.8'
    })
    const result: PullsGetResponseType = await octokit.rest.pulls.get({
      owner: 'microsoft',
      repo: 'OMEX-Azure-DevOps-Extensions',
      pull_number: parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER!)
    })
    this._logger.logDebug(JSON.stringify(result))

    return {
      title: result.data.title,
      description: result.data.body ?? undefined
    }
  }

  public async getCurrentIteration (): Promise<number> {
    this._logger.logDebug('* GitHubReposInvoker.getCurrentIteration()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* GitHubReposInvoker.getCommentThreads()')

    throw Error('GitHub functionality not yet implemented.')
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')

    const octokit: Octokit = this.getOctokit()
    this._logger.logDebug(JSON.stringify(await octokit.request("GET /")))

    const payload: RequestParameters & PullsUpdatePayload = {
      owner: 'microsoft',
      repo: 'OMEX-Azure-DevOps-Extensions',
      pull_number: parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER!)
    }

    if (title !== null) {
      payload.title = title
    }

    if (description !== null) {
      payload.body = description
    }

    const result: PullsUpdateResponseType = await octokit.rest.pulls.update(payload)
    this._logger.logDebug(JSON.stringify(result))
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

  private getOctokit (): Octokit {
    this._logger.logDebug('* GitHubReposInvoker.getOctokit()')

    if (this._octokit) {
      return this._octokit
    }

    this._octokit = new Octokit({
      auth: this._taskLibWrapper.getVariable('GitHub.PAT'),
      userAgent: 'PRMetrics/v1.1.8'
    })

    return this._octokit
  }
}
