// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  private _isMetricsCommentPresent: boolean = false
  private _metricsCommentThreadId: number | null = null
  private _metricsCommentId: number | null = null
  private _ignoredFilesToComment: string[] = []

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param ignoredFilesToComment The collection of ignored files to which to add a comment indicating that they should be ignored.
   */
  public constructor (ignoredFilesToComment: string[]) {
    this._ignoredFilesToComment = ignoredFilesToComment
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
   * Gets the collection of ignored files to which to add a comment indicating that they should be ignored.
   * @returns The collection of ignored files.
   */
  public get ignoredFilesToComment (): string[] {
    return this._ignoredFilesToComment
  }

  /**
   * Sets the collection of ignored files to which to add a comment indicating that they should be ignored.
   * @param value The collection of ignored files.
   */
  public set ignoredFilesToComment (value: string[]) {
    this._ignoredFilesToComment = value
  }
}
