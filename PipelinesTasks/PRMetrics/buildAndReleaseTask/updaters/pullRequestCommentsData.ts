// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A class representing data about the pull request comments to be added and updated.
 */
export default class PullRequestCommentsData {
  private _isPresent: boolean = false
  private _threadId: number | null = null
  private _commentId: number | null = null
  private _ignoredFilesWithLinesAdded: string[] = []
  private _ignoredFilesWithoutLinesAdded: string[] = []

  /**
   * Initializes a new instance of the `PullRequestCommentsData` class.
   * @param ignoredFilesWithLinesAdded The collection of ignored files with added lines.
   * @param ignoredFilesWithoutLinesAdded The collection of ignored files without added lines.
   */
  public constructor (ignoredFilesWithLinesAdded: string[], ignoredFilesWithoutLinesAdded: string[]) {
    this._ignoredFilesWithLinesAdded = ignoredFilesWithLinesAdded
    this._ignoredFilesWithoutLinesAdded = ignoredFilesWithoutLinesAdded
  }

  /**
   * Gets a value indicating whether the metrics comment for the current iteration is already present.
   * @returns A value indicating whether the metrics comment for the current iteration is already present.
   */
  public get isPresent (): boolean {
    return this._isPresent
  }

  /**
   * Sets a value indicating whether the metrics comment for the current iteration is already present.
   * @param value A value indicating whether the metrics comment for the current iteration is already present.
   */
  public set isPresent (value: boolean) {
    this._isPresent = value
  }

  /**
   * Gets the ID of the metrics comment thread.
   * @returns The ID of the metrics comment thread.
   */
  public get threadId (): number | null {
    return this._threadId
  }

  /**
   * Sets the ID of the metrics comment thread.
   * @param value The ID of the metrics comment thread.
   */
  public set threadId (value: number | null) {
    this._threadId = value
  }

  /**
   * Gets the ID of the last comment in the metrics comment thread.
   * @returns The ID of the last comment in the metrics comment thread.
   */
  public get commentId (): number | null {
    return this._commentId
  }

  /**
   * Sets the ID of the last comment in the metrics comment thread.
   * @param value The ID of the last comment in the metrics comment thread.
   */
  public set commentId (value: number | null) {
    this._commentId = value
  }

  /**
   * Gets the collection of ignored files with added lines.
   * @returns The collection of ignored files with added lines.
   */
  public get ignoredFilesWithLinesAdded (): string[] {
    return this._ignoredFilesWithLinesAdded
  }

  /**
   * Sets the collection of ignored files with added lines.
   * @param value The collection of ignored files with added lines.
   */
  public set ignoredFilesWithLinesAdded (value: string[]) {
    this._ignoredFilesWithLinesAdded = value
  }

  /**
   * Gets the collection of ignored files without added lines.
   * @returns The collection of ignored files without added lines.
   */
  public get ignoredFilesWithoutLinesAdded (): string[] {
    return this._ignoredFilesWithoutLinesAdded
  }

  /**
   * Sets the collection of ignored files without added lines.
   * @param value The collection of ignored files without added lines.
   */
  public set ignoredFilesWithoutLinesAdded (value: string[]) {
    this._ignoredFilesWithoutLinesAdded = value
  }
}
