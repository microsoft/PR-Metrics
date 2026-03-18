/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a get-comments request for a GitHub pull request review.
 */
type GetReviewCommentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"];
export default GetReviewCommentsResponse;
