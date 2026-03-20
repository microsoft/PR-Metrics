/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { CommentThreadStatus } from "./commentThreadStatus.js";

/**
 * An interface representing a pull request comment.
 */
export default interface PullRequestCommentData {
  /**
   * The ID associated with the comment.
   */
  readonly id: number;

  /**
   * The content (i.e., the text) associated with the comment.
   */
  readonly content: string;

  /**
   * The status associated with the comment.
   */
  readonly status: CommentThreadStatus;
}
