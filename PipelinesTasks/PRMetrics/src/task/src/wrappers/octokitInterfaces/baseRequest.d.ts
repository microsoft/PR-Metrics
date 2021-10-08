// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface representing the base payload to send to a GitHub pull request.
 */
export default interface BaseRequest {
  /**
   * The repo owner.
   */
  owner: string

  /**
   * The repo name.
   */
  repo: string
}
