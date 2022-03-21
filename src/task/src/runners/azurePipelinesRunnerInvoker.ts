// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import * as taskLib from 'azure-pipelines-task-lib/task'
import IRunnerInvoker from './iRunnerInvoker'

/**
 * A wrapper around the Azure Pipelines runner, to facilitate testability.
 */
@singleton()
export default class AzurePipelinesRunnerInvoker implements IRunnerInvoker {
  public debug (message: string): void {
    taskLib.debug(message)
  }

  public error (message: string): void {
    taskLib.error(message)
  }

  public exec (tool: string, args: string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number> {
    const options: IExecOptions = {
      failOnStdErr: failOnError,
      outStream: outputStream,
      errStream: errorStream
    }

    return taskLib.exec(tool, args, options)
  }

  public getInput (name: string[]): string | undefined {
    const formattedName: string = name.join('')
    return taskLib.getInput(formattedName)
  }

  public loc (key: string, ...param: any[]): string {
    return taskLib.loc(key, ...param)
  }

  public warning (message: string): void {
    taskLib.warning(message)
  }
}
