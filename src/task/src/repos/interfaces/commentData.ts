/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import FileCommentData from "./fileCommentData.js";
import PullRequestCommentData from "./pullRequestCommentData.js";

/**
 * A wrapper grouping types of pull request comments.
 */
export default class CommentData {
  public _pullRequestComments: PullRequestCommentData[] = [];
  public _fileComments: FileCommentData[] = [];

  /**
   * Gets the set of pull request comments, i.e. those comments associated with no file.
   * @returns The pull request comments.
   */
  public get pullRequestComments(): PullRequestCommentData[] {
    return this._pullRequestComments;
  }

  /**
   * Gets the set of file comments, i.e. those comments associated with a specific file.
   * @returns The file comments.
   */
  public get fileComments(): FileCommentData[] {
    return this._fileComments;
  }
}
