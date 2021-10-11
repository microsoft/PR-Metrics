// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import FileComment from './fileComment'
import PullRequestComment from './pullRequestComment'

/**
 * A wrapper grouping types of pull request comments.
 */
export default class PullRequestCommentGrouping {
  public _pullRequestComments: PullRequestComment[] = []
  public _fileComments: FileComment[] = []

  /**
   * Gets the set of pull request comments, i.e. those comments associated with no file.
   * @returns The pull request comments.
   */
  public get pullRequestComments (): PullRequestComment[] {
    return this._pullRequestComments
  }

  /**
   * Gets the set of file comments, i.e. those comments associated with a specific file.
   * @returns The file comments.
   */
  public get fileComments (): FileComment[] {
    return this._fileComments
  }
}
