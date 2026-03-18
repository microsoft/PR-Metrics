/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a request to create an issue comment for a GitHub pull request review.
 */
type CreateIssueCommentResponse =
  Endpoints["POST /repos/{owner}/{repo}/issues/{issue_number}/comments"]["response"];
export default CreateIssueCommentResponse;
