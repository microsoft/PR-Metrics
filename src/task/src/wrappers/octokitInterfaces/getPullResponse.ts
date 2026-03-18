/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a get request to a GitHub pull request.
 */
type GetPullResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"];
export default GetPullResponse;
