/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  public metricsCommentThreadId: number | null = null;
  public metricsCommentContent: string | null = null;
  public metricsCommentThreadStatus: CommentThreadStatus | null = null;
  public filesNotRequiringReview: string[];
  public deletedFilesNotRequiringReview: string[];
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
