/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing the response to an HTTP request.
 */
export default interface HttpResponseInterface {
  /**
   * The body of the response.
   */
  body: string;

  /**
   * The status code of the response.
   */
  status: number;
}
