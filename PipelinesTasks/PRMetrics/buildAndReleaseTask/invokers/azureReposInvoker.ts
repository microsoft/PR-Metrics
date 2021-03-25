// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IGitApi } from 'azure-devops-node-api/GitApi'
import { JsonPatchDocument, JsonPatchOperation, Operation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces'
import { Comment, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { IPullRequestInfo, IPullRequestMetadata } from '../models/pullRequestInterfaces'
import DevOpsApiWrapper from '../wrappers/devOpsApiWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

export default class AzureReposInvoker {
    private taskLibWrapper: TaskLibWrapper;
    private devOpsApiWrapper: DevOpsApiWrapper;
    private gitApi: IGitApi | undefined;

    private baseUri = process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI as string;
    private project = process.env.SYSTEM_TEAMPROJECT;
    private repositoryId = process.env.BUILD_REPOSITORY_ID as string;
    private pullRequestId = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID ? parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID) : -1;
    private azurePAT = process.env.SYSTEM_ACCESSTOKEN;

    /**
      * Initializes a new instance of the AzureReposInvoker class.
      * @param devOpsApiWrapper The wrapper around the Azure Devops Api Task Lib.
      * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
      */
    public constructor (devOpsApiWrapper: DevOpsApiWrapper, taskLibWrapper: TaskLibWrapper) {
      this.devOpsApiWrapper = devOpsApiWrapper
      this.taskLibWrapper = taskLibWrapper
    }

    /**
      * Gets the pull request from the devops api.
      */
    public async getDetails (): Promise<GitPullRequest> {
      this.taskLibWrapper.debug('* AzureReposInvoker.getDetails()')

      const gitApi = await this.openConnection()
      const gitPullRequest = await gitApi.getPullRequestById(this.pullRequestId, this.project)
      return {
        description: gitPullRequest.description,
        title: gitPullRequest.title
      } as IPullRequestInfo
    }

    /**
      * Gets the current iteration of the pull request.
      * @returns A promise containing the current iteration of the pull request.
      */
    public async getCurrentIteration (): Promise<number> {
      this.taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')

      const gitApi: IGitApi = await this.openConnection()
      const pullRequestIterations: GitPullRequestIteration[] = await gitApi.getPullRequestIterations(this.repositoryId, this.pullRequestId, this.project)
      if (pullRequestIterations.length === 0) {
        throw Error('The collection of pull request iterations was of length zero.')
      }

      const latestIteration: GitPullRequestIteration = pullRequestIterations[pullRequestIterations.length - 1]!
      if (!latestIteration.id) {
        throw Error('The pull request iteration is undefined.')
      }

      return latestIteration.id
    }

    /**
      * Gets the pull request comment threads from the devops api.
      */
    public async getCommentThreads (): Promise<GitPullRequestCommentThread[]> {
      this.taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')

      const gitApi = await this.openConnection()
      return await gitApi.getThreads(this.repositoryId, this.pullRequestId, this.project)
    }

    /**
      * Gets the pull request comment thread from the devops api.
      * @param commentThreadId Comment thread id to be used to retrieve comment thread.
      */
    public async getCommentThread (commentThreadId: number): Promise<GitPullRequestCommentThread> {
      this.taskLibWrapper.debug('* AzureReposInvoker.getCommentThread()')

      const gitApi = await this.openConnection()
      return await gitApi.getPullRequestThread(this.repositoryId, this.pullRequestId, commentThreadId, this.project)
    }

    /**
      * Updates the description and title of the pull request.
      * @param description New pull request description.
      * @param title New pull request title.
      */
    public async setDetails (description?: string, title?: string): Promise<void> {
      this.taskLibWrapper.debug('* AzureReposInvoker.setDetails()')

      if (!description?.trim() && !title?.trim()) {
        return
      }

      const gitApi = await this.openConnection()
      const updatedGitPullRequest: GitPullRequest = {}

      if (title?.trim()) {
        updatedGitPullRequest.title = title
      }

      if (description?.trim()) {
        updatedGitPullRequest.description = description
      }

      await gitApi.updatePullRequest(updatedGitPullRequest, this.repositoryId, this.pullRequestId, this.project)
    }

    /**
      * Updates the comment thread status.
      * @param commentThreadId Comment thread id to update the status.
      * @param status The new comment thread status.
      */
    public async setCommentThreadStatus (commentThreadId: number, status: CommentThreadStatus): Promise<void> {
      this.taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')

      const gitApi = await this.openConnection()
      const updatedCommentThread: GitPullRequestCommentThread = {}
      updatedCommentThread.status = status
      await gitApi.updateThread(updatedCommentThread, this.repositoryId, this.pullRequestId, commentThreadId, this.project)
    }

    /**
      * Creates new comment thread.
      * @param comment Comment text.
      * @param fileName File name to be used in the comment.
      * @param withLinesAdded Flag to determine if lines added or not.
      */
    public async createCommentThread (comment: string, fileName: string, withLinesAdded: boolean): Promise<GitPullRequestCommentThread> {
      this.taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')

      const gitApi = await this.openConnection()
      const updatedCommentThread: GitPullRequestCommentThread = {
        comments: [{ content: comment }],
        threadContext: { filePath: `/${fileName}` }
      }

      const fileStart = {
        line: 1,
        offset: 1
      }

      const fileEnd = {
        line: 1,
        offset: 2
      }

      if (fileName) {
        if (!withLinesAdded) {
          updatedCommentThread.threadContext = {
            filePath: `/${fileName}`,
            leftFileStart: fileStart,
            leftFileEnd: fileEnd
          }
        } else {
          updatedCommentThread.threadContext = {
            filePath: `/${fileName}`,
            rightFileStart: fileStart,
            rightFileEnd: fileEnd
          }
        }
      }

      return await gitApi.createThread(updatedCommentThread, this.repositoryId, this.pullRequestId, this.project)
    }

    /**
      * Creates new comment.
      * @param commentThreadId Comment thread id to add the comment.
      * @param parentCommentId Parent comment id.
      * @param commentText Text of the new comment.
      */
    public async createComment (commentThreadId: number, parentCommentId: number, commentText: string): Promise<void> {
      this.taskLibWrapper.debug('* AzureReposInvoker.createComment()')

      const gitApi = await this.openConnection()
      const comment: Comment = { content: commentText, parentCommentId: parentCommentId }

      await gitApi.createComment(comment, this.repositoryId, this.pullRequestId, commentThreadId, this.project)
    }

    /**
      * Adds metadata to the pull request.
      * @param pullRequestMetadata Metadata array.
      */
    public async addMetadata (pullRequestMetadata: IPullRequestMetadata[]): Promise<void> {
      this.taskLibWrapper.debug('* AzureReposInvoker.addMetadata()')

      const gitApi = await this.openConnection()
      const jsonPatchDocumentValues = []

      for (let i = 0; i < pullRequestMetadata.length; i++) {
        const metadata = pullRequestMetadata[i]
        if (metadata) {
          const jsonPatchOperation: JsonPatchOperation = {
            op: Operation.Replace,
            path: metadata.key,
            value: metadata.value.toString().toLowerCase()
          }
          jsonPatchDocumentValues.push(jsonPatchOperation)
        }
      }

      const jsonPatchDocument: JsonPatchDocument = jsonPatchDocumentValues

      await gitApi.updatePullRequestProperties(null, jsonPatchDocument, this.repositoryId, this.pullRequestId, this.project)
    }

    /**
      * Returns if the devops api token exists or not.
      */
    public isAccessTokenAvailable (): boolean {
      this.taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable()')

      return !!this.azurePAT
    }

    private async openConnection (): Promise<IGitApi> {
      this.taskLibWrapper.debug('* AzureReposInvoker.openConnection()')

      if (this.gitApi) {
        return this.gitApi
      }

      const authHandler = this.devOpsApiWrapper.getPersonalAccessTokenHandler(this.azurePAT as string)
      const connection = this.devOpsApiWrapper.getWebApiInstance(this.baseUri, authHandler)
      this.gitApi = await connection.getGitApi()

      return this.gitApi
    }
}
