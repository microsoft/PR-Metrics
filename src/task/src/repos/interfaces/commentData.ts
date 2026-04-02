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
  public readonly pullRequestComments: PullRequestCommentData[] = [];
  public readonly fileComments: FileCommentData[] = [];
}
