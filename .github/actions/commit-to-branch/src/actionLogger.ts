/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { debug, info } from "@actions/core";
import type LoggerInterface from "./interfaces/loggerInterface.js";

/**
 * A class for logging messages via the GitHub Actions toolkit.
 */
export default class ActionLogger implements LoggerInterface {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public debug(message: string): void {
    debug(message);
  }

  /**
   * Logs an informational message.
   * @param message The message to log.
   */
  public info(message: string): void {
    info(message);
  }
}
