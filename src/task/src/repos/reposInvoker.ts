/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from "../utilities/validator.js";
import AzureReposInvoker from "./azureReposInvoker.js";
import CommentData from "./interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import GitHubReposInvoker from "./gitHubReposInvoker.js";
import Logger from "../utilities/logger.js";
import PullRequestDetailsInterface from "./interfaces/pullRequestDetailsInterface.js";
import ReposInvokerInterface from "./reposInvokerInterface.js";
import RunnerInvoker from "../runners/runnerInvoker.js";
import { singleton } from "tsyringe";

/**
 * A class for invoking repository functionality with any underlying repository store.
 */
@singleton()
export default class ReposInvoker implements ReposInvokerInterface {
  private readonly _azureReposInvoker: AzureReposInvoker;
  private readonly _gitHubReposInvoker: GitHubReposInvoker;
  private readonly _logger: Logger;

  private _reposInvoker: ReposInvokerInterface | undefined;

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

  public async isAccessTokenAvailable(): Promise<string | null> {
    this._logger.logDebug("* ReposInvoker.isAccessTokenAvailable()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.isAccessTokenAvailable();
  }

  public async getTitleAndDescription(): Promise<PullRequestDetailsInterface> {
    this._logger.logDebug("* ReposInvoker.getTitleAndDescription()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.getTitleAndDescription();
  }

  public async getComments(): Promise<CommentData> {
    this._logger.logDebug("* ReposInvoker.getComments()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.getComments();
  }

  public async setTitleAndDescription(
    title: string | null,
    description: string | null,
  ): Promise<void> {
    this._logger.logDebug("* ReposInvoker.setTitleAndDescription()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.setTitleAndDescription(title, description);
  }

  public async createComment(
    content: string,
    fileName: string | null,
    status: CommentThreadStatus,
    isFileDeleted?: boolean,
  ): Promise<void> {
    this._logger.logDebug("* ReposInvoker.createComment()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.createComment(content, fileName, status, isFileDeleted);
  }

  public async updateComment(
    commentThreadId: number,
    content: string | null,
    status: CommentThreadStatus | null,
  ): Promise<void> {
    this._logger.logDebug("* ReposInvoker.updateComment()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.updateComment(commentThreadId, content, status);
  }

  public async deleteCommentThread(commentThreadId: number): Promise<void> {
    this._logger.logDebug("* ReposInvoker.deleteCommentThread()");

    const reposInvoker: ReposInvokerInterface = this.getReposInvoker();
    return reposInvoker.deleteCommentThread(commentThreadId);
  }

  private getReposInvoker(): ReposInvokerInterface {
    this._logger.logDebug("* ReposInvoker.getReposInvoker()");

    if (typeof this._reposInvoker !== "undefined") {
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
}
