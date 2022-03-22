// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'
import * as path from 'path'
import * as taskLib from 'azure-pipelines-task-lib/task'
import IRunnerInvoker from './iRunnerInvoker'

/**
 * A base class for invoking runner functionality.
 */
export default abstract class BaseRunnerInvoker implements IRunnerInvoker {
  public abstract debug (message: string): void

  public abstract error (message: string): void

  public abstract exec (tool: string, args: string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number>

  public abstract getInput (name: string[]): string | undefined

  public initializeLoc (folder: string): void {
    // This method uses the Azure Pipelines implementation as equivalent functionality is not yet available for GitHub Actions.
    taskLib.setResourcePath(path.join(folder, 'task.json'))
  }

  public loc (key: string, ...param: any[]): string {
    // This method uses the Azure Pipelines implementation as equivalent functionality is not yet available for GitHub Actions.
    return taskLib.loc(key, ...param)
  }

  public abstract setFailed (message: string): void

  public abstract setSkipped (message: string): void

  public abstract setSucceeded (message: string): void

  public abstract warning (message: string): void
}