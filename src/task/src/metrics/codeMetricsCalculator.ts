/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type {
  CommentCreationInterface,
  default as CommentMutationInterface,
} from "./commentMutationInterface.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type GitInvoker from "../git/gitInvoker.js";
import type Logger from "../utilities/logger.js";
import type PullRequest from "../pullRequests/pullRequest.js";
import type PullRequestComments from "../pullRequests/pullRequestComments.js";
import type PullRequestCommentsData from "../pullRequests/pullRequestCommentsData.js";
import type PullRequestDetailsInterface from "../repos/interfaces/pullRequestDetailsInterface.js";
import type ReposInvoker from "../repos/reposInvoker.js";
import RunnerInvoker from "../runners/runnerInvoker.js";
import { maxCommentMutations } from "../utilities/constants.js";

/**
 * A class for calculating and updating the code metrics within pull requests.
 */
export default class CodeMetricsCalculator {
  private readonly _gitInvoker: GitInvoker;
  private readonly _logger: Logger;
  private readonly _pullRequest: PullRequest;
  private readonly _pullRequestComments: PullRequestComments;
  private readonly _reposInvoker: ReposInvoker;
  private readonly _runnerInvoker: RunnerInvoker;

  /**
   * Initializes a new instance of the `CodeMetricsCalculator` class.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param pullRequest The pull request modification logic.
   * @param pullRequestComments The pull request comments modification logic.
   * @param reposInvoker The repos invoker logic.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(
    gitInvoker: GitInvoker,
    logger: Logger,
    pullRequest: PullRequest,
    pullRequestComments: PullRequestComments,
    reposInvoker: ReposInvoker,
    runnerInvoker: RunnerInvoker,
  ) {
    this._gitInvoker = gitInvoker;
    this._logger = logger;
    this._pullRequest = pullRequest;
    this._pullRequestComments = pullRequestComments;
    this._reposInvoker = reposInvoker;
    this._runnerInvoker = runnerInvoker;
  }

  /**
   * Gets a message if the task should be skipped.
   * @returns `null` if the task should continue, or a message to be displayed if the task should be skipped.
   */
  public get shouldSkip(): string | null {
    this._logger.logDebug("* CodeMetricsCalculator.shouldSkip");

    if (!this._pullRequest.isPullRequest) {
      return this._runnerInvoker.loc(
        "metrics.codeMetricsCalculator.noPullRequest",
      );
    }

    const provider: boolean | string = this._pullRequest.isSupportedProvider;
    if (provider !== true) {
      return this._runnerInvoker.loc(
        "metrics.codeMetricsCalculator.unsupportedProvider",
        String(provider),
      );
    }

    return null;
  }

  /**
   * Gets a message if the task should be stopped.
   * @returns A promise containing `null` if the task should continue, or a message to be displayed if the task should be stopped.
   */
  public async shouldStop(): Promise<string | null> {
    this._logger.logDebug("* CodeMetricsCalculator.shouldStop()");

    const accessTokenAvailable: string | null =
      await this._reposInvoker.isAccessTokenAvailable();
    if (accessTokenAvailable !== null) {
      return accessTokenAvailable;
    }

    if (!(await this._gitInvoker.isGitRepo())) {
      return RunnerInvoker.isGitHub
        ? this._runnerInvoker.loc(
            "metrics.codeMetricsCalculator.noGitRepoGitHub",
          )
        : this._runnerInvoker.loc(
            "metrics.codeMetricsCalculator.noGitRepoAzureDevOps",
          );
    }

    if (!this._gitInvoker.isPullRequestIdAvailable()) {
      return RunnerInvoker.isGitHub
        ? this._runnerInvoker.loc(
            "metrics.codeMetricsCalculator.noPullRequestIdGitHub",
          )
        : this._runnerInvoker.loc(
            "metrics.codeMetricsCalculator.noPullRequestIdAzureDevOps",
          );
    }

    if (!(await this._gitInvoker.isGitHistoryAvailable())) {
      return RunnerInvoker.isGitHub
        ? this._runnerInvoker.loc(
            "metrics.codeMetricsCalculator.noGitHistoryGitHub",
          )
        : this._runnerInvoker.loc(
            "metrics.codeMetricsCalculator.noGitHistoryAzureDevOps",
          );
    }

    return null;
  }

  /**
   * Updates the pull request details.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async updateDetails(): Promise<void> {
    this._logger.logDebug("* CodeMetricsCalculator.updateDetails()");

    const details: PullRequestDetailsInterface =
      await this._reposInvoker.getTitleAndDescription();
    const updatedTitle: string | null = await this._pullRequest.getUpdatedTitle(
      details.title,
    );
    const updatedDescription: string | null =
      this._pullRequest.getUpdatedDescription(details.description);

    await this._reposInvoker.setTitleAndDescription(
      updatedTitle,
      updatedDescription,
    );
  }

  /**
   * Updates the pull request comments.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async updateComments(): Promise<void> {
    this._logger.logDebug("* CodeMetricsCalculator.updateComments()");

    const commentData: PullRequestCommentsData =
      await this._pullRequestComments.getCommentData();
    const mutations: CommentMutationInterface[] =
      await this.buildCommentMutations(commentData);

    if (mutations.length > maxCommentMutations) {
      const mutationCount: string = mutations.length.toLocaleString();
      const maximumMutationCount: string = maxCommentMutations.toLocaleString();
      throw new Error(
        this._runnerInvoker.loc(
          "metrics.codeMetricsCalculator.tooManyCommentMutations",
          mutationCount,
          maximumMutationCount,
        ),
      );
    }

    await this.performCommentMutations(mutations);
  }

  private async buildCommentMutations(
    commentData: PullRequestCommentsData,
  ): Promise<CommentMutationInterface[]> {
    this._logger.logDebug("* CodeMetricsCalculator.buildCommentMutations()");

    const result: Map<string, CommentMutationInterface> = new Map<
      string,
      CommentMutationInterface
    >();

    const metricsCommentMutation: CommentMutationInterface | null =
      await this.getMetricsCommentMutation(commentData);
    if (metricsCommentMutation !== null) {
      result.set("metrics", metricsCommentMutation);
    }

    for (const commentThreadId of commentData.commentThreadsRequiringDeletion) {
      result.set(`delete:${String(commentThreadId)}`, {
        commentThreadId,
        operation: "delete",
      });
    }

    for (const fileName of commentData.filesNotRequiringReview) {
      result.set(
        `create:${fileName}`,
        this.getNoReviewRequiredCommentMutation(fileName, false),
      );
    }

    for (const fileName of commentData.deletedFilesNotRequiringReview) {
      result.set(
        `create:${fileName}`,
        this.getNoReviewRequiredCommentMutation(fileName, true),
      );
    }

    return Array.from(result.values());
  }

  private async getMetricsCommentMutation(
    commentData: PullRequestCommentsData,
  ): Promise<CommentMutationInterface | null> {
    this._logger.logDebug(
      "* CodeMetricsCalculator.getMetricsCommentMutation()",
    );

    if (commentData.isMetricsCommentAmbiguous) {
      return null;
    }

    const content: string = await this._pullRequestComments.getMetricsComment();
    const status: CommentThreadStatus =
      await this._pullRequestComments.getMetricsCommentStatus();
    if (commentData.metricsCommentThreadId === null) {
      return {
        content,
        fileName: null,
        isFileDeleted: false,
        operation: "create",
        status,
      };
    }

    const updatedContent: string | null =
      commentData.metricsCommentContent === content ? null : content;
    const updatedStatus: CommentThreadStatus | null =
      commentData.metricsCommentThreadStatus === status ? null : status;
    if (updatedContent === null && updatedStatus === null) {
      return null;
    }

    return {
      commentThreadId: commentData.metricsCommentThreadId,
      content: updatedContent,
      operation: "update",
      status: updatedStatus,
    };
  }

  private getNoReviewRequiredCommentMutation(
    fileName: string,
    isFileDeleted: boolean,
  ): CommentMutationInterface {
    this._logger.logDebug(
      "* CodeMetricsCalculator.getNoReviewRequiredCommentMutation()",
    );

    return {
      content: this._pullRequestComments.noReviewRequiredComment,
      fileName,
      isFileDeleted,
      operation: "create",
      status: CommentThreadStatus.Closed,
    };
  }

  private async performCommentMutations(
    mutations: CommentMutationInterface[],
  ): Promise<void> {
    this._logger.logDebug("* CodeMetricsCalculator.performCommentMutations()");

    const promises: Promise<void>[] = [];
    const fileCommentCreations: CommentCreationInterface[] = [];
    for (const mutation of mutations) {
      if (mutation.operation === "delete") {
        promises.push(
          this._reposInvoker.deleteCommentThread(mutation.commentThreadId),
        );
      } else if (mutation.operation === "update") {
        promises.push(
          this._reposInvoker.updateComment(
            mutation.commentThreadId,
            mutation.content,
            mutation.status,
          ),
        );
      } else if (mutation.fileName === null) {
        promises.push(
          this._reposInvoker.createComment(
            mutation.content,
            null,
            mutation.status,
          ),
        );
      } else {
        fileCommentCreations.push(mutation);
      }
    }

    await Promise.all(promises);

    /* eslint-disable no-await-in-loop -- Comment creation can cause problems when called in parallel on GitHub. Therefore, there must be a wait after each call to these APIs before continuing. */
    for (const mutation of fileCommentCreations) {
      await this._reposInvoker.createComment(
        mutation.content,
        mutation.fileName,
        mutation.status,
        mutation.isFileDeleted,
      );
    }
    /* eslint-enable no-await-in-loop */
  }
}
