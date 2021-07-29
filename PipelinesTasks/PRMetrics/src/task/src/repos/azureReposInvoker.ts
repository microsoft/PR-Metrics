// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentPosition, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import { WebApi } from 'azure-devops-node-api'
import AzureDevOpsApiWrapper from '../wrappers/azureDevOpsApiWrapper'
import IReposInvoker from './iReposInvoker'
import Logger from '../utilities/logger'
import PullRequestCommentsThread from '../pullRequests/pullRequestCommentsThread'
import PullRequestDetails from './pullRequestDetails'

/**
 * A class for invoking Azure Repos functionality.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class AzureReposInvoker implements IReposInvoker {
  private readonly _azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  private readonly _logger: Logger

  private _project: string = ''
  private _repositoryId: string = ''
  private _pullRequestId: number = 0
  private _gitApi: IGitApi | undefined

  /**
   * Initializes a new instance of the `AzureReposInvoker` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param logger The logger.
   */
  public constructor (azureDevOpsApiWrapper: AzureDevOpsApiWrapper, logger: Logger) {
    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper
    this._logger = logger
  }

  public get isCommentsFunctionalityAvailable (): boolean {
    this._logger.logDebug('* AzureReposInvoker.isCommentsFunctionalityAvailable')

    return true
  }

  public get isAccessTokenAvailable (): boolean {
    this._logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable')

    return process.env.SYSTEM_ACCESSTOKEN !== undefined
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')

    const gitApi: IGitApi = await this.getGitApi()
    const result: GitPullRequest = await gitApi.getPullRequestById(this._pullRequestId, this._project)
    this._logger.logDebug(JSON.stringify(result))

    const title: string = Validator.validate(result.title, 'title', 'AzureReposInvoker.getTitleAndDescription()')
    return {
      title: title,
      description: result.description
    }
  }

  public async getComments (): Promise<GitPullRequestCommentThread[]> {
    this._logger.logDebug('* AzureReposInvoker.getComments()')

    const gitApi: IGitApi = await this.getGitApi()
    const result: GitPullRequestCommentThread[] = await gitApi.getThreads(this._repositoryId, this._pullRequestId, this._project)
    this._logger.logDebug(JSON.stringify(result))
    return result
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')

    if (title === null && description === null) {
      return
    }

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const updatedGitPullRequest: GitPullRequest = {}
    if (title !== null) {
      updatedGitPullRequest.title = title
    }

    if (description !== null) {
      updatedGitPullRequest.description = description
    }

    const result: GitPullRequest = await (await gitApiPromise).updatePullRequest(updatedGitPullRequest, this._repositoryId, this._pullRequestId, this._project)
    this._logger.logDebug(JSON.stringify(result))
  }

  public async createComment (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void> {
    this._logger.logDebug('* AzureReposInvoker.createComment()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const commentThread: GitPullRequestCommentThread = {
      comments: [{ content: content }],
      status: status
    }

    if (fileName) {
      commentThread.threadContext = {
        filePath: `/${fileName}`
      }

      const fileStart: CommentPosition = {
        line: 1,
        offset: 1
      }
      const fileEnd: CommentPosition = {
        line: 1,
        offset: 2
      }

      if (isFileDeleted) {
        commentThread.threadContext.leftFileStart = fileStart
        commentThread.threadContext.leftFileEnd = fileEnd
      } else {
        commentThread.threadContext.rightFileStart = fileStart
        commentThread.threadContext.rightFileEnd = fileEnd
      }
    }

    const result: GitPullRequestCommentThread = await (await gitApiPromise).createThread(commentThread, this._repositoryId, this._pullRequestId, this._project)
    this._logger.logDebug(JSON.stringify(result))
  }

  public async updateComment (content: string | null, status: CommentThreadStatus | null, commentThreadId: number, commentId: number): Promise<void> {
    this._logger.logDebug('* AzureReposInvoker.updateComment()')

    if (content === null && status === null) {
      return
    }

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    if (content !== null) {
      const comment: Comment = {
        content: content
      }

      const commentResult: Comment = await (await gitApiPromise).updateComment(comment, this._repositoryId, this._pullRequestId, commentThreadId, commentId, this._project)
      this._logger.logDebug(JSON.stringify(commentResult))
    }

    if (status !== null) {
      const commentThread: GitPullRequestCommentThread = {
        status: status
      }

      const threadResult: GitPullRequestCommentThread = await (await gitApiPromise).updateThread(commentThread, this._repositoryId, this._pullRequestId, commentThreadId, this._project)
      this._logger.logDebug(JSON.stringify(threadResult))
    }
  }

  public async deleteCommentThread (commentThread: PullRequestCommentsThread): Promise<void> {
    this._logger.logDebug('* AzureReposInvoker.deleteCommentThread()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    await Promise.all(commentThread.commentIds.map(async (commentId: number): Promise<void> => {
      await (await gitApiPromise).deleteComment(this._repositoryId, this._pullRequestId, commentThread.threadId, commentId, this._project)
    }))
  }

  private async getGitApi (): Promise<IGitApi> {
    this._logger.logDebug('* AzureReposInvoker.getGitApi()')

    if (this._gitApi) {
      return this._gitApi
    }

    this._project = Validator.validateVariable('SYSTEM_TEAMPROJECT', 'AzureReposInvoker.getGitApi()')
    this._repositoryId = Validator.validateVariable('BUILD_REPOSITORY_ID', 'AzureReposInvoker.getGitApi()')
    this._pullRequestId = Validator.validate(parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID!), 'SYSTEM_PULLREQUEST_PULLREQUESTID', 'AzureReposInvoker.getGitApi()')

    const accessToken: string = Validator.validateVariable('SYSTEM_ACCESSTOKEN', 'AzureReposInvoker.getGitApi()')
    const authHandler: IRequestHandler = this._azureDevOpsApiWrapper.getPersonalAccessTokenHandler(accessToken)

    const defaultUrl: string = Validator.validateVariable('SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', 'AzureReposInvoker.getGitApi()')
    const connection: WebApi = this._azureDevOpsApiWrapper.getWebApiInstance(defaultUrl, authHandler)
    this._gitApi = await connection.getGitApi()

    return this._gitApi
  }
}
