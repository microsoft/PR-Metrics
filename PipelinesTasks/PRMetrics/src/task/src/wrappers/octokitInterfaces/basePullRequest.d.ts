// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface representing the base payload to send to a GitHub pull request.
 */
export default interface BasePullRequest {
  /**
   * The repo owner.
   */
  owner: string

  /**
   * The repo name.
   */
  repo: string

  /**
   * The numeric ID of the pull request.
   */
  // eslint-disable-next-line camelcase
  pull_number: number
}
