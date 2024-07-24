/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import AzurePipelinesRunnerInvoker from './azurePipelinesRunnerInvoker'
import { EndpointAuthorization } from './endpointAuthorization'
import ExecOutput from './execOutput'
import GenericRunnerInvoker from './genericRunnerInvoker'
import GitHubRunnerInvoker from './gitHubRunnerInvoker'
import { singleton } from 'tsyringe'

/**
 * A wrapper around the runner functionality, to facilitate testability. This class cannot use logging functionality as
 * the logger forms part of the runner functionality, and using logging here could result in circular dependencies.
 */
@singleton()
export default class RunnerInvoker implements GenericRunnerInvoker {
  private readonly azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker
  private readonly gitHubRunnerInvoker: GitHubRunnerInvoker

  private runnerInvoker: GenericRunnerInvoker | undefined
  private localizationInitialized = false

  /**
   * Initializes a new instance of the `RunnerInvoker` class.
   * @param azurePipelinesRunnerInvoker The Azure Pipelines runner logic.
   * @param gitHubRunnerInvoker The GitHub runner logic.
   */
  public constructor (azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker, gitHubRunnerInvoker: GitHubRunnerInvoker) {
    this.azurePipelinesRunnerInvoker = azurePipelinesRunnerInvoker
    this.gitHubRunnerInvoker = gitHubRunnerInvoker
  }

  /**
   * Gets a value indicating whether a GitHub runner is in use.
   */
  public static get isGitHub (): boolean {
    return process.env.GITHUB_ACTION !== undefined
  }

  public async exec (tool: string, args: string): Promise<ExecOutput> {
    const runner: GenericRunnerInvoker = this.getRunner()
    return runner.exec(tool, args)
  }

  public getInput (name: string[]): string | undefined {
    const runner: GenericRunnerInvoker = this.getRunner()
    return runner.getInput(name)
  }

  public getEndpointAuthorization (id: string): EndpointAuthorization | undefined {
    const runner: GenericRunnerInvoker = this.getRunner()
    return runner.getEndpointAuthorization(id)
  }

  public getEndpointAuthorizationScheme (id: string): string | undefined {
    const runner: GenericRunnerInvoker = this.getRunner()
    return runner.getEndpointAuthorizationScheme(id)
  }

  public getEndpointAuthorizationParameter (id: string, key: string): string | undefined {
    const runner: GenericRunnerInvoker = this.getRunner()
    return runner.getEndpointAuthorizationParameter(id, key)
  }

  public locInitialize (folder: string): void {
    if (this.localizationInitialized) {
      throw new Error('RunnerInvoker.locInitialize must not be called multiple times.')
    }

    this.localizationInitialized = true
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.locInitialize(folder)
  }

  public loc (key: string, ...param: string[]): string {
    if (!this.localizationInitialized) {
      throw new Error('RunnerInvoker.locInitialize must be called before RunnerInvoker.loc.')
    }

    const runner: GenericRunnerInvoker = this.getRunner()
    return runner.loc(key, ...param)
  }

  public logDebug (message: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.logDebug(message)
  }

  public logError (message: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.logError(message)
  }

  public logWarning (message: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.logWarning(message)
  }

  public setStatusFailed (message: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.setStatusFailed(message)
  }

  public setStatusSkipped (message: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.setStatusSkipped(message)
  }

  public setStatusSucceeded (message: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.setStatusSucceeded(message)
  }

  public setSecret (value: string): void {
    const runner: GenericRunnerInvoker = this.getRunner()
    runner.setSecret(value)
  }

  private getRunner (): GenericRunnerInvoker {
    if (this.runnerInvoker !== undefined) {
      return this.runnerInvoker
    }

    this.runnerInvoker = RunnerInvoker.isGitHub ? this.gitHubRunnerInvoker : this.azurePipelinesRunnerInvoker
    return this.runnerInvoker
  }
}
