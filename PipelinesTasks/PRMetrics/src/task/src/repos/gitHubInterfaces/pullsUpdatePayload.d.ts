// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface representing pull request details.
 */
export default interface PullsGetPayload {
  owner: string
  repo: string
  pull_number: number
  title?: string
  body?: string
}
