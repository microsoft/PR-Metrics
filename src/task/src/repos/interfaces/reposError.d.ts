/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing an error thrown while interacting with the repos.
 */
export default interface ReposError extends Error {
  /**
   * The HTTP status code.
   */
  status: number | undefined

  /**
   * The HTTP status code.
   */
  statusCode: number

  /**
   * The internal error message.
   */
  internalMessage: string
}
