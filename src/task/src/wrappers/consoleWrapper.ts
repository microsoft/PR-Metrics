/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { singleton } from "tsyringe";

/**
 * A wrapper around the console, to facilitate testability.
 */

@singleton()
export default class ConsoleWrapper {
  /**
   * Logs a message to `stdout` suffixed with a new line character.
   * @param message The optional message to log.
   * @param optionalParams Optional parameters to insert into the message.
   */
  public log(message: string, ...optionalParams: string[]): void {
     
    console.log(message, ...optionalParams);
  }
}
