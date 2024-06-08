/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An error object containing a status code.
 */
export default class ErrorWithStatus extends Error {
  /**
   * The error status code accessed via `status`.
   */
  public status: number | undefined

  /**
   * The error status code accessed via `statusCode`.
   */
  public statusCode: number | undefined
}
