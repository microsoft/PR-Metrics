// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'

/**
 * An interface representing a pull request comment.
 */
export default class PullRequestComment {
  private _id: number = 0
  private _status: CommentThreadStatus | undefined
  private _content: string | undefined
  private _file: string = ''

  public get id(): number {
    return this._id
  }

  public set id(value: number) {
    this._id = value
  }

  public get status(): CommentThreadStatus | undefined {
    return this._status
  }

  public set status(value: CommentThreadStatus | undefined) {
    this._status = value
  }

  public get content(): string | undefined {
    return this._content
  }

  public set content(value: string | undefined) {
    this._content = value
  }

  public get file(): string {
    return this._file
  }

  public set file(value: string) {
    this._file = value
  }
}
