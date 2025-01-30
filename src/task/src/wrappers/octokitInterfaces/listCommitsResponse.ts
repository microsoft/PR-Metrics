/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "octokit";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required for constructing concrete Octokit types.
const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a request to list the commits for a GitHub pull request review.
 */
type ListCommitsResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.pulls.listCommits
>;
export default ListCommitsResponse;
