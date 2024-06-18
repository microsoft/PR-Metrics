/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ConsoleWrapper from '../wrappers/consoleWrapper'
import RunnerInvoker from '../runners/runnerInvoker'
import { singleton } from 'tsyringe'

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
    const filteredMessage: string = Logger.filterMessage(message)
    this._messages.push(`debug   – ${filteredMessage}`)
    this._runnerInvoker.logDebug(filteredMessage)
  }

  /**
   * Logs an informational message.
   * @param message The message to log.
   */
  public logInfo (message: string): void {
    const filteredMessage: string = Logger.filterMessage(message)
    this._messages.push(`info    – ${filteredMessage}`)
    this._consoleWrapper.log(filteredMessage)
  }

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  public logWarning (message: string): void {
    const filteredMessage: string = Logger.filterMessage(message)
    this._messages.push(`warning – ${filteredMessage}`)
    this._runnerInvoker.logWarning(filteredMessage)
  }

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  public logError (message: string): void {
    const filteredMessage: string = Logger.filterMessage(message)
    this._messages.push(`error   – ${filteredMessage}`)
    this._runnerInvoker.logError(filteredMessage)
  }

  /**
   * Logs an error object.
   * @param error The error object to log.
   */
  public logErrorObject (error: any): void {
    const name: string = error.name
    const properties: string[] = Object.getOwnPropertyNames(error)
    properties.forEach((property: string): void => {
      this.logInfo(`${name} – ${property}: ${JSON.stringify(error[property])}`)
    })
  }

  /**
   * Replays the messages logged.
   */
  public replay (): void {
    this._messages.forEach((message: string): void => {
      this._consoleWrapper.log(`🔁 ${message}`)
    })
  }

  /**
   * Filter messages so that control strings are not printed to `stdout`.
   * @param message The message to filter.
   * @returns The filtered message.
   */
  private static filterMessage (message: string): string {
    return message.replace(/##(vso)?\[/giu, '')
  }
}
