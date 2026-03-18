/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a request to list the commits for a GitHub pull request review.
 */
type ListCommitsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"]["response"];
export default ListCommitsResponse;
