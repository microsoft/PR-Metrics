// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import AzurePipelinesRunner from './azurePipelinesRunner'
import GitHubRunner from './gitHubRunner'
import IRunner from './iRunner'
import Logger from '../utilities/logger'

/**
 * A wrapper around the runner functionality, to facilitate testability.
 */
@singleton()
export default class Runner implements IRunner {
  private readonly _azurePipelinesRunner: AzurePipelinesRunner
  private readonly _gitHubRunner: GitHubRunner
  private readonly _logger: Logger

  private _runner: IRunner | undefined

  /**
   * Initializes a new instance of the `ReposInvoker` class.
   * @param azurePipelinesRunner The wrapper around the Azure Pipelines runner.
   * @param gitHubRunner The wrapper around the GitHub runner.
   * @param logger The logger.
   */
  public constructor (azurePipelinesRunner: AzurePipelinesRunner, gitHubRunner: GitHubRunner, logger: Logger) {
    this._azurePipelinesRunner = azurePipelinesRunner
    this._gitHubRunner = gitHubRunner
    this._logger = logger
  }

  public debug (message: string): void {
    this._logger.logDebug('* Runner.debug()')

    const runner: IRunner = this.getRunner()
    runner.debug(message)
  }

  public error (message: string): void {
    this._logger.logDebug('* Runner.error()')

    const runner: IRunner = this.getRunner()
    runner.error(message)
  }

  public exec (tool: string, args: string | string[], options?: IExecOptions): Promise<number> {
    this._logger.logDebug('* Runner.exec()')

    const runner: IRunner = this.getRunner()
    return runner.exec(tool, args, options)
  }

  public getInput (name: string, required: boolean | undefined): string | undefined {
    this._logger.logDebug('* Runner.getInput()')

    const runner: IRunner = this.getRunner()
    return runner.getInput(name, required)
  }

  public loc (key: string, ...param: any[]): string {
    this._logger.logDebug('* Runner.loc()')

    const runner: IRunner = this.getRunner()
    return runner.loc(key, param)
  }

  public warning (message: string): void {
    this._logger.logDebug('* Runner.warning()')

    const runner: IRunner = this.getRunner()
    runner.warning(message)
  }

  private getRunner (): IRunner {
    this._logger.logDebug('* Runner.getRunner()')

    if (this._runner) {
      return this._runner
    }

    const variable: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'Runner.getRunner()')
    switch (variable) {
      case 'TfsGit':
        this._runner = this._azurePipelinesRunner
        break
      case 'GitHub':
      case 'GitHubEnterprise':
        this._runner = this._gitHubRunner
        break
      default:
        throw RangeError(`BUILD_REPOSITORY_PROVIDER '${variable}' is unsupported.`)
    }

    return this._runner
  }
}
