// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as taskLib from 'azure-pipelines-task-lib/task'
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import * as path from 'path'
import { singleton } from 'tsyringe'
import { GitWritableStream } from '../git/gitWritableStream'
import AzurePipelinesRunnerWrapper from '../wrappers/azurePipelinesRunnerWrapper'
import IRunnerInvoker from './iRunnerInvoker'

/**
 * A class for invoking Azure Pipelines runner functionality.
 */
@singleton()
export default class AzurePipelinesRunnerInvoker implements IRunnerInvoker {
  private readonly _azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper

  /**
   * Initializes a new instance of the `AzurePipelinesRunnerInvoker` class.
   * @param azurePipelinesRunnerWrapper The wrapper around the Azure Pipelines runner.
   */
  public constructor (azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper) {
    this._azurePipelinesRunnerWrapper = azurePipelinesRunnerWrapper
  }

  public async exec (tool: string, args: string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number> {
    const options: IExecOptions = {
      failOnStdErr: failOnError,
      outStream: outputStream,
      errStream: errorStream
    }

    return await this._azurePipelinesRunnerWrapper.exec(tool, args, options)
  }

  public getInput (name: string[]): string | undefined {
    const formattedName: string = name.join('')
    return this._azurePipelinesRunnerWrapper.getInput(formattedName)
  }

  public locInitialize (folder: string): void {
    this._azurePipelinesRunnerWrapper.setResourcePath(path.join(folder, 'task.json'))
  }

  public loc (key: string, ...param: any[]): string {
    return this._azurePipelinesRunnerWrapper.loc(key, ...param)
  }

  public logDebug (message: string): void {
    this._azurePipelinesRunnerWrapper.debug(message)
  }

  public logError (message: string): void {
    this._azurePipelinesRunnerWrapper.error(message)
  }

  public logWarning (message: string): void {
    this._azurePipelinesRunnerWrapper.warning(message)
  }

  public setStatusFailed (message: string): void {
    this._azurePipelinesRunnerWrapper.setResult(taskLib.TaskResult.Failed, message)
  }

  public setStatusSkipped (message: string): void {
    this._azurePipelinesRunnerWrapper.setResult(taskLib.TaskResult.Skipped, message)
  }

  public setStatusSucceeded (message: string): void {
    this._azurePipelinesRunnerWrapper.setResult(taskLib.TaskResult.Succeeded, message)
  }
}
