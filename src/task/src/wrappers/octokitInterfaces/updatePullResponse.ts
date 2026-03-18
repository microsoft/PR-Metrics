/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/**
 * An interface representing the response from a update request to a GitHub pull request.
 */
type UpdatePullResponse =
  Endpoints["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"]["response"];
export default UpdatePullResponse;
