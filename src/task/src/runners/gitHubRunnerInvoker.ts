// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'
import { singleton } from 'tsyringe'
import * as actionsCore from '@actions/core'
import * as actionsExec from '@actions/exec'
import BaseRunnerInvoker from './baseRunnerInvoker'
import ConsoleWrapper from '../wrappers/consoleWrapper'

/**
 * A wrapper around the GitHub runner, to facilitate testability.
 */
@singleton()
export default class GitHubRunnerInvoker extends BaseRunnerInvoker {
  private readonly _consoleWrapper: ConsoleWrapper

  /**
   * Initializes a new instance of the `GitHubRunnerInvoker` class.
   * @param consoleWrapper The wrapper around the console.
   */
  public constructor (consoleWrapper: ConsoleWrapper) {
    super()

    this._consoleWrapper = consoleWrapper
  }

  public debug (message: string): void {
    actionsCore.debug(message)
  }

  public error (message: string): void {
    actionsCore.error(message)
  }

  public exec (tool: string, args: string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number> {
    const options: actionsExec.ExecOptions = {
      failOnStdErr: failOnError,
      outStream: outputStream,
      errStream: errorStream
    }

    return actionsExec.exec(tool, args, options)
  }

  public getInput (name: string[]): string | undefined {
    const formattedName: string = name.join('-').toLowerCase()
    return actionsCore.getInput(formattedName)
  }

  public setFailed (message: string): void {
    actionsCore.setFailed(message)
  }

  public setSkipped (message: string): void {
    this._consoleWrapper.log(message)
  }

  public setSucceeded (message: string): void {
    this._consoleWrapper.log(message)
  }

  public warning (message: string): void {
    actionsCore.warning(message)
  }
}
