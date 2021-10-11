// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import PullRequestComment from './pullRequestComment'

/**
 * A class representing a file comment.
 */
export default class FileComment extends PullRequestComment {
  private _file: string = ''

  /**
   * Initializes a new instance of the `FileComment` class.
   * @param id The optional comment ID.
   * @param status The optional status associated with the comment.
   * @param content The optional content (i.e., the text) associated with the comment.
   * @param file The optional full file path associated with the comment.
   */
  public constructor (id?: number, status?: CommentThreadStatus, content?: string, file?: string) {
    super(id, status, content)

    this._file = file || this._file
  }

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
