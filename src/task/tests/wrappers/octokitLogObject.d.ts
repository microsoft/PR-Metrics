/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing the Octokit (GitHub) log object.
 */
export default interface OctokitLogObject {
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

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  warn: (message: string) => void;

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  error: (message: string) => void;
}
