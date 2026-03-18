/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a request to update an issue comment for a GitHub pull request review.
 */
type UpdateIssueCommentResponse =
  Endpoints["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"]["response"];
export default UpdateIssueCommentResponse;
