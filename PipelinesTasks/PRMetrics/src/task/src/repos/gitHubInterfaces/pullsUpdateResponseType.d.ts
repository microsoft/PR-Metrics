// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Octokit } from 'octokit'
import { GetResponseTypeFromEndpointMethod } from '@octokit/types'

const octokit = new Octokit()

/**
 * An interface representing pull request details.
 */
type PullsUpdateResponseType = GetResponseTypeFromEndpointMethod<typeof octokit.rest.pulls.update>
export default PullsUpdateResponseType
