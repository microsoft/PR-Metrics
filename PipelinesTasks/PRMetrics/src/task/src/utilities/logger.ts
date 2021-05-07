// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { singleton } from 'tsyringe'
import ConsoleWrapper from '../wrappers/consoleWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for logging messages.
 */
@singleton()
export default class Logger {
  private readonly _consoleWrapper: ConsoleWrapper
  private readonly _taskLibWrapper: TaskLibWrapper

  private _messages: string[] = []

  /**
   * Initializes a new instance of the `Logger` class.
   * @param consoleWrapper The wrapper around the console.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (consoleWrapper: ConsoleWrapper, taskLibWrapper: TaskLibWrapper) {
    this._consoleWrapper = consoleWrapper
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public logDebug (message: string): void {
    this._messages.push(`debug – ${message}`)
    this._taskLibWrapper.debug(message)
  }

  /**
   * Logs an informational message.
   * @param message The message to log.
   */
  public logInfo (message: string): void {
    this._messages.push(`info  – ${message}`)
    this._consoleWrapper.log(message)
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
