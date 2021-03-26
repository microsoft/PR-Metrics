// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentPosition, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IPullRequestInfo, IPullRequestMetadata } from '../models/pullRequestInterfaces'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { JsonPatchOperation, Operation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import { WebApi } from 'azure-devops-node-api'
import DevOpsApiWrapper from '../wrappers/devOpsApiWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

@singleton()
export default class AzureReposInvoker {
  private _devOpsApiWrapper: DevOpsApiWrapper
  private _taskLibWrapper: TaskLibWrapper
  private _gitApi: IGitApi | undefined

  private _baseUri: string = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI!
  private _project: string = process.env.SYSTEM_TEAMPROJECT!
  private _repositoryId: string = process.env.BUILD_REPOSITORY_ID!
  private _pullRequestId: number = parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID!)

  /**
    * Initializes a new instance of the AzureReposInvoker class.
    * @param devOpsApiWrapper The wrapper around the Azure Devops Api Task Lib.
    * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
    */
  public constructor (devOpsApiWrapper: DevOpsApiWrapper, taskLibWrapper: TaskLibWrapper) {
    this._devOpsApiWrapper = devOpsApiWrapper
    this._taskLibWrapper = taskLibWrapper
  }

  /**
    * Returns if the devops api token exists or not.
    */
  public get isAccessTokenAvailable (): boolean {
    this._taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable')

    return process.env.SYSTEM_ACCESSTOKEN !== undefined
  }

  /**
    * Gets the pull request from the devops api.
    */
  public async getTitleAndDescription (): Promise<IPullRequestInfo> {
    this._taskLibWrapper.debug('* AzureReposInvoker.getTitleAndDescription()')

    const gitApi: IGitApi = await this.openConnection()
    const gitPullRequest: GitPullRequest = await gitApi.getPullRequestById(this._pullRequestId, this._project)

    const title: string = Validator.validateField(gitPullRequest.title, 'title', 'AzureReposInvoker.getTitleAndDescription()')
    return {
      title: title,
      description: gitPullRequest.description
    }
  }

  /**
    * Gets the current iteration of the pull request.
    * @returns A promise containing the current iteration of the pull request.
    */
  public async getCurrentIteration (): Promise<number> {
    this._taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')

    const gitApi: IGitApi = await this.openConnection()
    const pullRequestIterations: GitPullRequestIteration[] = await gitApi.getPullRequestIterations(this._repositoryId, this._pullRequestId, this._project)
    if (pullRequestIterations.length === 0) {
      throw RangeError('The collection of pull request iterations was of length zero.')
    }

    return Validator.validateField(pullRequestIterations[pullRequestIterations.length - 1]!.id, 'id', 'AzureReposInvoker.getCurrentIteration()')
  }

  /**
    * Gets the pull request comment threads from the devops api.
    */
  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')

    const gitApi: IGitApi = await this.openConnection()
    return await gitApi.getThreads(this._repositoryId, this._pullRequestId, this._project)
  }

  /**
    * Updates the description and title of the pull request.
    * @param title New pull request title.
    * @param description New pull request description.
    */
  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.setTitleAndDescription()')

    if (title === null && description === null) {
      return
    }

    const gitApiPromise: Promise<IGitApi> = this.openConnection()
    const updatedGitPullRequest: GitPullRequest = {}
    if (title !== null) {
      updatedGitPullRequest.title = title
    }

    if (description !== null) {
      updatedGitPullRequest.description = description
    }

    await (await gitApiPromise).updatePullRequest(updatedGitPullRequest, this._repositoryId, this._pullRequestId, this._project)
  }

  /**
    * Creates new comment.
    * @param commentThreadId Comment thread id to add the comment.
    * @param parentCommentId Parent comment id.
    * @param comment Text of the new comment.
    */
  public async createComment (commentContent: string, commentThreadId: number, parentCommentId: number): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.createComment()')

    const gitApiPromise: Promise<IGitApi> = this.openConnection()
    const comment: Comment = {
      content: commentContent,
      parentCommentId: parentCommentId,
    }

    await (await gitApiPromise).createComment(comment, this._repositoryId, this._pullRequestId, commentThreadId, this._project)
  }

  /**
    * Creates new comment thread.
    * @param commentContent Comment text.
    * @param fileName File name to be used in the comment.
    * @param withLinesAdded Flag to determine if lines added or not.
    */
  public async createCommentThread (commentContent: string, status: CommentThreadStatus, fileName?: string, withLinesAdded?: boolean): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')

    const gitApiPromise: Promise<IGitApi> = this.openConnection()
    const commentThread: GitPullRequestCommentThread = {
      comments: [{ content: commentContent }],
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

      if (!withLinesAdded) {
        commentThread.threadContext.leftFileStart = fileStart
        commentThread.threadContext.leftFileEnd = fileEnd
      } else {
        commentThread.threadContext.rightFileStart = fileStart
        commentThread.threadContext.rightFileEnd = fileEnd
      }
    }

    await (await gitApiPromise).createThread(commentThread, this._repositoryId, this._pullRequestId, this._project)
  }

  /**
    * Updates the comment thread status.
    * @param commentThreadId Comment thread id to update the status.
    * @param status The new comment thread status.
    */
  public async setCommentThreadStatus (commentThreadId: number, status: CommentThreadStatus): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')

    const gitApiPromise: Promise<IGitApi> = this.openConnection()
    const commentThread: GitPullRequestCommentThread = {
      status: status
    }

    await (await gitApiPromise).updateThread(commentThread, this._repositoryId, this._pullRequestId, commentThreadId, this._project)
  }

  /**
    * Adds metadata to the pull request.
    * @param pullRequestMetadata Metadata array.
    */
  public async addMetadata (metadata: IPullRequestMetadata[]): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.addMetadata()')

    if (metadata.length === 0) {
      throw RangeError('The collection of metadata was of length zero.')
    }

    const gitApiPromise: Promise<IGitApi> = this.openConnection()
    const jsonPatchDocumentValues: JsonPatchOperation[] = []
    metadata.forEach((datum: IPullRequestMetadata): void => {
      const operation: JsonPatchOperation = {
        op: Operation.Replace,
        path: `/PRMetrics.${datum.key}`,
        value: datum.value.toString()
      }

      jsonPatchDocumentValues.push(operation)
    })

    await (await gitApiPromise).updatePullRequestProperties(null, jsonPatchDocumentValues, this._repositoryId, this._pullRequestId, this._project)
  }

  private async openConnection (): Promise<IGitApi> {
    this._taskLibWrapper.debug('* AzureReposInvoker.openConnection()')

    if (this._gitApi) {
      return this._gitApi
    }

    const authHandler: IRequestHandler = this._devOpsApiWrapper.getPersonalAccessTokenHandler(process.env.SYSTEM_ACCESSTOKEN!)
    const connection: WebApi = this._devOpsApiWrapper.getWebApiInstance(this._baseUri, authHandler)
    this._gitApi = await connection.getGitApi()

    return this._gitApi
  }
}
