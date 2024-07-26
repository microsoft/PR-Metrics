/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from '../utilities/validator'
import { Comment, CommentPosition, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import AzureDevOpsApiWrapper from '../wrappers/azureDevOpsApiWrapper'
import BaseReposInvoker from './baseReposInvoker'
import CommentData from './interfaces/commentData'
import FileCommentData from './interfaces/fileCommentData'
import GitInvoker from '../git/gitInvoker'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import Logger from '../utilities/logger'
import PullRequestCommentData from './interfaces/pullRequestCommentData'
import PullRequestDetails from './interfaces/pullRequestDetails'
import RunnerInvoker from '../runners/runnerInvoker'
import TokenManager from './tokenManager'
import { WebApi } from 'azure-devops-node-api'
import { singleton } from 'tsyringe'

/**
 * A class for invoking Azure Repos functionality.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class AzureReposInvoker extends BaseReposInvoker {
  private readonly azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  private readonly gitInvoker: GitInvoker
  private readonly logger: Logger
  private readonly runnerInvoker: RunnerInvoker
  private readonly tokenManager: TokenManager

  private project = ''
  private repositoryId = ''
  private pullRequestId = 0
  private gitApi: IGitApi | undefined

  /**
   * Initializes a new instance of the `AzureReposInvoker` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   * @param tokenManager The authorization token manager.
   */
  public constructor (azureDevOpsApiWrapper: AzureDevOpsApiWrapper, gitInvoker: GitInvoker, logger: Logger, runnerInvoker: RunnerInvoker, tokenManager: TokenManager) {
    super()

    this.azureDevOpsApiWrapper = azureDevOpsApiWrapper
    this.gitInvoker = gitInvoker
    this.logger = logger
    this.runnerInvoker = runnerInvoker
    this.tokenManager = tokenManager
  }

  private static convertPullRequestComments (comments: GitPullRequestCommentThread[]): CommentData {
    const result: CommentData = new CommentData()

    for (const [index, value] of comments.entries()) {
      AzureReposInvoker.convertPullRequestCommentEntry(index, value, result)
    }

    return result
  }

  private static convertPullRequestCommentEntry (index: number, value: GitPullRequestCommentThread, result: CommentData): void
  {
    const id: number = Validator.validateNumber(value.id, `commentThread[${index.toString()}].id`, 'AzureReposInvoker.convertPullRequestCommentEntry()')
    const currentComments: Comment[] | undefined = value.comments
    if (currentComments !== undefined) {
      const content: string | undefined = currentComments[0]?.content
      if (content !== undefined && content !== '') {
        const status: CommentThreadStatus = value.status ?? CommentThreadStatus.Unknown
        if (value.threadContext === undefined) {
          result.pullRequestComments.push(new PullRequestCommentData(id, content, status))
        } else {
          const fileName: string | undefined = value.threadContext.filePath
          if (fileName !== undefined && fileName.length > 1) {
            result.fileComments.push(new FileCommentData(id, content, fileName.substring(1), status))
          }
        }
      }
    }
  }

  public async isAccessTokenAvailable (): Promise<string | null> {
    this.logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable()')

    const tokenManagerResult: string | null = await this.tokenManager.getToken()
    if (tokenManagerResult !== null) {
      return tokenManagerResult
    }

    if (process.env.PR_METRICS_ACCESS_TOKEN === undefined) {
      return this.runnerInvoker.loc('repos.azureReposInvoker.noAzureReposAccessToken')
    }

    return null
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this.logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const result: GitPullRequest = await this.invokeApiCall(async (): Promise<GitPullRequest> => (await gitApiPromise).getPullRequestById(this.pullRequestId, this.project))
    this.logger.logDebug(JSON.stringify(result))

    const title: string = Validator.validateString(result.title, 'title', 'AzureReposInvoker.getTitleAndDescription()')
    return {
      description: result.description,
      title,
    }
  }

  public async getComments (): Promise<CommentData> {
    this.logger.logDebug('* AzureReposInvoker.getComments()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const result: GitPullRequestCommentThread[] = await this.invokeApiCall(async (): Promise<GitPullRequestCommentThread[]> => (await gitApiPromise).getThreads(this.repositoryId, this.pullRequestId, this.project))
    this.logger.logDebug(JSON.stringify(result))
    return AzureReposInvoker.convertPullRequestComments(result)
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this.logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')

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

    const result: GitPullRequest = await this.invokeApiCall(async (): Promise<GitPullRequest> => (await gitApiPromise).updatePullRequest(updatedGitPullRequest, this.repositoryId, this.pullRequestId, this.project))
    this.logger.logDebug(JSON.stringify(result))
  }

  public async createComment (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void> {
    this.logger.logDebug('* AzureReposInvoker.createComment()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    const commentThread: GitPullRequestCommentThread = {
      comments: [
        {
          content,
        },
      ],
      status,
    }

    if (fileName !== undefined) {
      commentThread.threadContext = {
        filePath: `/${fileName}`,
      }

      const fileStart: CommentPosition = {
        line: 1,
        offset: 1,
      }
      const fileEnd: CommentPosition = {
        line: 1,
        offset: 2,
      }

      if (isFileDeleted ?? false) {
        commentThread.threadContext.leftFileStart = fileStart
        commentThread.threadContext.leftFileEnd = fileEnd
      } else {
        commentThread.threadContext.rightFileStart = fileStart
        commentThread.threadContext.rightFileEnd = fileEnd
      }
    }

    const result: GitPullRequestCommentThread = await this.invokeApiCall(async (): Promise<GitPullRequestCommentThread> => (await gitApiPromise).createThread(commentThread, this.repositoryId, this.pullRequestId, this.project))
    this.logger.logDebug(JSON.stringify(result))
  }

  public async updateComment (commentThreadId: number, content: string | null, status: CommentThreadStatus | null): Promise<void> {
    this.logger.logDebug('* AzureReposInvoker.updateComment()')

    if (content === null && status === null) {
      return
    }

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    if (content !== null) {
      const comment: Comment = {
        content,
      }

      const commentResult: Comment = await this.invokeApiCall(async (): Promise<Comment> => (await gitApiPromise).updateComment(comment, this.repositoryId, this.pullRequestId, commentThreadId, 1, this.project))
      this.logger.logDebug(JSON.stringify(commentResult))
    }

    if (status !== null) {
      const commentThread: GitPullRequestCommentThread = {
        status,
      }

      const threadResult: GitPullRequestCommentThread = await this.invokeApiCall(async (): Promise<GitPullRequestCommentThread> => (await gitApiPromise).updateThread(commentThread, this.repositoryId, this.pullRequestId, commentThreadId, this.project))
      this.logger.logDebug(JSON.stringify(threadResult))
    }
  }

  public async deleteCommentThread (commentThreadId: number): Promise<void> {
    this.logger.logDebug('* AzureReposInvoker.deleteCommentThread()')

    const gitApiPromise: Promise<IGitApi> = this.getGitApi()
    await this.invokeApiCall(async (): Promise<void> => (await gitApiPromise).deleteComment(this.repositoryId, this.pullRequestId, commentThreadId, 1, this.project))
  }

  protected async invokeApiCall<Response> (action: () => Promise<Response>): Promise<Response> {
    return super.invokeApiCall(action, this.runnerInvoker.loc('repos.azureReposInvoker.insufficientAzureReposAccessTokenPermissions'))
  }

  private async getGitApi (): Promise<IGitApi> {
    this.logger.logDebug('* AzureReposInvoker.getGitApi()')

    if (this.gitApi !== undefined) {
      return this.gitApi
    }

    this.project = Validator.validateVariable('SYSTEM_TEAMPROJECT', 'AzureReposInvoker.getGitApi()')
    this.repositoryId = Validator.validateVariable('BUILD_REPOSITORY_ID', 'AzureReposInvoker.getGitApi()')
    this.pullRequestId = this.gitInvoker.pullRequestId

    const accessToken: string = Validator.validateVariable('PR_METRICS_ACCESS_TOKEN', 'AzureReposInvoker.getGitApi()')
    const authHandler: IRequestHandler = this.azureDevOpsApiWrapper.getPersonalAccessTokenHandler(accessToken)

    const defaultUrl: string = Validator.validateVariable('SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', 'AzureReposInvoker.getGitApi()')
    const connection: WebApi = this.azureDevOpsApiWrapper.getWebApiInstance(defaultUrl, authHandler)
    this.gitApi = await connection.getGitApi()

    return this.gitApi
  }
}
