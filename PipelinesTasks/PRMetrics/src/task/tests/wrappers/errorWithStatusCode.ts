// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An error object containing a status code.
 */
export default class ErrorWithStatusCode extends Error {
  /**
   * The error status.
   */
  public status: number = 0

  /**
   * The error status code.
   */
  public statusCode: number = 0
}
