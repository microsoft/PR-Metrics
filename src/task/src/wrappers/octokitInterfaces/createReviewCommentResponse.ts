/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a request to create a review comment for a GitHub pull request review.
 */
type CreateReviewCommentResponse =
  Endpoints["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"];
export default CreateReviewCommentResponse;
