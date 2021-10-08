// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import BaseRequest from './baseRequest'

/**
 * An interface representing the base payload to send to a GitHub request.
 */
export default interface BasePullRequest extends BaseRequest {
  /**
   * The numeric ID of the pull request.
   */
  // eslint-disable-next-line camelcase
  pull_number: number
}
