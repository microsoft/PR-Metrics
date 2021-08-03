// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import BasePullRequest from './basePullRequest'

/**
 * An interface representing the payload to send to update a GitHub pull request.
 */
export default interface UpdatePullRequest extends BasePullRequest {
  /**
   * The optional value to which to set the title.
   */
  title?: string

  /**
   * The optional value to which to set the body/description.
   */
  body?: string
}
