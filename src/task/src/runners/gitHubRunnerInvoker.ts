// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'
import { singleton } from 'tsyringe'
import * as actionsCore from '@actions/core'
import * as actionsExec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import ConsoleWrapper from '../wrappers/consoleWrapper'
import IRunnerInvoker from './iRunnerInvoker'
import ResourcesJson from '../jsonTypes/resourcesJson'

/**
 * A wrapper around the GitHub runner, to facilitate testability.
 */
@singleton()
export default class GitHubRunnerInvoker implements IRunnerInvoker {
  private readonly _consoleWrapper: ConsoleWrapper

  private _resources: Map<string, string> = new Map<string, string>()

  /**
   * Initializes a new instance of the `GitHubRunnerInvoker` class.
   * @param consoleWrapper The wrapper around the console.
   */
  public constructor (consoleWrapper: ConsoleWrapper) {
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

  public initializeLoc (folder: string): void {
    const resourceData: string = fs.readFileSync(path.join(folder, 'resources.resjson'), 'utf8')
    const resources: ResourcesJson = JSON.parse(resourceData) as ResourcesJson

    const entries: [string, string][] = Object.entries(resources)
    entries.forEach((entry: [string, string]): void => {
      if (entry[0] !== '$schema' && !entry[0].endsWith('.comment')) {
        this._resources.set(entry[0].substring(4), entry[1])
      }
    })
  }

  public loc (key: string, ...param: any[]): string {
    return util.format.apply(this._resources.get(key), param)
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
