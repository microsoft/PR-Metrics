/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */
import * as Validator from "../utilities/validator.js";
import type AzureReposInvoker from "./azureReposInvoker.js";
import type CommentData from "./interfaces/commentData.js";
import type { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type GitHubReposInvoker from "./gitHubReposInvoker.js";
import type Logger from "../utilities/logger.js";
import type PullRequestDetailsInterface from "./interfaces/pullRequestDetailsInterface.js";
import type ReposInvokerInterface from "./reposInvokerInterface.js";
import RunnerInvoker from "../runners/runnerInvoker.js";
/**
 * A class for invoking repository functionality with any underlying repository store.
 */
export default class ReposInvoker implements ReposInvokerInterface {
  private readonly _azureReposInvoker: AzureReposInvoker;
  private readonly _gitHubReposInvoker: GitHubReposInvoker;
  private readonly _logger: Logger;

  private _reposInvoker: ReposInvokerInterface | null = null;

  /**
   * Initializes a new instance of the `ReposInvoker` class.
   * @param azureReposInvoker The wrapper around the Azure Repos functionality.
   * @param gitHubReposInvoker The wrapper around the GitHub Repos functionality.
   * @param logger The logger.
   */
  public constructor(
    azureReposInvoker: AzureReposInvoker,
    gitHubReposInvoker: GitHubReposInvoker,
    logger: Logger,
  ) {
    this._azureReposInvoker = azureReposInvoker;
    this._gitHubReposInvoker = gitHubReposInvoker;
    this._logger = logger;
  }

  private get reposInvoker(): ReposInvokerInterface {
    this._logger.logDebug("* ReposInvoker.getReposInvoker()");

    if (this._reposInvoker !== null) {
      return this._reposInvoker;
    }

    // If a GitHub runner is in use, only GitHub repos are supported.
    if (RunnerInvoker.isGitHub) {
      this._reposInvoker = this._gitHubReposInvoker;
      return this._reposInvoker;
    }

    const repoProvider: string = Validator.validateVariable(
      "BUILD_REPOSITORY_PROVIDER",
      "ReposInvoker.getReposInvoker()",
    );
    switch (repoProvider) {
      case "TfsGit":
        this._reposInvoker = this._azureReposInvoker;
        break;
      case "GitHub":
      case "GitHubEnterprise":
        this._reposInvoker = this._gitHubReposInvoker;
        break;
      default:
        throw new RangeError(
          `BUILD_REPOSITORY_PROVIDER '${repoProvider}' is unsupported.`,
        );
    }

    return this._reposInvoker;
  }

  public async isAccessTokenAvailable(): Promise<string | null> {
    this._logger.logDebug("* ReposInvoker.isAccessTokenAvailable()");

    return this.reposInvoker.isAccessTokenAvailable();
  }

  public async getTitleAndDescription(): Promise<PullRequestDetailsInterface> {
    this._logger.logDebug("* ReposInvoker.getTitleAndDescription()");

    return this.reposInvoker.getTitleAndDescription();
  }

  public async getComments(): Promise<CommentData> {
    this._logger.logDebug("* ReposInvoker.getComments()");

    return this.reposInvoker.getComments();
  }

  public async setTitleAndDescription(
    title: string | null,
    description: string | null,
  ): Promise<void> {
    this._logger.logDebug("* ReposInvoker.setTitleAndDescription()");

    return this.reposInvoker.setTitleAndDescription(title, description);
  }

  public async createComment(
    content: string,
    fileName: string | null,
    status: CommentThreadStatus,
    isFileDeleted?: boolean,
  ): Promise<void> {
    this._logger.logDebug("* ReposInvoker.createComment()");

    return this.reposInvoker.createComment(
      content,
      fileName,
      status,
      isFileDeleted,
    );
  }

  public async updateComment(
    commentThreadId: number,
    content: string | null,
    status: CommentThreadStatus | null,
  ): Promise<void> {
    this._logger.logDebug("* ReposInvoker.updateComment()");

    return this.reposInvoker.updateComment(commentThreadId, content, status);
  }

  public async deleteCommentThread(commentThreadId: number): Promise<void> {
    this._logger.logDebug("* ReposInvoker.deleteCommentThread()");

    return this.reposInvoker.deleteCommentThread(commentThreadId);
  }
}
