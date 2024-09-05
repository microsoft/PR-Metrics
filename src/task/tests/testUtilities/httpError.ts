/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * A class representing a HTTP error.
 */
export default class HttpError extends Error {
  /**
   * Gets the name of the object type.
   */
  public name = "HttpError";

  /**
   * Gets the HTTP status code.
   */
  public status: number;

  /**
   * Gets the error message.
   */
  public message: string;

  /**
   * Initializes a new instance of the `HttpError` class.
   * @param status The HTTP status code.
   * @param message The error message.
   */
  public constructor(status: number, message: string) {
    super();

    this.status = status;
    this.message = message;
  }
}
