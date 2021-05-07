// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  private _isMetricsCommentPresent: boolean = false
  private _metricsCommentThreadId: number | null = null
  private _metricsCommentId: number | null = null
  private _filesNotRequiringReview: string[] = []
  private _deletedFilesNotRequiringReview: string[] = []

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param filesNotRequiringReview The collection of files not requiring review to which to add a comment.
   * @param deletedFilesNotRequiringReview The collection of deleted files not requiring review to which to add a comment.
   */
  public constructor (filesNotRequiringReview: string[], deletedFilesNotRequiringReview: string[]) {
    this._filesNotRequiringReview = filesNotRequiringReview
    this._deletedFilesNotRequiringReview = deletedFilesNotRequiringReview
  }

  /**
   * Gets a value indicating whether the metrics comment for the current iteration is already present.
   * @returns A value indicating whether the metrics comment for the current iteration is already present.
   */
  public get isMetricsCommentPresent (): boolean {
    return this._isMetricsCommentPresent
  }

  /**
   * Sets a value indicating whether the metrics comment for the current iteration is already present.
   * @param value A value indicating whether the metrics comment for the current iteration is already present.
   */
  public set isMetricsCommentPresent (value: boolean) {
    this._isMetricsCommentPresent = value
  }

  /**
   * Gets the ID of the metrics comment thread.
   * @returns The ID of the metrics comment thread.
   */
  public get metricsCommentThreadId (): number | null {
    return this._metricsCommentThreadId
  }

  /**
   * Sets the ID of the metrics comment thread.
   * @param value The ID of the metrics comment thread.
   */
  public set metricsCommentThreadId (value: number | null) {
    this._metricsCommentThreadId = value
  }

  /**
   * Gets the ID of the last comment in the metrics comment thread.
   * @returns The ID of the last comment in the metrics comment thread.
   */
  public get metricsCommentId (): number | null {
    return this._metricsCommentId
  }

  /**
   * Sets the ID of the last comment in the metrics comment thread.
   * @param value The ID of the last comment in the metrics comment thread.
   */
  public set metricsCommentId (value: number | null) {
    this._metricsCommentId = value
  }

  /**
   * Gets the collection of files not requiring review to which to add a comment.
   * @returns The collection of files not requiring review.
   */
  public get filesNotRequiringReview (): string[] {
    return this._filesNotRequiringReview
  }

  /**
   * Sets the collection of files not requiring review to which to add a comment.
   * @param value The collection of files not requiring review.
   */
  public set filesNotRequiringReview (value: string[]) {
    this._filesNotRequiringReview = value
  }

  /**
   * Gets the collection of deleted files not requiring review to which to add a comment.
   * @returns The collection of files not requiring review.
   */
  public get deletedFilesNotRequiringReview (): string[] {
    return this._deletedFilesNotRequiringReview
  }

  /**
   * Sets the collection of deleted files not requiring review to which to add a comment.
   * @param value The collection of files not requiring review.
   */
  public set deletedFilesNotRequiringReview (value: string[]) {
    this._deletedFilesNotRequiringReview = value
  }
}
