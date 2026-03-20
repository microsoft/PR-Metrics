/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { CommentThreadStatus } from "../repos/interfaces/commentThreadStatus.js";

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
   * The collection of files not requiring review to which to add a comment.
   */
  public readonly filesNotRequiringReview: Set<string>;

  /**
   * The collection of deleted files not requiring review to which to add a comment.
   */
  public readonly deletedFilesNotRequiringReview: Set<string>;

  /**
   * The collection of comment thread IDs requiring deletion now that the associated file requires review.
   */
  public readonly commentThreadsRequiringDeletion: number[] = [];

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param filesNotRequiringReview The collection of files not requiring review to which to add a comment.
   * @param deletedFilesNotRequiringReview The collection of deleted files not requiring review to which to add a comment.
   */
  public constructor(
    filesNotRequiringReview: Set<string>,
    deletedFilesNotRequiringReview: Set<string>,
  ) {
    this.filesNotRequiringReview = filesNotRequiringReview;
    this.deletedFilesNotRequiringReview = deletedFilesNotRequiringReview;
  }
}
