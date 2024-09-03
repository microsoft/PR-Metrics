/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { IExecSyncResult } from "azure-pipelines-task-lib/toolrunner";

/**
 * A wrapper around `IExecSyncResult`, to facilitate testability.
 */
export default class ExecSyncResult implements IExecSyncResult {
  /**
   * The standard output stream contents.
   */
  public stdout = "";

  /**
   * The standard error stream contents.
   */
  public stderr = "";

  /**
   * The return code, where 0 indicates success and all other numbers indicate failure.
   */
  public code = 0;

  /**
   * The `Error` object, which can be thrown when a failure occurs.
   */
  public error: Error = new Error();
}
