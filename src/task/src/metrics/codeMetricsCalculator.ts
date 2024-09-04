/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces";
import GitInvoker from "../git/gitInvoker";
import Logger from "../utilities/logger";
import PullRequest from "../pullRequests/pullRequest";
import PullRequestComments from "../pullRequests/pullRequestComments";
import PullRequestCommentsData from "../pullRequests/pullRequestCommentsData";
import PullRequestDetailsInterface from "../repos/interfaces/pullRequestDetailsInterface";
import ReposInvoker from "../repos/reposInvoker";
import RunnerInvoker from "../runners/runnerInvoker";
import { injectable } from "tsyringe";

/**
 * A class for calculating and updating the code metrics within pull requests.
 */
@injectable()
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

    const promises: Promise<void>[] = [];

    const commentData: PullRequestCommentsData =
      await this._pullRequestComments.getCommentData();
    promises.push(this.updateMetricsComment(commentData));

    for (const commentThreadId of commentData.commentThreadsRequiringDeletion) {
      promises.push(this._reposInvoker.deleteCommentThread(commentThreadId));
    }

    await Promise.all(promises);

    /* eslint-disable no-await-in-loop -- Comment creation can cause problems when called in parallel on GitHub. Therefore, there must be a wait after each call to these APIs before continuing. */
    for (const fileName of commentData.filesNotRequiringReview) {
      await this.updateNoReviewRequiredComment(fileName, false);
    }

    for (const fileName of commentData.deletedFilesNotRequiringReview) {
      await this.updateNoReviewRequiredComment(fileName, true);
    }
    /* eslint-enable no-await-in-loop */
  }

  private async updateMetricsComment(
    commentData: PullRequestCommentsData,
  ): Promise<void> {
    this._logger.logDebug("* CodeMetricsCalculator.updateMetricsComment()");

    const content: string = await this._pullRequestComments.getMetricsComment();
    const status: CommentThreadStatus =
      await this._pullRequestComments.getMetricsCommentStatus();
    if (commentData.metricsCommentThreadId === null) {
      await this._reposInvoker.createComment(content, null, status);
    } else {
      await this._reposInvoker.updateComment(
        commentData.metricsCommentThreadId,
        commentData.metricsCommentContent !== content ? content : null,
        commentData.metricsCommentThreadStatus !== status ? status : null,
      );
    }
  }

  private async updateNoReviewRequiredComment(
    fileName: string,
    isFileDeleted: boolean,
  ): Promise<void> {
    this._logger.logDebug(
      "* CodeMetricsCalculator.updateNoReviewRequiredComment()",
    );

    await this._reposInvoker.createComment(
      this._pullRequestComments.noReviewRequiredComment,
      fileName,
      CommentThreadStatus.Closed,
      isFileDeleted,
    );
  }
}
