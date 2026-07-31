/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type FileCommentData from "./fileCommentData.js";
import type PullRequestCommentData from "./pullRequestCommentData.js";

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

  /**
   * The numeric ID of the principal associated with the access token in use, which is `null` if the repository
   * provider does not expose the author details required for determining comment ownership.
   */
  public authenticatedUserId: number | null = null;
}
