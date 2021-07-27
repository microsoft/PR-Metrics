// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A class representing data about the a pull request comment thread and all of its comments.
 */
export default class PullRequestCommentsThread {
  private readonly _threadId: number
  private _commentIds: number[] = []

  /**
   * Initializes a new instance of the `PullRequestCommentsThread` class.
   * @param threadId The The ID of the comment thread.
   */
  public constructor (threadId: number) {
    this._threadId = threadId
  }

  /**
   * Gets the ID of the comment thread.
   * @returns The ID of the comment thread.
   */
  public get threadId (): number {
    return this._threadId
  }

  /**
   * Gets the IDs of all comments on the thread.
   * @returns The IDs of the comments.
   */
  public get commentIds (): number[] {
    return this._commentIds
  }

  /**
   * Sets the IDs of all comments on the thread.
   * @param value The IDs of the comments.
   */
  public set commentIds (value: number[]) {
    this._commentIds = value
  }
}
