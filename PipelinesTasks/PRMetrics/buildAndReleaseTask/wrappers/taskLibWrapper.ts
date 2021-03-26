// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecSyncOptions, IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import * as taskLib from 'azure-pipelines-task-lib/task'

/**
 * A wrapper around the Azure Pipelines Task Lib, to facilitate testability.
 */
@singleton()
export default class TaskLibWrapper {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public debug (message: string): void {
    taskLib.debug(message)
  }


  /**
 * Applies glob patterns to a list of paths. Supports interleaved exclude patterns.
 *
 * @param  list         array of paths
 * @param  patterns     patterns to apply. supports interleaved exclude patterns.
 * @param  patternRoot  optional. default root to apply to unrooted patterns. not applied to basename-only patterns when matchBase:true.
 * @param  options      optional. defaults to { dot: true, nobrace: true, nocase: process.platform == 'win32' }.
   */
   public match (list: string[], patterns: string[] | string, patternRoot?: string, options?: taskLib.MatchOptions): string[] {
    return taskLib.match(list, patterns, patternRoot, options)
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

  /**
   * Logs a warning message.
   * @param message The message to log.
 * Gets the value of an input.
 * If required is true and the value is not set, it will throw.
 *
 * @param     name     name of the input to get
 * @param     required whether input is required.  optional, defaults to false
 * @returns   string
   */
  public getInput (name: string, required: boolean | undefined): string | undefined {
    return taskLib.getInput(name, required)
  }

  /**
   * Gets the localized string from the JSON resource file and optionally formats using the additional parameters.
   * @param key The key of the resources string in the resource file.
   * @param param Optional additional parameters for formatting the string.
   * @returns The localized and formatted string.
   */
  public loc (key: string, ...param: any[]): string {
    return taskLib.loc(key, ...param)
  }
}
