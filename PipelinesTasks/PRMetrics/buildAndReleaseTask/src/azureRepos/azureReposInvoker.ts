// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Comment, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from 'azure-devops-node-api/interfaces/GitInterfaces'
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

  private _project: string = ''
  private _repositoryId: string = ''
  private _pullRequestId: number = 0
  private _gitApi: IGitApi | undefined

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
   * Gets a value indicating whether the OAuth access token is available to the task.
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

    const gitApi: IGitApi = await this.initialize()
    const result: GitPullRequest = await gitApi.getPullRequestById(this._pullRequestId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))

    const title: string = Validator.validate(result.title, 'title', 'AzureReposInvoker.getTitleAndDescription()')
    return {
      title: title,
      description: result.description
    }
  }

  /**
   * Gets the current iteration for the current pull request.
   * @returns A promise containing the current iteration.
   */
  public async getCurrentIteration (): Promise<number> {
    this._taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')

    const gitApi: IGitApi = await this.initialize()
    const result: GitPullRequestIteration[] = await gitApi.getPullRequestIterations(this._repositoryId, this._pullRequestId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
    if (result.length === 0) {
      throw RangeError('The collection of pull request iterations was of length zero.')
    }

    return Validator.validate(result[result.length - 1]!.id, 'id', 'AzureReposInvoker.getCurrentIteration()')
  }

  /**
   * Gets all comment threads for the current pull request.
   * @returns A promise containing the comment threads.
   */
  public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
    this._taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')

    const gitApi: IGitApi = await this.initialize()
    const result: GitPullRequestCommentThread[] = await gitApi.getThreads(this._repositoryId, this._pullRequestId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
    return result
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

    const gitApiPromise: Promise<IGitApi> = this.initialize()
    const updatedGitPullRequest: GitPullRequest = {}
    if (title !== null) {
      updatedGitPullRequest.title = title
    }

    if (description !== null) {
      updatedGitPullRequest.description = description
    }

    const result: GitPullRequest = await (await gitApiPromise).updatePullRequest(updatedGitPullRequest, this._repositoryId, this._pullRequestId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
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

    const gitApiPromise: Promise<IGitApi> = this.initialize()
    const comment: Comment = {
      content: commentContent,
      parentCommentId: parentCommentId
    }

    const result: Comment = await (await gitApiPromise).createComment(comment, this._repositoryId, this._pullRequestId, commentThreadId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
  }

  /**
   * Creates a new comment thread within the current pull request.
   * @param commentContent The text of the new comment.
   * @param status The status to which to the set the comment thread.
   * @param fileName The file to which to add the comment. If this is unspecified, the comment will be created in the global pull request scope.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async createCommentThread (commentContent: string, status: CommentThreadStatus, fileName?: string): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')

    const gitApiPromise: Promise<IGitApi> = this.initialize()
    const commentThread: GitPullRequestCommentThread = {
      comments: [{ content: commentContent }],
      status: status
    }

    if (fileName) {
      commentThread.threadContext = {
        filePath: `/${fileName}`,
        rightFileStart: {
          line: 1,
          offset: 1
        },
        rightFileEnd: {
          line: 1,
          offset: 2
        }
      }
    }

    const result: GitPullRequestCommentThread = await (await gitApiPromise).createThread(commentThread, this._repositoryId, this._pullRequestId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
  }

  /**
   * Updates the status of a comment thread within the current pull request.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param status The status to which to the set the comment thread.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async setCommentThreadStatus (commentThreadId: number, status: CommentThreadStatus): Promise<void> {
    this._taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')

    const gitApiPromise: Promise<IGitApi> = this.initialize()
    const commentThread: GitPullRequestCommentThread = {
      status: status
    }

    const result: GitPullRequestCommentThread = await (await gitApiPromise).updateThread(commentThread, this._repositoryId, this._pullRequestId, commentThreadId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
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

    const gitApiPromise: Promise<IGitApi> = this.initialize()
    const jsonPatchDocumentValues: JsonPatchOperation[] = []
    metadata.forEach((datum: IPullRequestMetadata): void => {
      const operation: JsonPatchOperation = {
        op: Operation.Replace,
        path: `/PRMetrics.${datum.key}`,
        value: datum.value.toString()
      }

      jsonPatchDocumentValues.push(operation)
    })

    const result: object = await (await gitApiPromise).updatePullRequestProperties(null, jsonPatchDocumentValues, this._repositoryId, this._pullRequestId, this._project)
    this._taskLibWrapper.debug(JSON.stringify(result))
  }

  private async initialize (): Promise<IGitApi> {
    this._taskLibWrapper.debug('* AzureReposInvoker.initialize()')

    if (this._gitApi) {
      return this._gitApi
    }

    this._project = Validator.validate(process.env.SYSTEM_TEAMPROJECT, 'SYSTEM_TEAMPROJECT', 'AzureReposInvoker.initialize()')
    this._repositoryId = Validator.validate(process.env.BUILD_REPOSITORY_ID, 'BUILD_REPOSITORY_ID', 'AzureReposInvoker.initialize()')
    this._pullRequestId = Validator.validate(parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID!), 'SYSTEM_PULLREQUEST_PULLREQUESTID', 'AzureReposInvoker.initialize()')

    const accessToken: string = Validator.validate(process.env.SYSTEM_ACCESSTOKEN, 'SYSTEM_ACCESSTOKEN', 'AzureReposInvoker.initialize()')
    const authHandler: IRequestHandler = this._azureDevOpsApiWrapper.getPersonalAccessTokenHandler(accessToken)

    const defaultUrl: string = Validator.validate(process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI, 'SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', 'AzureReposInvoker.initialize()')
    const connection: WebApi = this._azureDevOpsApiWrapper.getWebApiInstance(defaultUrl, authHandler)
    this._gitApi = await connection.getGitApi()

    return this._gitApi
  }
}
