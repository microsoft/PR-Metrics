/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "@octokit/rest";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Required for constructing concrete Octokit types.
const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a update request to a GitHub pull request.
 */
type UpdatePullResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.pulls.update
>;
export default UpdatePullResponse;
