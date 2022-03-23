// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'
import { singleton } from 'tsyringe'
import * as actionsExec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import AzurePipelinesRunnerWrapper from '../wrappers/azurePipelinesRunnerWrapper'
import ConsoleWrapper from '../wrappers/consoleWrapper'
import GitHubRunnerWrapper from '../wrappers/gitHubRunnerWrapper'
import IRunnerInvoker from './iRunnerInvoker'
import ResourcesJson from '../jsonTypes/resourcesJson'

/**
 * A class for invoking GitHub runner functionality.
 */
@singleton()
export default class GitHubRunnerInvoker implements IRunnerInvoker {
  private readonly _azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper
  private readonly _consoleWrapper: ConsoleWrapper
  private readonly _gitHubRunnerWrapper: GitHubRunnerWrapper

  private readonly _resources: Map<string, string> = new Map<string, string>()

  /**
   * Initializes a new instance of the `GitHubRunnerInvoker` class.
   * @param azurePipelinesRunnerWrapper The wrapper around the Azure Pipelines runner.
   * @param consoleWrapper The wrapper around the console.
   * @param gitHubRunnerWrapper The wrapper around the GitHub runner.
   */
  public constructor (azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper, consoleWrapper: ConsoleWrapper, gitHubRunnerWrapper: GitHubRunnerWrapper) {
    this._azurePipelinesRunnerWrapper = azurePipelinesRunnerWrapper
    this._consoleWrapper = consoleWrapper
    this._gitHubRunnerWrapper = gitHubRunnerWrapper
  }

  public exec (tool: string, args: string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number> {
    const options: actionsExec.ExecOptions = {
      failOnStdErr: failOnError,
      outStream: outputStream,
      errStream: errorStream
    }

    return this._gitHubRunnerWrapper.exec(tool, args, options)
  }

  public getInput (name: string[]): string | undefined {
    const formattedName: string = `INPUT_${name.join('-').toUpperCase()}`
    console.log(formattedName)

    // This method redirects to the Azure Pipelines logic as the library will store the input data.
    return this._azurePipelinesRunnerWrapper.getVariable(formattedName)
  }

  public locInitialize (folder: string): void {
    const resourceData: string = fs.readFileSync(path.join(folder, 'resources.resjson'), 'utf8')
    const resources: ResourcesJson = JSON.parse(resourceData) as ResourcesJson

    const entries: [string, string][] = Object.entries(resources)
    const stringPrefix: string = 'loc.messages.'
    entries.forEach((entry: [string, string]): void => {
      if (entry[0].startsWith(stringPrefix)) {
        this._resources.set(entry[0].substring(stringPrefix.length), entry[1])
      }
    })
  }

  public loc (key: string, ...param: any[]): string {
    return util.format(this._resources.get(key), ...param)
  }

  public logDebug (message: string): void {
    this._gitHubRunnerWrapper.debug(message)
  }

  public logError (message: string): void {
    this._gitHubRunnerWrapper.error(message)
  }

  public logWarning (message: string): void {
    this._gitHubRunnerWrapper.warning(message)
  }

  public setStatusFailed (message: string): void {
    this._gitHubRunnerWrapper.setFailed(message)
  }

  public setStatusSkipped (message: string): void {
    this._consoleWrapper.log(message)
  }

  public setStatusSucceeded (message: string): void {
    this._consoleWrapper.log(message)
  }
}
