/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "octokit";

const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a request to update an issue comment for a GitHub pull request review.
 */
type UpdateIssueCommentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.issues.updateComment
>;
export default UpdateIssueCommentResponse;
