/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as util from "node:util";
import { sanitizePlainTextForLogging } from "../utilities/logSanitizer.js";

/**
 * A wrapper around the console, to facilitate testability.
 */

export default class ConsoleWrapper {
  /**
   * Logs a sanitized message to `stdout` suffixed with a new line character. Workflow-command prefixes are neutralized
   * and newline boundaries are replaced with spaces to prevent log injection.
   * @param message The message to log.
   * @param optionalParams Optional parameters to insert into the message.
   */
  public log(message: string, ...optionalParams: string[]): void {
    const formattedMessage: string = util.format(message, ...optionalParams);
    const sanitizedMessage: string =
      sanitizePlainTextForLogging(formattedMessage);
    /* eslint-disable-next-line no-console -- This is a wrapper around the console. */
    console.log(sanitizedMessage);
  }
}
