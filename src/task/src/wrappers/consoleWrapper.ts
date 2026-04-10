/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * A wrapper around the console, to facilitate testability.
 */

export default class ConsoleWrapper {
  /**
   * Logs a sanitized message to `stdout` suffixed with a new line character. Newline and carriage-return characters in
   * the message are replaced with spaces to prevent log injection.
   * @param message The message to log.
   * @param optionalParams Optional parameters to insert into the message.
   */
  public log(message: string, ...optionalParams: string[]): void {
    const sanitizedMessage: string = message.replace(/[\n\r]/gu, " ");
    /* eslint-disable-next-line no-console -- This is a wrapper around the console. */
    console.log(sanitizedMessage, ...optionalParams);
  }
}
