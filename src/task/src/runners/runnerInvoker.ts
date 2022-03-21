// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import AzurePipelinesRunnerInvoker from './azurePipelinesRunnerInvoker'
import GitHubRunnerInvoker from './gitHubRunnerInvoker'
import IRunnerInvoker from './iRunnerInvoker'

/**
 * A wrapper around the runner functionality, to facilitate testability.
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

  public debug (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    runner.debug(message)
  }

  public error (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    runner.error(message)
  }

  public async exec (tool: string, args: string | string[], options?: IExecOptions): Promise<number> {
    const runner: IRunnerInvoker = this.getRunner()
    return await runner.exec(tool, args, options)
  }

  public getInput (name: string, required: boolean | undefined): string | undefined {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.getInput(name, required)
  }

  public loc (key: string, ...param: any[]): string {
    const runner: IRunnerInvoker = this.getRunner()
    return runner.loc(key, param)
  }

  public warning (message: string): void {
    const runner: IRunnerInvoker = this.getRunner()
    runner.warning(message)
  }

  private getRunner (): IRunnerInvoker {
    if (this._runnerInvoker) {
      return this._runnerInvoker
    }

    const variable: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'Runner.getRunner()')
    switch (variable) {
      case 'TfsGit':
        this._runnerInvoker = this._azurePipelinesRunnerInvoker
        break
      case 'GitHub':
      case 'GitHubEnterprise':
        this._runnerInvoker = this._gitHubRunnerInvoker
        break
      default:
        throw RangeError(`BUILD_REPOSITORY_PROVIDER '${variable}' is unsupported.`)
    }

    return this._runnerInvoker
  }
}
