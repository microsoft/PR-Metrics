// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
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
   * Logs an error message.
   * @param message The message to log.
   */
  public error (message: string): void {
    taskLib.error(message)
  }

  /**
   * Asynchronously executes an external tool.
   * @param tool The tool executable to run.
   * @param args The arguments to pass to the tool.
   * @param options The execution options.
   * @returns A promise containing the result of the execution.
   */
  public exec (tool: string, args: string | string[], options?: IExecOptions): Promise<number> {
    return taskLib.exec(tool, args, options)
  }

  /**
   * Gets the value of an input. If the input is `required` but nonexistent, this method will throw.
   * @param name The name of the input.
   * @param required A value indicating whether the input is required.
   * @returns The value of the input or `undefined` if the input was not set.
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

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  public warning (message: string): void {
    taskLib.warning(message)
  }
}
