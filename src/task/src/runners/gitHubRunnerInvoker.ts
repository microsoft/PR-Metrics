/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as actionsExec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import AzurePipelinesRunnerWrapper from '../wrappers/azurePipelinesRunnerWrapper'
import ConsoleWrapper from '../wrappers/consoleWrapper'
import { EndpointAuthorization } from './endpointAuthorization'
import ExecOutput from './execOutput'
import GitHubRunnerWrapper from '../wrappers/gitHubRunnerWrapper'
import ResourcesJsonInterface from '../jsonTypes/resourcesJsonInterface'
import RunnerInvokerInterface from './runnerInvokerInterface'
import { singleton } from 'tsyringe'

/**
 * A class for invoking GitHub runner functionality.
 */
@singleton()
export default class GitHubRunnerInvoker implements RunnerInvokerInterface {
  private readonly _azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper
  private readonly _consoleWrapper: ConsoleWrapper
  private readonly _gitHubRunnerWrapper: GitHubRunnerWrapper

  private readonly _resources: Map<string, string> = new Map<string, string>();

  /**
   * Initializes a new instance of the `GitHubRunnerInvoker` class.
   * @param azurePipelinesRunnerWrapper The wrapper around the Azure Pipelines runner.
   * @param consoleWrapper The wrapper around the console.
   * @param gitHubRunnerWrapper The wrapper around the GitHub runner.
   */
  public constructor(
    azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper,
    consoleWrapper: ConsoleWrapper,
    gitHubRunnerWrapper: GitHubRunnerWrapper,
  ) {
    this._azurePipelinesRunnerWrapper = azurePipelinesRunnerWrapper;
    this._consoleWrapper = consoleWrapper;
    this._gitHubRunnerWrapper = gitHubRunnerWrapper;
  }

  public async exec(tool: string, args: string): Promise<ExecOutput> {
    const options: actionsExec.ExecOptions = {
      failOnStdErr: true,
      silent: true,
    };

    const result: actionsExec.ExecOutput = await this._gitHubRunnerWrapper.exec(
      tool,
      args,
      options,
    );
    return {
      exitCode: result.exitCode,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  }

  public getInput(name: string[]): string | undefined {
    const formattedName: string = name.join("-").toUpperCase();

    // This method redirects to the Azure Pipelines logic as the library will store the input data.
    return this._azurePipelinesRunnerWrapper.getInput(formattedName);
  }

  public getEndpointAuthorization(
    _: string,
  ): EndpointAuthorization | undefined {
    throw new Error("getEndpointAuthorization() unavailable in GitHub.");
  }

  public getEndpointAuthorizationScheme(_: string): string | undefined {
    throw new Error("getEndpointAuthorizationScheme() unavailable in GitHub.");
  }

  public getEndpointAuthorizationParameter(
    _: string,
    __: string,
  ): string | undefined {
    throw new Error(
      "getEndpointAuthorizationParameter() unavailable in GitHub.",
    );
  }

  public locInitialize (folder: string): void {
    const resourceData: string = fs.readFileSync(path.join(folder, 'resources.resjson'), 'utf8')
    const resources: ResourcesJsonInterface = JSON.parse(resourceData) as ResourcesJsonInterface

    const entries: [string, string][] = Object.entries(resources)
    const stringPrefix = 'loc.messages.'
    for (const [key, value] of entries) {
      if (key.startsWith(stringPrefix)) {
        this._resources.set(key.substring(stringPrefix.length), value)
      }
    }
  }

  public loc (key: string, ...param: string[]): string {
    return util.format(this._resources.get(key), ...param)
  }

  public logDebug(message: string): void {
    this._gitHubRunnerWrapper.debug(message);
  }

  public logError(message: string): void {
    this._gitHubRunnerWrapper.error(message);
  }

  public logWarning(message: string): void {
    this._gitHubRunnerWrapper.warning(message);
  }

  public setStatusFailed(message: string): void {
    this._gitHubRunnerWrapper.setFailed(message);
  }

  public setStatusSkipped(message: string): void {
    this._consoleWrapper.log(message);
  }

  public setStatusSucceeded(message: string): void {
    this._consoleWrapper.log(message);
  }

  public setSecret(value: string): void {
    this._gitHubRunnerWrapper.setSecret(value);
  }
}
