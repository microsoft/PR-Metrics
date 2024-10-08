/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "octokit";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required for constructing concrete Octokit types.
const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a request to create an issue comment for a GitHub pull request review.
 */
type CreateIssueCommentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.issues.createComment
>;
export default CreateIssueCommentResponse;
