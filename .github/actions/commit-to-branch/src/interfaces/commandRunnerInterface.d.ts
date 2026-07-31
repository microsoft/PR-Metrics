/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface for running an external command with a fixed argument vector.
 */
export default interface CommandRunnerInterface {
  /**
   * Runs the command with the specified arguments, which are passed directly to the process without shell
   * interpretation.
   * @param args The arguments with which to invoke the command.
   * @returns A promise containing the raw bytes written to standard output.
   */
  run: (args: readonly string[]) => Promise<Buffer>;
}
