// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as taskLib from 'azure-pipelines-task-lib/task'
import { IExecSyncResult, IExecSyncOptions } from 'azure-pipelines-task-lib/toolrunner'

/**
 * A wrapper around the Azure Pipelines Task Lib, to facilitate testability.
 */
class TaskLibWrapper {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public debug (message: string): void {
    taskLib.debug(message)
  }

  /**
   * Synchronously executes an external tool.
   * @param tool The tool executable to run.
   * @param args The arguments to pass to the tool.
   * @param options The execution options.
   * @returns The result of the execution.
   */
  public execSync (tool: string, args: string | string[], options?: IExecSyncOptions): IExecSyncResult {
    return taskLib.execSync(tool, args, options)
  }
}

export default TaskLibWrapper
