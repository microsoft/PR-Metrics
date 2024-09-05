/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "octokit";

const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a request to delete a review comment for a GitHub pull request review.
 */
type DeleteReviewCommentResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.pulls.deleteReviewComment
>;
export default DeleteReviewCommentResponse;
