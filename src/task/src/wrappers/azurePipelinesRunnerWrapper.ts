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
  public debug (message: string): void {
    taskLib.debug(message)
  }

  public error (message: string): void {
    taskLib.error(message)
  }

  public exec (tool: string, args: string[], options: IExecOptions): Promise<number> {
    return taskLib.exec(tool, args, options)
  }

  public getInput (name: string): string | undefined {
    return taskLib.getInput(name)
  }

  public setResourcePath (path: string): void {
    taskLib.setResourcePath(path)
  }

  public loc (key: string, ...param: any[]): string {
    return taskLib.loc(key, ...param)
  }

  public setResult (result: taskLib.TaskResult, message: string): void {
    taskLib.setResult(result, message)
  }

  public warning (message: string): void {
    taskLib.warning(message)
  }
}
