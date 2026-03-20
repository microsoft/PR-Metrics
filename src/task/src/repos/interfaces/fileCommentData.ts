/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type PullRequestCommentData from "./pullRequestCommentData.js";

/**
 * An interface representing a file comment.
 */
export default interface FileCommentData extends PullRequestCommentData {
  /**
   * The full file name and path associated with the comment.
   */
  readonly fileName: string;
}
