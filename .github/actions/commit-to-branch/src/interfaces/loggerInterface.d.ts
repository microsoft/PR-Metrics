/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface for logging messages.
 */
export default interface LoggerInterface {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  debug: (message: string) => void;

  /**
   * Logs an informational message.
   * @param message The message to log.
   */
  info: (message: string) => void;
}
