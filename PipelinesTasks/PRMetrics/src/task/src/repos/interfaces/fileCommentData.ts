// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import PullRequestCommentData from './pullRequestCommentData'

/**
 * A class representing a file comment.
 */
export default class FileCommentData extends PullRequestCommentData {
  private _file: string

  /**
   * Initializes a new instance of the `FileCommentData` class.
   * @param id The optional comment ID.
   * @param content The optional content (i.e., the text) associated with the comment.
   * @param file The optional full file path associated with the comment.
   * @param status The optional status associated with the comment.
   */
  public constructor (id: number, content: string, file: string, status?: CommentThreadStatus) {
    super(id, content, status)

    this._file = file
  }

  /**
   * Gets the full file path associated with the comment.
   * @returns The full file path.
   */
  public get file (): string {
    return this._file
  }
}
