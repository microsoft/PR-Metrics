/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  private _metricsCommentThreadId: number | null = null;
  private _metricsCommentContent: string | null = null;
  private _metricsCommentThreadStatus: CommentThreadStatus | null = null;
  private _filesNotRequiringReview: string[] = [];
  private _deletedFilesNotRequiringReview: string[] = [];
  private _commentThreadsRequiringDeletion: number[] = [];

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param filesNotRequiringReview The collection of files not requiring review to which to add a comment.
   * @param deletedFilesNotRequiringReview The collection of deleted files not requiring review to which to add a comment.
   */
  public constructor(
    filesNotRequiringReview: string[],
    deletedFilesNotRequiringReview: string[],
  ) {
    this._filesNotRequiringReview = filesNotRequiringReview;
    this._deletedFilesNotRequiringReview = deletedFilesNotRequiringReview;
  }

  /**
   * Gets the ID of the metrics comment thread.
   * @returns The ID of the metrics comment thread.
   */
  public get metricsCommentThreadId(): number | null {
    return this._metricsCommentThreadId;
  }

  /**
   * Sets the ID of the metrics comment thread.
   * @param value The ID of the metrics comment thread.
   */
  public set metricsCommentThreadId(value: number | null) {
    this._metricsCommentThreadId = value;
  }

  /**
   * Gets the content of the comment in the metrics comment thread.
   * @returns The content of the comment in the metrics comment thread.
   */
  public get metricsCommentContent(): string | null {
    return this._metricsCommentContent;
  }

  /**
   * Sets the content of the comment in the metrics comment thread.
   * @param value The content of the comment in the metrics comment thread.
   */
  public set metricsCommentContent(value: string | null) {
    this._metricsCommentContent = value;
  }

  /**
   * Gets the status of the metrics comment thread.
   * @returns The status of the metrics comment thread.
   */
  public get metricsCommentThreadStatus(): CommentThreadStatus | null {
    return this._metricsCommentThreadStatus;
  }

  /**
   * Sets the status of the metrics comment thread.
   * @param value The status of the metrics comment thread.
   */
  public set metricsCommentThreadStatus(value: CommentThreadStatus | null) {
    this._metricsCommentThreadStatus = value;
  }

  /**
   * Gets the collection of files not requiring review to which to add a comment.
   * @returns The collection of files not requiring review.
   */
  public get filesNotRequiringReview(): string[] {
    return this._filesNotRequiringReview;
  }

  /**
   * Sets the collection of files not requiring review to which to add a comment.
   * @param value The collection of files not requiring review.
   */
  public set filesNotRequiringReview(value: string[]) {
    this._filesNotRequiringReview = value;
  }

  /**
   * Gets the collection of deleted files not requiring review to which to add a comment.
   * @returns The collection of files not requiring review.
   */
  public get deletedFilesNotRequiringReview(): string[] {
    return this._deletedFilesNotRequiringReview;
  }

  /**
   * Sets the collection of deleted files not requiring review to which to add a comment.
   * @param value The collection of files not requiring review.
   */
  public set deletedFilesNotRequiringReview(value: string[]) {
    this._deletedFilesNotRequiringReview = value;
  }

  /**
   * Gets the collection of comment thread IDs requiring deletion now that the associated file requires review.
   * @returns The collection of comment thread IDs requiring deletion.
   */
  public get commentThreadsRequiringDeletion(): number[] {
    return this._commentThreadsRequiringDeletion;
  }

  /**
   * Set the collection of comment thread IDs requiring deletion now that the associated file requires review.
   * @param value The collection of comment thread IDs requiring deletion.
   */
  public set commentThreadsRequiringDeletion(value: number[]) {
    this._commentThreadsRequiringDeletion = value;
  }
}
