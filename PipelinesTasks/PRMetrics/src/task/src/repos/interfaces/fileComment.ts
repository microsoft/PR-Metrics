// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import PullRequestComment from './pullRequestComment'

/**
 * A class representing a file comment.
 */
export default class FileComment extends PullRequestComment {
  private _file: string = ''

  /**
   * Gets the full file path associated with the comment.
   * @returns The full file path.
   */
  public get file (): string {
    return this._file
  }

  /**
   * Sets the full file path associated with the comment.
   * @param value The full file path.
   */
  public set file (value: string) {
    this._file = value
  }
}
