/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "octokit";

const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a get-issue-comments request for a GitHub pull request review.
 */
type GetIssueCommentsResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.issues.listComments
>;
export default GetIssueCommentsResponse;
