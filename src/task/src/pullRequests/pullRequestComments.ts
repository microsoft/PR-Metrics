/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  metricsCommentMarker,
  noReviewRequiredCommentMarker,
} from "../utilities/constants.js";
import type CodeMetrics from "../metrics/codeMetrics.js";
import type CodeMetricsData from "../metrics/codeMetricsData.js";
import type CommentData from "../repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type FileCommentData from "../repos/interfaces/fileCommentData.js";
import type Inputs from "../metrics/inputs.js";
import type Logger from "../utilities/logger.js";
import type PullRequestComment from "../repos/interfaces/pullRequestCommentData.js";
import PullRequestCommentsData from "./pullRequestCommentsData.js";
import type ReposInvoker from "../repos/reposInvoker.js";
import type RunnerInvoker from "../runners/runnerInvoker.js";

/**
 * A class for managing pull requests comments.
 */
export default class PullRequestComments {
  private readonly _codeMetrics: CodeMetrics;
  private readonly _inputs: Inputs;
  private readonly _logger: Logger;
  private readonly _reposInvoker: ReposInvoker;
  private readonly _runnerInvoker: RunnerInvoker;

  /**
   * Initializes a new instance of the `PullRequestComments` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param reposInvoker The repos invoker logic.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(
    codeMetrics: CodeMetrics,
    inputs: Inputs,
    logger: Logger,
    reposInvoker: ReposInvoker,
    runnerInvoker: RunnerInvoker,
  ) {
    this._codeMetrics = codeMetrics;
    this._inputs = inputs;
    this._logger = logger;
    this._reposInvoker = reposInvoker;
    this._runnerInvoker = runnerInvoker;
  }

  /**
   * Gets the comment to add to files within the pull request that do not require review.
   * @returns The comment to add to files that do not require review.
   */
  public get noReviewRequiredComment(): string {
    this._logger.logDebug("* PullRequestComments.noReviewRequiredComment");

    return `${this._runnerInvoker.loc(
      "pullRequests.pullRequestComments.noReviewRequiredComment",
    )}\n${noReviewRequiredCommentMarker}`;
  }

  private static isOwnedComment(
    comment: PullRequestComment,
    authenticatedUserId: number | null,
  ): boolean {
    /*
     * Where the repository provider does not expose the author of a comment, ownership cannot be determined and the
     * content-based matching used prior to the introduction of ownership checks is retained.
     */
    if (authenticatedUserId === null) {
      return true;
    }

    return comment.authorId === authenticatedUserId;
  }

  private static removeFileFromReviewLists(
    result: PullRequestCommentsData,
    fileName: string,
  ): boolean {
    const notFound = -1;
    let removed = false;

    const fileIndex: number = result.filesNotRequiringReview.indexOf(fileName);
    if (fileIndex !== notFound) {
      result.filesNotRequiringReview.splice(fileIndex, 1);
      removed = true;
    }

    const deletedFileIndex: number =
      result.deletedFilesNotRequiringReview.indexOf(fileName);
    if (deletedFileIndex !== notFound) {
      result.deletedFilesNotRequiringReview.splice(deletedFileIndex, 1);
      removed = true;
    }

    return removed;
  }

  /**
   * Gets the data used for constructing the comment within the pull request.
   * @returns A promise containing the data used for constructing the comment within the pull request.
   */
  public async getCommentData(): Promise<PullRequestCommentsData> {
    this._logger.logDebug("* PullRequestComments.getCommentData()");

    const filesNotRequiringReview: string[] =
      await this._codeMetrics.getFilesNotRequiringReview();
    const deletedFilesNotRequiringReview: string[] =
      await this._codeMetrics.getDeletedFilesNotRequiringReview();
    let result: PullRequestCommentsData = new PullRequestCommentsData(
      filesNotRequiringReview,
      deletedFilesNotRequiringReview,
    );

    const comments: CommentData = await this._reposInvoker.getComments();

    // Only comments created by the principal associated with the access token in use are considered.
    result = this.getMetricsCommentData(result, comments);
    result = this.getFilesRequiringCommentUpdates(result, comments);

    return result;
  }

  /**
   * Gets the comment to add to the comment thread.
   * @returns A promise containing the comment to add to the comment thread.
   */
  public async getMetricsComment(): Promise<string> {
    this._logger.logDebug("* PullRequestComments.getMetricsComment()");

    const metrics: CodeMetricsData = await this._codeMetrics.getMetrics();

    const parts: string[] = [
      `${this._runnerInvoker.loc("pullRequests.pullRequestComments.commentTitle")}\n`,
      await this.addCommentSizeStatus(),
      await this.addCommentTestStatus(),
      `||${this._runnerInvoker.loc("pullRequests.pullRequestComments.tableLines")}\n`,
      "-|-:\n",
      this.addCommentMetrics(
        this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.tableProductCode",
        ),
        metrics.productCode,
        false,
      ),
      this.addCommentMetrics(
        this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.tableTestCode",
        ),
        metrics.testCode,
        false,
      ),
      this.addCommentMetrics(
        this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.tableSubtotal",
        ),
        metrics.subtotal,
        true,
      ),
      this.addCommentMetrics(
        this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.tableIgnoredCode",
        ),
        metrics.ignoredCode,
        false,
      ),
      this.addCommentMetrics(
        this._runnerInvoker.loc("pullRequests.pullRequestComments.tableTotal"),
        metrics.total,
        true,
      ),
      "\n",
      this._runnerInvoker.loc("pullRequests.pullRequestComments.commentFooter"),
      `\n${metricsCommentMarker}`,
    ];

    return parts.join("");
  }

  /**
   * Gets the status to which to update the comment thread.
   * @returns A promise containing the status to which to update the comment thread.
   */
  public async getMetricsCommentStatus(): Promise<CommentThreadStatus> {
    this._logger.logDebug("* PullRequestComments.getMetricsCommentStatus()");

    if (this._inputs.alwaysCloseComment) {
      return CommentThreadStatus.Closed;
    }

    if (await this._codeMetrics.isSmall()) {
      const isSufficientlyTested: boolean | null =
        await this._codeMetrics.isSufficientlyTested();

      if (isSufficientlyTested ?? true) {
        return CommentThreadStatus.Closed;
      }
    }

    return CommentThreadStatus.Active;
  }

  private getMetricsCommentData(
    result: PullRequestCommentsData,
    comments: CommentData,
  ): PullRequestCommentsData {
    this._logger.logDebug("* PullRequestComments.getMetricsCommentData()");

    const matchingComments: PullRequestComment[] =
      comments.pullRequestComments.filter(
        (comment: PullRequestComment): boolean =>
          PullRequestComments.isOwnedComment(
            comment,
            comments.authenticatedUserId,
          ) &&
          this.isMetricsComment(comment.content, comments.authenticatedUserId),
      );

    if (matchingComments.length > 1) {
      this._logger.logWarning(
        this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.multipleMetricsComments",
          matchingComments.length.toLocaleString(),
        ),
      );
      result.isMetricsCommentAmbiguous = true;
      return result;
    }

    const [comment] = matchingComments;
    if (typeof comment === "undefined") {
      return result;
    }

    result.metricsCommentThreadId = comment.id;
    result.metricsCommentContent = comment.content;
    result.metricsCommentThreadStatus = comment.status;
    return result;
  }

  private getFilesRequiringCommentUpdates(
    result: PullRequestCommentsData,
    comments: CommentData,
  ): PullRequestCommentsData {
    this._logger.logDebug(
      "* PullRequestComments.getFilesRequiringCommentUpdates()",
    );

    const matchingComments: FileCommentData[] = comments.fileComments.filter(
      (comment: FileCommentData): boolean =>
        PullRequestComments.isOwnedComment(
          comment,
          comments.authenticatedUserId,
        ) &&
        this.isNoReviewRequiredComment(
          comment.content,
          comments.authenticatedUserId,
        ),
    );

    const commentsByFile: Map<string, FileCommentData> = new Map<
      string,
      FileCommentData
    >();
    const duplicateFiles: Set<string> = new Set<string>();
    for (const comment of matchingComments) {
      if (commentsByFile.has(comment.fileName)) {
        duplicateFiles.add(comment.fileName);
      } else {
        commentsByFile.set(comment.fileName, comment);
      }
    }

    for (const [fileName, comment] of commentsByFile) {
      const isFilePresent: boolean =
        PullRequestComments.removeFileFromReviewLists(result, fileName);

      if (duplicateFiles.has(fileName)) {
        const commentCount: string = matchingComments
          .filter(
            (value: FileCommentData): boolean => value.fileName === fileName,
          )
          .length.toLocaleString();
        this._logger.logWarning(
          this._runnerInvoker.loc(
            "pullRequests.pullRequestComments.multipleNoReviewRequiredComments",
            fileName,
            commentCount,
          ),
        );
        continue;
      }

      if (!isFilePresent) {
        result.commentThreadsRequiringDeletion.push(comment.id);
      }
    }

    return result;
  }

  private isMetricsComment(
    content: string,
    authenticatedUserId: number | null,
  ): boolean {
    this._logger.logDebug("* PullRequestComments.isMetricsComment()");

    const titlePrefix = `${this._runnerInvoker.loc("pullRequests.pullRequestComments.commentTitle")}\n`;

    /*
     * Without a verified identity (e.g. on Azure DevOps), ownership cannot be established, so the hidden marker –
     * which is merely a content substring – must not be trusted to identify the comment. Only the legacy fixed
     * title prefix, which was always relied upon prior to marker introduction, is used in this case.
     */
    if (authenticatedUserId === null) {
      return content.startsWith(titlePrefix);
    }

    return (
      content.includes(metricsCommentMarker) || content.startsWith(titlePrefix)
    );
  }

  private isNoReviewRequiredComment(
    content: string,
    authenticatedUserId: number | null,
  ): boolean {
    this._logger.logDebug("* PullRequestComments.isNoReviewRequiredComment()");

    const legacyContent: string = this._runnerInvoker.loc(
      "pullRequests.pullRequestComments.noReviewRequiredComment",
    );

    /*
     * Without a verified identity, the hidden marker must not be used for substring matching, as any third-party
     * comment merely containing it could otherwise be mistaken for one created by this task. Instead, only exact
     * equality is used, which still recognizes both the legacy visible body and the new marked body generated by
     * this task, without matching arbitrary surrounding content that happens to include the marker.
     */
    if (authenticatedUserId === null) {
      return (
        content === legacyContent ||
        content === `${legacyContent}\n${noReviewRequiredCommentMarker}`
      );
    }

    return (
      content.includes(noReviewRequiredCommentMarker) ||
      content === legacyContent
    );
  }

  private async addCommentSizeStatus(): Promise<string> {
    this._logger.logDebug("* PullRequestComments.addCommentSizeStatus()");

    let result = "";
    if (await this._codeMetrics.isSmall()) {
      result += this._runnerInvoker.loc(
        "pullRequests.pullRequestComments.smallPullRequestComment",
      );
    } else {
      const size: string = (
        this._inputs.baseSize * this._inputs.growthRate
      ).toLocaleString();
      result += this._runnerInvoker.loc(
        "pullRequests.pullRequestComments.largePullRequestComment",
        size,
      );
    }

    result += "\n";
    return result;
  }

  private async addCommentTestStatus(): Promise<string> {
    this._logger.logDebug("* PullRequestComments.addCommentTestStatus()");

    let result = "";
    const isSufficientlyTested: boolean | null =
      await this._codeMetrics.isSufficientlyTested();
    if (isSufficientlyTested !== null) {
      if (isSufficientlyTested) {
        result += this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.testsSufficientComment",
        );
      } else {
        result += this._runnerInvoker.loc(
          "pullRequests.pullRequestComments.testsInsufficientComment",
        );
      }

      result += "\n";
    }

    return result;
  }

  private addCommentMetrics(
    title: string,
    metric: number,
    highlight: boolean,
  ): string {
    this._logger.logDebug("* PullRequestComments.addCommentMetrics()");

    const surround: string = highlight ? "**" : "";

    let metricString = metric.toLocaleString();
    if (metricString === "0") {
      metricString = "-";
    }

    return `${surround}${title}${surround}|${surround}${metricString}${surround}\n`;
  }
}
