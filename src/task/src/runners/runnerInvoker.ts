// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'
import { singleton } from 'tsyringe'
import AzurePipelinesRunnerInvoker from './azurePipelinesRunnerInvoker'
import GitHubRunnerInvoker from './gitHubRunnerInvoker'
import IRunnerInvoker from './iRunnerInvoker'

/**
 * A wrapper around the runner functionality, to facilitate testability. This class cannot use logging functionality as
 * the logger forms part of the runner functionality, and using logging here could result in circular dependencies.
 */
@singleton()
export default class RunnerInvoker implements IRunnerInvoker {
  private readonly _azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker
  private readonly _gitHubRunnerInvoker: GitHubRunnerInvoker

  private _runnerInvoker: IRunnerInvoker | undefined

  /**
   * Initializes a new instance of the `RunnerInvoker` class.
   * @param azurePipelinesRunnerInvoker The Azure Pipelines runner logic.
   * @param gitHubRunnerInvoker The GitHub runner logic.
   */
  public constructor (azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker, gitHubRunnerInvoker: GitHubRunnerInvoker) {
    this._azurePipelinesRunnerInvoker = azurePipelinesRunnerInvoker
    this._gitHubRunnerInvoker = gitHubRunnerInvoker
  }

  /**
   * Gets a value indicating whether a GitHub runner is in use.
   */
  public static get isGitHub (): boolean {
    return process.env.GITHUB_ACTION !== undefined
  }

  public debug (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    runner.debug(message)
  }

  public error (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    runner.error(message)
  }

  public exec (tool: string, args: string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number> {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.exec(tool, args, failOnError, outputStream, errorStream)
  }

  public getInput (name: string[]): string | undefined {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.getInput(name)
  }

  public initializeLoc (folder: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.initializeLoc(folder)
  }

  public loc (key: string, ...param: any[]): string {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.loc(key, param)
  }

  public setFailed (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.setFailed(message)
  }

  public setSkipped (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.setSkipped(message)
  }

  public setSucceeded (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.setSucceeded(message)
  }

  public warning (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    runner.warning(message)
  }

  private getRunner (): IRunnerInvoker {
    if (this._runnerInvoker) {
      return this._runnerInvoker
    }

    this._runnerInvoker = RunnerInvoker.isGitHub ? this._gitHubRunnerInvoker : this._azurePipelinesRunnerInvoker
    return this._runnerInvoker
  }
}
