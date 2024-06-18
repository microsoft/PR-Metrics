/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { GetResponseTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from 'octokit'

const octokit: Octokit = new Octokit()

/**
 * An interface representing the response from a update request to a GitHub pull request.
 */
type UpdatePullResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.pulls.update>
export default UpdatePullResponse
