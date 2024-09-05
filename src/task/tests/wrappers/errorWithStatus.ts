/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ErrorWithStatusInterface from "../../src/repos/interfaces/errorWithStatusInterface";

/**
 * An error object containing a status code.
 */
export default class ErrorWithStatus
  extends Error
  implements ErrorWithStatusInterface
{
  /**
   * The error status code accessed via `status`.
   */
  public status: number | undefined;

  /**
   * The error status code accessed via `statusCode`.
   */
  public statusCode: number | undefined;

  /**
   * The internal error message.
   */
  public internalMessage: string | undefined;
}
