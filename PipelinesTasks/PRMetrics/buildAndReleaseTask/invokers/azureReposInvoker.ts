// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IGitApi } from "azure-devops-node-api/gitApi";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { Comment, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from "azure-devops-node-api/interfaces/GitInterfaces";
import DevOpsApiWrapper from "../wrappers/devOpsApiWrapper";
import TaskLibWrapper from "../wrappers/taskLibWrapper";

export default class AzureReposInvoker {
    private taskLibWrapper: TaskLibWrapper;
    private devOpsApiWrapper: DevOpsApiWrapper;
    private gitApi: IGitApi | undefined;

    private baseUri = `${process.env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"]}`;
    private project = process.env["SYSTEM_TEAMPROJECT"];
    private repositoryId = process.env["BUILD_REPOSITORY_ID"] as string;
    private pullRequestId = process.env["SYSTEM_PULLREQUEST_PULLREQUESTID"] ? parseInt(process.env["SYSTEM_PULLREQUEST_PULLREQUESTID"]) : 0;
    private azurePAT = process.env["SYSTEM_ACCESSTOKEN"];

    /**
      * Initializes a new instance of the AzureReposInvoker class.
      * @param devOpsApiWrapper The wrapper around the Azure Devops Api Task Lib.
      * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
      */
    public constructor(devOpsApiWrapper: DevOpsApiWrapper, taskLibWrapper: TaskLibWrapper) {
        this.devOpsApiWrapper = devOpsApiWrapper;
        this.taskLibWrapper = taskLibWrapper;
    }

    /**
      * Gets the pull request from the devops api.
      */
    public getDetails = async (): Promise<GitPullRequest> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.getDetails()');

        const gitApi = await this.openConnection();
        return await gitApi.getPullRequestById(this.pullRequestId, this.project);
    }

    /**
      * Gets the pull request iterations from the devops api.
      */
    public getIterations = async (): Promise<GitPullRequestIteration[]> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.getIterations()');

        const gitApi = await this.openConnection();
        return await gitApi.getPullRequestIterations(this.repositoryId, this.pullRequestId, this.project);
    }

    /**
      * Gets the pull request comment threads from the devops api.
      */
    public getCommentThreads = async (): Promise<GitPullRequestCommentThread[]> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()');

        const gitApi = await this.openConnection();
        return await gitApi.getThreads(this.repositoryId, this.pullRequestId, this.project);
    }

    /**
      * Gets the pull request comment thread from the devops api.
      * @param commentThreadId Comment thread id to be used to retrieve comment thread.
      */
    public getCommentThread = async (commentThreadId: number): Promise<GitPullRequestCommentThread> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.getCommentThread()');

        const gitApi = await this.openConnection();
        return await gitApi.getPullRequestThread(this.repositoryId, this.pullRequestId, commentThreadId, this.project);
    }

    /**
      * Updates the description and title of the pull request.
      * @param description New pull request description.
      * @param title New pull request title.
      */
    public setDetails = async (description: string, title: string): Promise<void> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.setDetails()');

        if (!description?.trim() && !title?.trim()) {
            return;
        }

        const gitApi = await this.openConnection();
        const updatedGitPullRequest: GitPullRequest = {};

        if (title?.trim()) {
            updatedGitPullRequest.title = title;
        }

        if (description?.trim()) {
            updatedGitPullRequest.description = description;
        }

        await gitApi.updatePullRequest(updatedGitPullRequest, this.repositoryId, this.pullRequestId, this.project);
    }

    /**
      * Updates the comment thread status.
      * @param commentThreadId Comment thread id to update the status.
      * @param status The new comment thread status.
      */
    public setCommentThreadStatus = async (commentThreadId: number, status: CommentThreadStatus): Promise<void> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()');

        const gitApi = await this.openConnection();
        const updatedCommentThread: GitPullRequestCommentThread = {};
        updatedCommentThread.status = status;
        await gitApi.updateThread(updatedCommentThread, this.repositoryId, this.pullRequestId, commentThreadId, this.project);
    }

    /**
      * Creates new comment thread.
      * @param comment Comment text.
      * @param fileName File name to be used in the comment.
      * @param withLinesAdded Flag to determine if lines added or not.
      */
    public createCommentThread = async (comment: string, fileName: string, withLinesAdded: boolean): Promise<GitPullRequestCommentThread> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()');

        const gitApi = await this.openConnection();
        const updatedCommentThread: GitPullRequestCommentThread = {
            comments: [{ content: comment }],
            threadContext: { filePath: `/${fileName}` }
        };

        const fileStart = {
            line: 1,
            offset: 1
        };

        const fileEnd = {
            line: 1,
            offset: 2
        };

        if (fileName) {
            if (!withLinesAdded) {
                updatedCommentThread.threadContext = {
                    filePath: `/${fileName}`,
                    leftFileStart: fileStart,
                    leftFileEnd: fileEnd
                };
            } else {
                updatedCommentThread.threadContext = {
                    filePath: `/${fileName}`,
                    rightFileStart: fileStart,
                    rightFileEnd: fileEnd
                };
            }
        }

        return await gitApi.createThread(updatedCommentThread, this.repositoryId, this.pullRequestId, this.project);
    }

    /**
      * Creates new comment.
      * @param commentThreadId Comment thread id to add the comment.
      * @param parentCommentId Parent comment id.
      * @param commentText Text of the new comment.
      */
    public createComment = async (commentThreadId: number, parentCommentId: number, commentText: string): Promise<void> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.createComment()');

        const gitApi = await this.openConnection();
        const comment: Comment = { content: commentText, parentCommentId: parentCommentId };

        await gitApi.createComment(comment, this.repositoryId, this.pullRequestId, commentThreadId, this.project);
    }

    /**
      * Adds metadata to the pull request.
      * @param metadata Metadata object.
      */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public addMetadata = async (metadata: any): Promise<void> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.addMetadata()');

        const gitApi = await this.openConnection();
        const jsonPatchDocumentValues = [];

        for (const key of Object.keys(metadata)) {
            const value = metadata[key];
            const jsonPatchOperation: JsonPatchOperation = {
                op: Operation.Replace,
                path: key,
                value: value.toString().toLowerCase()
            };
            jsonPatchDocumentValues.push(jsonPatchOperation);
        }

        const jsonPatchDocument: JsonPatchDocument = jsonPatchDocumentValues;

        await gitApi.updatePullRequestProperties(null, jsonPatchDocument, this.repositoryId, this.pullRequestId, this.project);
    }

    /**
      * Returns if the devops api token exists or not.
      */
    public isAccessTokenAvailable = (): boolean => {
        this.taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable()');

        return !!this.azurePAT;
    }

    private openConnection = async (): Promise<IGitApi> => {
        this.taskLibWrapper.debug('* AzureReposInvoker.openConnection()');

        if (this.gitApi) {
            return this.gitApi;
        }

        const authHandler = this.devOpsApiWrapper.getPersonalAccessTokenHandler(this.azurePAT as string);
        const connection = this.devOpsApiWrapper.getWebApiInstance(this.baseUri, authHandler);
        this.gitApi = await connection.getGitApi();

        return this.gitApi;
    }
}