/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing an error thrown while interacting with the repos.
 */
export default interface ReposError extends Error {
  /**
   * The error status code accessed via `status`.
   */
  status: number | undefined

  /**
   * The error status code accessed via `statusCode`.
   */
  statusCode: number | undefined

  /**
   * The internal error message.
   */
  internalMessage: string
}
