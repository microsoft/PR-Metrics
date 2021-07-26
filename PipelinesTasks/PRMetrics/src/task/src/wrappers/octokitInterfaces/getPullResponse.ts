// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Octokit } from 'octokit'
import { GetResponseTypeFromEndpointMethod } from '@octokit/types'

const octokit: Octokit = new Octokit()

/**
 * An interface representing the response from a get request to a GitHub pull request.
 */
type GetPullResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.pulls.get>
export default GetPullResponse
