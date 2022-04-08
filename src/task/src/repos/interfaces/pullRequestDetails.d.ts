// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface representing pull request details.
 */
export default interface PullRequestDetails {
  /**
   * The pull request title.
   */
  title: string

  /**
   * The pull request description.
   */
  description: string | undefined
}
