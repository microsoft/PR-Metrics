// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GetResponseTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from 'octokit'

const octokit: Octokit = new Octokit()

/**
 * An interface representing the response from a request to create a review comment for a GitHub pull request review.
 */
type CreateReviewCommentResponse = GetResponseTypeFromEndpointMethod<typeof octokit.rest.pulls.createReviewComment>
export default CreateReviewCommentResponse
