// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentPosition, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { JsonPatchOperation, Operation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import { WebApi } from 'azure-devops-node-api'
import AzureDevOpsApiWrapper from '../wrappers/azureDevOpsApiWrapper'
import IPullRequestDetails from './iPullRequestDetails'
import IPullRequestMetadata from './iPullRequestMetadata'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for invoking Azure Repos functionality
 */
@singleton()
export default class AzureReposInvoker {
  private _azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  private _taskLibWrapper: TaskLibWrapper
  private _gitApi: IGitApi | undefined

  private _baseUri: string = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI!
  private _project: string = process.env.SYSTEM_TEAMPROJECT!
  private _repositoryId: string = process.env.BUILD_REPOSITORY_ID!
  private _pullRequestId: number = parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID!)

  /**
   * Initializes a new instance of the `AzureReposInvoker` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (azureDevOpsApiWrapper: AzureDevOpsApiWrapper, taskLibWrapper: TaskLibWrapper) {
    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets a value indicating whether the OAuth access token is available.
   * @returns A value indicating whether the OAuth access token is available.
   */
  public get isAccessTokenAvailable (): boolean {
    this._taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable')

    return process.env.SYSTEM_ACCESSTOKEN !== undefined
  }

  /**
   * Gets the title and description for the current pull request.
   * @returns A promise containing the title and description.
   */
  public async getTitleAndDescription (): Promise<IPullRequestDetails> {
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
   * Gets the current iteration for the current pull request.
   * @returns A promise containing the current iteration.
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
   * Gets all comment threads for the current pull request.
   * @returns A promise containing the comment threads.
   */
  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')

    const gitApi: IGitApi = await this.openConnection()
    return await gitApi.getThreads(this._repositoryId, this._pullRequestId, this._project)
  }

  /**
   * Updates the title and description for the current pull request.
   * @param title The new title.
   * @param description The new description.
   * @returns A promise for awaiting the completion of the method call.
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
   * Creates a new comment within the current pull request.
   * @param commentContent The text of the new comment.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param parentCommentId The parent comment ID, after which to add the new comment.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async createComment (commentContent: string, commentThreadId: number, parentCommentId: number): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.createComment()')

    const gitApiPromise: Promise<IGitApi> = this.openConnection()
    const comment: Comment = {
      content: commentContent,
      parentCommentId: parentCommentId
    }

    await (await gitApiPromise).createComment(comment, this._repositoryId, this._pullRequestId, commentThreadId, this._project)
  }

  /**
   * Creates a new comment thread within the current pull request.
   * @param commentContent The text of the new comment.
   * @param status The status to which to the set the comment thread.
   * @param fileName The file to which to add the comment. If this is unspecified, the comment will be created in the global pull request scope.
   * @param withLinesAdded A value indicating whether lines have been added to `fileName`.
   * @returns A promise for awaiting the completion of the method call.
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
   * Updates the status of a comment thread within the current pull request.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param status The status to which to the set the comment thread.
   * @returns A promise for awaiting the completion of the method call.
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
   * Adds metadata to the current pull request.
   * @param metadata The metadata to be added.
   * @returns A promise for awaiting the completion of the method call.
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

    const authHandler: IRequestHandler = this._azureDevOpsApiWrapper.getPersonalAccessTokenHandler(process.env.SYSTEM_ACCESSTOKEN!)
    const connection: WebApi = this._azureDevOpsApiWrapper.getWebApiInstance(this._baseUri, authHandler)
    this._gitApi = await connection.getGitApi()

    return this._gitApi
  }
}
