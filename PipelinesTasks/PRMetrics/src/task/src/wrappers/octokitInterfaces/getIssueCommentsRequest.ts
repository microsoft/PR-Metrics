// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import BaseRequest from './baseRequest'

/**
 * An interface representing the payload to send to get the issue comments for a GitHub pull request review.
 */
export default interface GetIssueCommentsRequest extends BaseRequest {
  /**
   * The numeric ID of the pull request.
   */
  // eslint-disable-next-line camelcase
  issue_number: number
}
