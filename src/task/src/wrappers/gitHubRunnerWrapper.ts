// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { singleton } from 'tsyringe'
import * as actionsCore from '@actions/core'
import * as actionsExec from '@actions/exec'

/**
 * A wrapper around the GitHub runner, to facilitate testability.
 */
@singleton()
export default class GitHubRunnerWrapper {
  public debug (message: string): void {
    actionsCore.debug(message)
  }

  public error (message: string): void {
    actionsCore.error(message)
  }

  public exec (tool: string, args: string[], options: actionsExec.ExecOptions): Promise<number> {
    return actionsExec.exec(tool, args, options)
  }

  public getInput (name: string): string | undefined {
    return actionsCore.getInput(name)
  }

  public setFailed (message: string): void {
    actionsCore.setFailed(message)
  }

  public warning (message: string): void {
    actionsCore.warning(message)
  }
}
