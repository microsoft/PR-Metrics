// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import * as taskLib from 'azure-pipelines-task-lib/task'
import IRunner from './iRunner'

/**
 * A wrapper around the GitHub runner, to facilitate testability.
 */
@singleton()
export default class GitHubRunner implements IRunner {
  public debug (message: string): void {
    taskLib.debug(message)
  }

  public error (message: string): void {
    taskLib.error(message)
  }

  public exec (tool: string, args: string | string[], options?: IExecOptions): Promise<number> {
    return taskLib.exec(tool, args, options)
  }

  public getInput (name: string, required: boolean | undefined): string | undefined {
    return taskLib.getInput(name, required)
  }

  public loc (key: string, ...param: any[]): string {
    return taskLib.loc(key, ...param)
  }

  public warning (message: string): void {
    taskLib.warning(message)
  }
}
