/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing an error object containing a status code.
 */
export default interface ErrorWithStatusInterface extends Error {
  /**
   * The error status code accessed via `status`.
   */
  status: number | null;

  /**
   * The error status code accessed via `statusCode`.
   */
  statusCode: number | null;

  /**
   * The internal error message.
   */
  internalMessage: string | null;
}
