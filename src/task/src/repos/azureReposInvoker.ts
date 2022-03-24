// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentPosition, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import { WebApi } from 'azure-devops-node-api'
import AzureDevOpsApiWrapper from '../wrappers/azureDevOpsApiWrapper'
import BaseReposInvoker from './baseReposInvoker'
import CommentData from './interfaces/commentData'
import FileCommentData from './interfaces/fileCommentData'
import Logger from '../utilities/logger'
import PullRequestCommentData from './interfaces/pullRequestCommentData'
import PullRequestDetails from './interfaces/pullRequestDetails'
import RunnerInvoker from '../runners/runnerInvoker'
import GitInvoker from '../git/gitInvoker'

/**
 * A class for invoking Azure Repos functionality.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class AzureReposInvoker extends BaseReposInvoker {
  private readonly _azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  private readonly _gitInvoker: GitInvoker
  private readonly _logger: Logger
  private readonly _runnerInvoker: RunnerInvoker

  private _project: string = ''
  private _repositoryId: string = ''
  private _pullRequestId: number = 0
  private _gitApi: IGitApi | undefined

  /**
   * Initializes a new instance of the `AzureReposInvoker` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (azureDevOpsApiWrapper: AzureDevOpsApiWrapper, gitInvoker: GitInvoker, logger: Logger, runnerInvoker: RunnerInvoker) {
    super()

    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper
    this._gitInvoker = gitInvoker
    this._logger = logger
    this._runnerInvoker = runnerInvoker
  }

  public get isAccessTokenAvailable (): string | null {
    this._logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable')

    if (process.env.SYSTEM_ACCESSTOKEN === undefined) {
      return this._runnerInvoker.loc('metrics.codeMetricsCalculator.noAzureReposAccessToken')
    }

    return null
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const result: GitPullRequest = await this.invokeApiCall(async (): Promise<GitPullRequest> => await (await gitApiPromise).getPullRequestById(this._pullRequestId, this._project))
    this._logger.logDebug(JSON.stringify(result))

    const title: string = Validator.validate(result.title, 'title', 'AzureReposInvoker.getTitleAndDescription()')
    return {
      title: title,
      description: result.description
    }
  }

  public async getComments (): Promise<CommentData> {
    this._logger.logDebug('* AzureReposInvoker.getComments()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const result: GitPullRequestCommentThread[] = await this.invokeApiCall(async (): Promise<GitPullRequestCommentThread[]> => await (await gitApiPromise).getThreads(this._repositoryId, this._pullRequestId, this._project))
    this._logger.logDebug(JSON.stringify(result))
    return AzureReposInvoker.convertPullRequestComments(result)
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

    const result: GitPullRequest = await this.invokeApiCall(async (): Promise<GitPullRequest> => await (await gitApiPromise).updatePullRequest(updatedGitPullRequest, this._repositoryId, this._pullRequestId, this._project))
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

    const result: GitPullRequestCommentThread = await this.invokeApiCall(async (): Promise<GitPullRequestCommentThread> => await (await gitApiPromise).createThread(commentThread, this._repositoryId, this._pullRequestId, this._project))
    this._logger.logDebug(JSON.stringify(result))
  }

  public async updateComment (commentThreadId: number, content: string | null, status: CommentThreadStatus | null): Promise<void> {
    this._logger.logDebug('* AzureReposInvoker.updateComment()')

    if (content === null && status === null) {
      return
    }

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    if (content !== null) {
      const comment: Comment = {
        content: content
      }

      const commentResult: Comment = await this.invokeApiCall(async (): Promise<Comment> => await (await gitApiPromise).updateComment(comment, this._repositoryId, this._pullRequestId, commentThreadId, 1, this._project))
      this._logger.logDebug(JSON.stringify(commentResult))
    }

    if (status !== null) {
      const commentThread: GitPullRequestCommentThread = {
        status: status
      }

      const threadResult: GitPullRequestCommentThread = await this.invokeApiCall(async (): Promise<GitPullRequestCommentThread> => await (await gitApiPromise).updateThread(commentThread, this._repositoryId, this._pullRequestId, commentThreadId, this._project))
      this._logger.logDebug(JSON.stringify(threadResult))
    }
  }

  public async deleteCommentThread (commentThreadId: number): Promise<void> {
    this._logger.logDebug('* AzureReposInvoker.deleteCommentThread()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    await this.invokeApiCall(async (): Promise<void> => await (await gitApiPromise).deleteComment(this._repositoryId, this._pullRequestId, commentThreadId, 1, this._project))
  }

  private async getGitApi (): Promise<IGitApi> {
    this._logger.logDebug('* AzureReposInvoker.getGitApi()')

    if (this._gitApi) {
      return this._gitApi
    }

    this._project = Validator.validateVariable('SYSTEM_TEAMPROJECT', 'AzureReposInvoker.getGitApi()')
    this._repositoryId = Validator.validateVariable('BUILD_REPOSITORY_ID', 'AzureReposInvoker.getGitApi()')
    this._pullRequestId = this._gitInvoker.pullRequestId

    const accessToken: string = Validator.validateVariable('SYSTEM_ACCESSTOKEN', 'AzureReposInvoker.getGitApi()')
    const authHandler: IRequestHandler = this._azureDevOpsApiWrapper.getPersonalAccessTokenHandler(accessToken)

    const defaultUrl: string = Validator.validateVariable('SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', 'AzureReposInvoker.getGitApi()')
    const connection: WebApi = this._azureDevOpsApiWrapper.getWebApiInstance(defaultUrl, authHandler)
    this._gitApi = await connection.getGitApi()

    return this._gitApi
  }

  private static convertPullRequestComments (comments: GitPullRequestCommentThread[]): CommentData {
    const result: CommentData = new CommentData()

    comments.forEach((value: GitPullRequestCommentThread, index: number): void => {
      const id: number = Validator.validate(value.id, `commentThread[${index}].id`, 'AzureReposInvoker.convertPullRequestComments()')
      const comments: Comment[] | undefined = value.comments
      if (!comments) {
        return
      }

      const content: string | undefined = comments[0]?.content
      if (!content) {
        return
      }

      const status: CommentThreadStatus = value.status || CommentThreadStatus.Unknown

      if (!value.threadContext) {
        result.pullRequestComments.push(new PullRequestCommentData(id, content, status))
      } else {
        const fileName: string | undefined = value.threadContext.filePath
        if (!fileName || fileName.length <= 1) {
          return
        }

        result.fileComments.push(new FileCommentData(id, content, fileName.substring(1), status))
      }
    })

    return result
  }

  protected async invokeApiCall<TResponse> (action: () => Promise<TResponse>): Promise<TResponse> {
    return super.invokeApiCall(action, this._runnerInvoker.loc('metrics.codeMetricsCalculator.insufficientAzureReposAccessTokenPermissions'))
  }
}
