/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from "../repos/interfaces/commentThreadStatus.js";
import GitInvoker from "../git/gitInvoker.js";
import Logger from "../utilities/logger.js";
import PullRequest from "../pullRequests/pullRequest.js";
import PullRequestComments from "../pullRequests/pullRequestComments.js";
import type PullRequestCommentsData from "../pullRequests/pullRequestCommentsData.js";
import type PullRequestDetailsInterface from "../repos/interfaces/pullRequestDetailsInterface.js";
import ReposInvoker from "../repos/reposInvoker.js";
import RunnerInvoker from "../runners/runnerInvoker.js";

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
      return this.platformLoc(
        "metrics.codeMetricsCalculator.noGitRepoGitHub",
        "metrics.codeMetricsCalculator.noGitRepoAzureDevOps",
      );
    }

    if (!this._gitInvoker.isPullRequestIdAvailable()) {
      return this.platformLoc(
        "metrics.codeMetricsCalculator.noPullRequestIdGitHub",
        "metrics.codeMetricsCalculator.noPullRequestIdAzureDevOps",
      );
    }

    if (!(await this._gitInvoker.isGitHistoryAvailable())) {
      return this.platformLoc(
        "metrics.codeMetricsCalculator.noGitHistoryGitHub",
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
    await Promise.all([
      this.updateMetricsComment(commentData),
      ...commentData.commentThreadsRequiringDeletion.map(
        async (commentThreadId) =>
          this._reposInvoker.deleteCommentThread(commentThreadId),
      ),
    ]);

    /* eslint-disable no-await-in-loop -- Comment creation can cause problems when called in parallel on GitHub. Therefore, there must be a wait after each call to these APIs before continuing. */
    const noReviewComment: string =
      this._pullRequestComments.noReviewRequiredComment;
    for (const fileName of commentData.filesNotRequiringReview) {
      await this.updateNoReviewRequiredComment(noReviewComment, fileName, false);
    }

    for (const fileName of commentData.deletedFilesNotRequiringReview) {
      await this.updateNoReviewRequiredComment(noReviewComment, fileName, true);
    }
    /* eslint-enable no-await-in-loop */
  }

  private async updateMetricsComment(
    commentData: PullRequestCommentsData,
  ): Promise<void> {
    this._logger.logDebug("* CodeMetricsCalculator.updateMetricsComment()");

    const [content, status]: [string, CommentThreadStatus] = await Promise.all([
      this._pullRequestComments.getMetricsComment(),
      this._pullRequestComments.getMetricsCommentStatus(),
    ]);
    if (commentData.metricsCommentThreadId === null) {
      await this._reposInvoker.createComment(content, null, status);
    } else {
      await this._reposInvoker.updateComment(
        commentData.metricsCommentThreadId,
        commentData.metricsCommentContent === content ? null : content,
        commentData.metricsCommentThreadStatus === status ? null : status,
      );
    }
  }

  private async updateNoReviewRequiredComment(
    noReviewComment: string,
    fileName: string,
    isFileDeleted: boolean,
  ): Promise<void> {
    this._logger.logDebug(
      "* CodeMetricsCalculator.updateNoReviewRequiredComment()",
    );

    await this._reposInvoker.createComment(
      noReviewComment,
      fileName,
      CommentThreadStatus.closed,
      isFileDeleted,
    );
  }

  private platformLoc(gitHubKey: string, azureDevOpsKey: string): string {
    return RunnerInvoker.isGitHub
      ? this._runnerInvoker.loc(gitHubKey)
      : this._runnerInvoker.loc(azureDevOpsKey);
  }
}
