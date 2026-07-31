/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface defining cross-platform options for external tool execution.
 */
export default interface ExecOptions {
  /**
   * A map of environment variables to provide exclusively to the child process. When specified, the child process
   * receives exactly this environment instead of inheriting the current process's environment, so callers must
   * include any entries that need to be preserved, without mutating the current process's environment.
   */
  env?: Record<string, string>;
}
