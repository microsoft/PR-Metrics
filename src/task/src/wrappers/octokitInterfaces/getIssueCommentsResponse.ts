/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a get-issue-comments request for a GitHub pull request review.
 */
type GetIssueCommentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"]["response"];
export default GetIssueCommentsResponse;
