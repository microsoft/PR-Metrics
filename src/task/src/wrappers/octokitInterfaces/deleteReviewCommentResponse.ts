/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a request to delete a review comment for a GitHub pull request review.
 */
type DeleteReviewCommentResponse =
  Endpoints["DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"]["response"];
export default DeleteReviewCommentResponse;
