/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { GetResponseTypeFromEndpointMethod } from "@octokit/types";
import { Octokit } from "octokit";

const octokit: Octokit = new Octokit();

/**
 * An interface representing the response from a get request to a GitHub pull request.
 */
type GetPullResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.rest.pulls.get
>;
export default GetPullResponse;
