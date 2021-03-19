// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'

/**
 * A wrapper around `IExecSyncResult`, to facilitate testability.
 */
class ExecSyncResult implements IExecSyncResult {
  /**
   * The standard output stream contents.
   */
  public stdout: string = '';

  /**
   * The standard error stream contents.
   */
  public stderr: string = '';

  /**
   * The return code, where 0 indicates success and all other numbers indicate failure.
   */
  public code: number = 0;

  /**
   * The `Error` object, which can be thrown when a failure occurs.
   */
  public error: Error = new Error();
}

export default ExecSyncResult
