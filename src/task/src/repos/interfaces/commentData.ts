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
  /**
   * The set of pull request comments, i.e. those comments associated with no file.
   */
  public readonly pullRequestComments: PullRequestCommentData[] = [];

  /**
   * The set of file comments, i.e. those comments associated with a specific file.
   */
  public readonly fileComments: FileCommentData[] = [];
}
