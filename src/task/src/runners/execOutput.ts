/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface defining the output of external tool execution.
 */
export default interface ExecOutput {
  /**
   * The exit code.
   */
  exitCode: number;

  /**
   * The standard output text.
   */
  stdout: string;

  /**
   * The standard error text.
   */
  stderr: string;
}
