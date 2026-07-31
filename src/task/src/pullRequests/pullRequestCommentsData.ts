/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  /**
   * The ID of the metrics comment thread.
   */
  public metricsCommentThreadId: number | null = null;

  /**
   * The content of the comment in the metrics comment thread.
   */
  public metricsCommentContent: string | null = null;

  /**
   * The status of the metrics comment thread.
   */
  public metricsCommentThreadStatus: CommentThreadStatus | null = null;

  /**
   * A value indicating whether multiple metrics comments owned by the current principal were located, in which case
   * no metrics comment will be created or updated.
   */
  public isMetricsCommentAmbiguous = false;

  /**
   * The collection of files not requiring review to which to add a comment.
   */
  public filesNotRequiringReview: string[];

  /**
   * The collection of deleted files not requiring review to which to add a comment.
   */
  public deletedFilesNotRequiringReview: string[];

  /**
   * The collection of comment thread IDs requiring deletion now that the associated file requires review.
   */
  public commentThreadsRequiringDeletion: number[] = [];

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param filesNotRequiringReview The collection of files not requiring review to which to add a comment.
   * @param deletedFilesNotRequiringReview The collection of deleted files not requiring review to which to add a comment.
   */
  public constructor(
    filesNotRequiringReview: string[],
    deletedFilesNotRequiringReview: string[],
  ) {
    this.filesNotRequiringReview = filesNotRequiringReview;
    this.deletedFilesNotRequiringReview = deletedFilesNotRequiringReview;
  }
}
