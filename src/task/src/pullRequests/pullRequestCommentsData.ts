/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  private metricsCommentThreadIdInternal: number | null = null
  private metricsCommentContentInternal: string | null = null
  private metricsCommentThreadStatusInternal: CommentThreadStatus | null = null
  private filesNotRequiringReviewInternal: string[] = []
  private deletedFilesNotRequiringReviewInternal: string[] = []
  private commentThreadsRequiringDeletionInternal: number[] = []

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param filesNotRequiringReview The collection of files not requiring review to which to add a comment.
   * @param deletedFilesNotRequiringReview The collection of deleted files not requiring review to which to add a comment.
   */
  public constructor (filesNotRequiringReview: string[], deletedFilesNotRequiringReview: string[]) {
    this.filesNotRequiringReviewInternal = filesNotRequiringReview
    this.deletedFilesNotRequiringReviewInternal = deletedFilesNotRequiringReview
  }

  /**
   * Gets the ID of the metrics comment thread.
   * @returns The ID of the metrics comment thread.
   */
  public get metricsCommentThreadId (): number | null {
    return this.metricsCommentThreadIdInternal
  }

  /**
   * Sets the ID of the metrics comment thread.
   * @param value The ID of the metrics comment thread.
   */
  public set metricsCommentThreadId (value: number | null) {
    this.metricsCommentThreadIdInternal = value
  }

  /**
   * Gets the content of the comment in the metrics comment thread.
   * @returns The content of the comment in the metrics comment thread.
   */
  public get metricsCommentContent (): string | null {
    return this.metricsCommentContentInternal
  }

  /**
   * Sets the content of the comment in the metrics comment thread.
   * @param value The content of the comment in the metrics comment thread.
   */
  public set metricsCommentContent (value: string | null) {
    this.metricsCommentContentInternal = value
  }

  /**
   * Gets the status of the metrics comment thread.
   * @returns The status of the metrics comment thread.
   */
  public get metricsCommentThreadStatus (): CommentThreadStatus | null {
    return this.metricsCommentThreadStatusInternal
  }

  /**
   * Sets the status of the metrics comment thread.
   * @param value The status of the metrics comment thread.
   */
  public set metricsCommentThreadStatus (value: CommentThreadStatus | null) {
    this.metricsCommentThreadStatusInternal = value
  }

  /**
   * Gets the collection of files not requiring review to which to add a comment.
   * @returns The collection of files not requiring review.
   */
  public get filesNotRequiringReview (): string[] {
    return this.filesNotRequiringReviewInternal
  }

  /**
   * Sets the collection of files not requiring review to which to add a comment.
   * @param value The collection of files not requiring review.
   */
  public set filesNotRequiringReview (value: string[]) {
    this.filesNotRequiringReviewInternal = value
  }

  /**
   * Gets the collection of deleted files not requiring review to which to add a comment.
   * @returns The collection of files not requiring review.
   */
  public get deletedFilesNotRequiringReview (): string[] {
    return this.deletedFilesNotRequiringReviewInternal
  }

  /**
   * Sets the collection of deleted files not requiring review to which to add a comment.
   * @param value The collection of files not requiring review.
   */
  public set deletedFilesNotRequiringReview (value: string[]) {
    this.deletedFilesNotRequiringReviewInternal = value
  }

  /**
   * Gets the collection of comment thread IDs requiring deletion now that the associated file requires review.
   * @returns The collection of comment thread IDs requiring deletion.
   */
  public get commentThreadsRequiringDeletion (): number[] {
    return this.commentThreadsRequiringDeletionInternal
  }

  /**
   * Set the collection of comment thread IDs requiring deletion now that the associated file requires review.
   * @param value The collection of comment thread IDs requiring deletion.
   */
  public set commentThreadsRequiringDeletion (value: number[]) {
    this.commentThreadsRequiringDeletionInternal = value
  }
}
