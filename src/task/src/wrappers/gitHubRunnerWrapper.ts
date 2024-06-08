/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as actionsCore from '@actions/core'
import * as actionsExec from '@actions/exec'
import { singleton } from 'tsyringe'

/**
 * A wrapper around the GitHub runner, to facilitate testability.
 */
@singleton()
export default class GitHubRunnerWrapper {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public debug (message: string): void {
    actionsCore.debug(message)
  }

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  public error (message: string): void {
    actionsCore.error(message)
  }

  /**
   * Asynchronously executes an external tool.
   * @param tool The tool executable to run.
   * @param args The arguments to pass to the tool.
   * @param options The execution options.
   * @returns A promise containing the result of the execution.
   */
  public async exec (tool: string, args: string, options: actionsExec.ExecOptions): Promise<actionsExec.ExecOutput> {
    return actionsExec.getExecOutput(tool, args.split(' '), options)
  }

  /**
   * Sets the run status to 'failed'.
   * @param message The message to log as part of the status.
   */
  public setFailed (message: string): void {
    actionsCore.setFailed(message)
  }

  /**
   * Registers a value with the logger, so the value will be masked from the logs. Multi-line secrets are disallowed.
   * @param value The value to register.
   */
  public setSecret (value: string): void {
    actionsCore.setSecret(value)
  }

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  public warning (message: string): void {
    actionsCore.warning(message)
  }
}
