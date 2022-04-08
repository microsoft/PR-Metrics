// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import * as taskLib from 'azure-pipelines-task-lib/task'

/**
 * A wrapper around the Azure Pipelines runner, to facilitate testability.
 */
@singleton()
export default class AzurePipelinesRunnerWrapper {
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
  public async exec (tool: string, args: string[], options: IExecOptions): Promise<number> {
    return taskLib.exec(tool, args, options)
  }

  /**
   * Gets the value of an input.
   * @param name The name of the input.
   * @returns The value of the input or `undefined` if the input was not set.
   */
  public getInput (name: string): string | undefined {
    return taskLib.getInput(name)
  }

  /**
   * Initializes the mechanism for getting localized strings from the JSON resource file by setting the resource path.
   * @param path The path of the file containing the resources.
   */
  public setResourcePath (path: string): void {
    taskLib.setResourcePath(path)
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
   * Sets the run result.
   * @param result The result of the run.
   * @param message The message to log as part of the status.
   */
  public setResult (result: taskLib.TaskResult, message: string): void {
    taskLib.setResult(result, message)
  }

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  public warning (message: string): void {
    taskLib.warning(message)
  }
}
