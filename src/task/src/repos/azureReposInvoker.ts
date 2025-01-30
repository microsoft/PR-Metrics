/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from "../utilities/validator.js";
import {
  Comment,
  CommentPosition,
  CommentThreadStatus,
  GitPullRequest,
  GitPullRequestCommentThread,
} from "azure-devops-node-api/interfaces/GitInterfaces.js";
import AzureDevOpsApiWrapper from "../wrappers/azureDevOpsApiWrapper.js";
import BaseReposInvoker from "./baseReposInvoker.js";
import CommentData from "./interfaces/commentData.js";
import FileCommentData from "./interfaces/fileCommentData.js";
import GitInvoker from "../git/gitInvoker.js";
import { IGitApi } from "azure-devops-node-api/GitApi.js";
import { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import Logger from "../utilities/logger.js";
import PullRequestCommentData from "./interfaces/pullRequestCommentData.js";
import PullRequestDetailsInterface from "./interfaces/pullRequestDetailsInterface.js";
import RunnerInvoker from "../runners/runnerInvoker.js";
import TokenManager from "./tokenManager.js";
import { WebApi } from "azure-devops-node-api";
import { singleton } from "tsyringe";

/**
 * A class for invoking Azure Repos functionality.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class AzureReposInvoker extends BaseReposInvoker {
  private readonly _azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  private readonly _gitInvoker: GitInvoker;
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;
  private readonly _tokenManager: TokenManager;

  private _project = "";
  private _repositoryId = "";
  private _pullRequestId = 0;
  private _gitApi: IGitApi | undefined;

  /**
   * Initializes a new instance of the `AzureReposInvoker` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   * @param tokenManager The authorization token manager.
   */
  public constructor(
    azureDevOpsApiWrapper: AzureDevOpsApiWrapper,
    gitInvoker: GitInvoker,
    logger: Logger,
    runnerInvoker: RunnerInvoker,
    tokenManager: TokenManager,
  ) {
    super();

    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper;
    this._gitInvoker = gitInvoker;
    this._logger = logger;
    this._runnerInvoker = runnerInvoker;
    this._tokenManager = tokenManager;
  }

  private static convertPullRequestComments(
    comments: GitPullRequestCommentThread[],
  ): CommentData {
    const result: CommentData = new CommentData();

    let index = 0;
    for (const value of comments) {
      const id: number = Validator.validateNumber(
        value.id,
        `commentThread[${String(index)}].id`,
        "AzureReposInvoker.convertPullRequestComments()",
      );
      const currentComments: Comment[] | undefined = value.comments;
      if (typeof currentComments === "undefined") {
        continue;
      }

      const content: string | undefined = currentComments[0]?.content;
      if (typeof content === "undefined" || content === "") {
        continue;
      }

      const status: CommentThreadStatus =
        value.status ?? CommentThreadStatus.Unknown;

      if (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The type definition is incorrect.
        value.threadContext === null ||
        typeof value.threadContext === "undefined"
      ) {
        result.pullRequestComments.push(
          new PullRequestCommentData(id, content, status),
        );
      } else {
        const fileName: string | undefined = value.threadContext.filePath;
        if (typeof fileName === "undefined" || fileName.length <= 1) {
          continue;
        }

        result.fileComments.push(
          new FileCommentData(id, content, fileName.substring(1), status),
        );
      }

      index += 1;
    }

    return result;
  }

  public async isAccessTokenAvailable(): Promise<string | null> {
    this._logger.logDebug("* AzureReposInvoker.isAccessTokenAvailable()");

    const tokenManagerResult: string | null =
      await this._tokenManager.getToken();
    if (tokenManagerResult !== null) {
      return tokenManagerResult;
    }

    if (typeof process.env.PR_METRICS_ACCESS_TOKEN === "undefined") {
      return this._runnerInvoker.loc(
        "repos.azureReposInvoker.noAzureReposAccessToken",
      );
    }

    return null;
  }

  public async getTitleAndDescription(): Promise<PullRequestDetailsInterface> {
    this._logger.logDebug("* AzureReposInvoker.getTitleAndDescription()");

    const gitApiPromise: Promise<IGitApi> = this.getGitApi();
    const result: GitPullRequest = await this.invokeApiCall(
      async (): Promise<GitPullRequest> =>
        (await gitApiPromise).getPullRequestById(
          this._pullRequestId,
          this._project,
        ),
    );
    this._logger.logDebug(JSON.stringify(result));

    const title: string = Validator.validateString(
      result.title,
      "title",
      "AzureReposInvoker.getTitleAndDescription()",
    );
    return {
      description: result.description,
      title,
    };
  }

  public async getComments(): Promise<CommentData> {
    this._logger.logDebug("* AzureReposInvoker.getComments()");

    const gitApiPromise: Promise<IGitApi> = this.getGitApi();
    const result: GitPullRequestCommentThread[] = await this.invokeApiCall(
      async (): Promise<GitPullRequestCommentThread[]> =>
        (await gitApiPromise).getThreads(
          this._repositoryId,
          this._pullRequestId,
          this._project,
        ),
    );
    this._logger.logDebug(JSON.stringify(result));
    return AzureReposInvoker.convertPullRequestComments(result);
  }

  public async setTitleAndDescription(
    title: string | null,
    description: string | null,
  ): Promise<void> {
    this._logger.logDebug("* AzureReposInvoker.setTitleAndDescription()");

    if (title === null && description === null) {
      return;
    }

    const gitApiPromise: Promise<IGitApi> = this.getGitApi();
    const updatedGitPullRequest: GitPullRequest = {};
    if (title !== null) {
      updatedGitPullRequest.title = title;
    }

    if (description !== null) {
      updatedGitPullRequest.description = description;
    }

    const result: GitPullRequest = await this.invokeApiCall(
      async (): Promise<GitPullRequest> =>
        (await gitApiPromise).updatePullRequest(
          updatedGitPullRequest,
          this._repositoryId,
          this._pullRequestId,
          this._project,
        ),
    );
    this._logger.logDebug(JSON.stringify(result));
  }

  public async createComment(
    content: string,
    fileName: string | null,
    status: CommentThreadStatus,
    isFileDeleted?: boolean,
  ): Promise<void> {
    this._logger.logDebug("* AzureReposInvoker.createComment()");

    const gitApiPromise: Promise<IGitApi> = this.getGitApi();
    const commentThread: GitPullRequestCommentThread = {
      comments: [{ content }],
      status,
    };

    if (fileName !== null) {
      commentThread.threadContext = {
        filePath: `/${fileName}`,
      };

      const fileStart: CommentPosition = {
        line: 1,
        offset: 1,
      };
      const fileEnd: CommentPosition = {
        line: 1,
        offset: 2,
      };

      if (isFileDeleted ?? false) {
        commentThread.threadContext.leftFileStart = fileStart;
        commentThread.threadContext.leftFileEnd = fileEnd;
      } else {
        commentThread.threadContext.rightFileStart = fileStart;
        commentThread.threadContext.rightFileEnd = fileEnd;
      }
    }

    const result: GitPullRequestCommentThread = await this.invokeApiCall(
      async (): Promise<GitPullRequestCommentThread> =>
        (await gitApiPromise).createThread(
          commentThread,
          this._repositoryId,
          this._pullRequestId,
          this._project,
        ),
    );
    this._logger.logDebug(JSON.stringify(result));
  }

  public async updateComment(
    commentThreadId: number,
    content: string | null,
    status: CommentThreadStatus | null,
  ): Promise<void> {
    this._logger.logDebug("* AzureReposInvoker.updateComment()");

    if (content === null && status === null) {
      return;
    }

    const gitApiPromise: Promise<IGitApi> = this.getGitApi();
    if (content !== null) {
      const comment: Comment = {
        content,
      };

      const commentResult: Comment = await this.invokeApiCall(
        async (): Promise<Comment> =>
          (await gitApiPromise).updateComment(
            comment,
            this._repositoryId,
            this._pullRequestId,
            commentThreadId,
            1,
            this._project,
          ),
      );
      this._logger.logDebug(JSON.stringify(commentResult));
    }

    if (status !== null) {
      const commentThread: GitPullRequestCommentThread = {
        status,
      };

      const threadResult: GitPullRequestCommentThread =
        await this.invokeApiCall(
          async (): Promise<GitPullRequestCommentThread> =>
            (await gitApiPromise).updateThread(
              commentThread,
              this._repositoryId,
              this._pullRequestId,
              commentThreadId,
              this._project,
            ),
        );
      this._logger.logDebug(JSON.stringify(threadResult));
    }
  }

  public async deleteCommentThread(commentThreadId: number): Promise<void> {
    this._logger.logDebug("* AzureReposInvoker.deleteCommentThread()");

    const gitApiPromise: Promise<IGitApi> = this.getGitApi();
    await this.invokeApiCall(
      async (): Promise<void> =>
        (await gitApiPromise).deleteComment(
          this._repositoryId,
          this._pullRequestId,
          commentThreadId,
          1,
          this._project,
        ),
    );
  }

  protected async invokeApiCall<Response>(
    action: () => Promise<Response>,
  ): Promise<Response> {
    return BaseReposInvoker.invokeApiCall(
      action,
      this._runnerInvoker.loc(
        "repos.azureReposInvoker.insufficientAzureReposAccessTokenPermissions",
      ),
    );
  }

  private async getGitApi(): Promise<IGitApi> {
    this._logger.logDebug("* AzureReposInvoker.getGitApi()");

    if (typeof this._gitApi !== "undefined") {
      return this._gitApi;
    }

    this._project = Validator.validateVariable(
      "SYSTEM_TEAMPROJECT",
      "AzureReposInvoker.getGitApi()",
    );
    this._repositoryId = Validator.validateVariable(
      "BUILD_REPOSITORY_ID",
      "AzureReposInvoker.getGitApi()",
    );
    this._pullRequestId = this._gitInvoker.pullRequestId;

    const accessToken: string = Validator.validateVariable(
      "PR_METRICS_ACCESS_TOKEN",
      "AzureReposInvoker.getGitApi()",
    );
    const authHandler: IRequestHandler =
      this._azureDevOpsApiWrapper.getPersonalAccessTokenHandler(accessToken);

    const defaultUrl: string = Validator.validateVariable(
      "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI",
      "AzureReposInvoker.getGitApi()",
    );
    const connection: WebApi = this._azureDevOpsApiWrapper.getWebApiInstance(
      defaultUrl,
      authHandler,
    );
    this._gitApi = await connection.getGitApi();

    return this._gitApi;
  }
}
