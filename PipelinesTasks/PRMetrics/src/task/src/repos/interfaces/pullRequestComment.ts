// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'

/**
 * A class representing a pull request comment.
 */
export default class PullRequestComment {
  private _id: number = 0
  private _status: CommentThreadStatus = CommentThreadStatus.Unknown
  private _content: string = ''

  /**
   * Gets the ID associated with the comment.
   * @returns The comment ID.
   */
  public get id (): number {
    return this._id
  }

  /**
   * Sets the ID associated with the comment.
   * @param value The comment ID.
   */
  public set id (value: number) {
    this._id = value
  }

  /**
   * Gets the status associated with the comment.
   * @returns The comment status.
   */
  public get status (): CommentThreadStatus {
    return this._status
  }

  /**
   * Sets the status associated with the comment.
   * @param value The comment status.
   */
  public set status (value: CommentThreadStatus) {
    this._status = value
  }

  /**
   * Gets the content (i.e., the text) associated with the comment.
   * @returns The comment content.
   */
  public get content (): string {
    return this._content
  }

  /**
   * Sets the content (i.e., the text) associated with the comment.
   * @param value The comment content.
   */
  public set content (value: string) {
    this._content = value
  }
}
