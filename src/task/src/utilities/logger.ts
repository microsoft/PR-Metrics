// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { singleton } from 'tsyringe'
import ConsoleWrapper from '../wrappers/consoleWrapper'
import RunnerInvoker from '../runners/runnerInvoker'

/**
 * A class for logging messages.
 */
@singleton()
export default class Logger {
  private readonly _consoleWrapper: ConsoleWrapper
  private readonly _runnerInvoker: RunnerInvoker

  private readonly _messages: string[] = []

  /**
   * Initializes a new instance of the `Logger` class.
   * @param consoleWrapper The wrapper around the console.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (consoleWrapper: ConsoleWrapper, runnerInvoker: RunnerInvoker) {
    this._consoleWrapper = consoleWrapper
    this._runnerInvoker = runnerInvoker
  }

  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public logDebug (message: string): void {
    this._messages.push(`debug   – ${message}`)
    this._runnerInvoker.logDebug(message)
  }

  /**
   * Logs an informational message.
   * @param message The message to log.
   */
  public logInfo (message: string): void {
    this._messages.push(`info    – ${message}`)
    this._consoleWrapper.log(message)
  }

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  public logWarning (message: string): void {
    this._messages.push(`warning – ${message}`)
    this._runnerInvoker.logWarning(message)
  }

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  public logError (message: string): void {
    this._messages.push(`error   – ${message}`)
    this._runnerInvoker.logError(message)
  }

  /**
   * Replays the messages logged.
   */
  public replay (): void {
    this._messages.forEach((message: string): void => {
      this._consoleWrapper.log(`🔁 ${message}`)
    })
  }
}
