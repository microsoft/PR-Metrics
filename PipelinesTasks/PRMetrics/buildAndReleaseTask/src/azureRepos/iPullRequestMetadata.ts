// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface representing pull request metadata.
 */
export default interface IPullRequestMetadata {
  /**
   * The metadata key.
   */
  key: string

  /**
   * The metadata value.
   */
  value: string | number | boolean
}
