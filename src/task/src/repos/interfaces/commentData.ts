/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type FileCommentData from "./fileCommentData.js";
import type PullRequestCommentData from "./pullRequestCommentData.js";

/**
 * An interface grouping types of pull request comments.
 */
export default interface CommentData {
  /**
   * The set of pull request comments, i.e. those comments associated with no file.
   */
  pullRequestComments: PullRequestCommentData[];

  /**
   * The set of file comments, i.e. those comments associated with a specific file.
   */
  fileComments: FileCommentData[];
}
