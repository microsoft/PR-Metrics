/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as path from "path";
import * as taskLib from "azure-pipelines-task-lib/task";
import {
  IExecOptions,
  IExecSyncResult,
} from "azure-pipelines-task-lib/toolrunner";
import AzurePipelinesRunnerWrapper from "../wrappers/azurePipelinesRunnerWrapper";
import { EndpointAuthorization } from "./endpointAuthorization";
import ExecOutput from "./execOutput";
import RunnerInvokerInterface from "./runnerInvokerInterface";
import { singleton } from "tsyringe";

/**
 * A class for invoking Azure Pipelines runner functionality.
 */
@singleton()
export default class AzurePipelinesRunnerInvoker
  implements RunnerInvokerInterface
{
  private readonly _azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper;

  /**
   * Initializes a new instance of the `AzurePipelinesRunnerInvoker` class.
   * @param azurePipelinesRunnerWrapper The wrapper around the Azure Pipelines runner.
   */
  public constructor(azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper) {
    this._azurePipelinesRunnerWrapper = azurePipelinesRunnerWrapper;
  }

  public async exec(tool: string, args: string): Promise<ExecOutput> {
    const options: IExecOptions = {
      failOnStdErr: true,
      silent: true,
    };

    const result: IExecSyncResult = this._azurePipelinesRunnerWrapper.execSync(
      tool,
      args,
      options,
    );
    return Promise.resolve({
      exitCode: result.code,
      stderr: result.stderr,
      stdout: result.stdout,
    });
  }

  public getInput(name: string[]): string | null {
    const formattedName: string = name.join("");
    return this._azurePipelinesRunnerWrapper.getInput(formattedName);
  }

  public getEndpointAuthorization(id: string): EndpointAuthorization | null {
    const result: taskLib.EndpointAuthorization | null =
      this._azurePipelinesRunnerWrapper.getEndpointAuthorization(id, true);
    if (result === null) {
      return null;
    }

    return {
      parameters: result.parameters,
      scheme: result.scheme,
    };
  }

  public getEndpointAuthorizationScheme(id: string): string | null {
    return this._azurePipelinesRunnerWrapper.getEndpointAuthorizationScheme(
      id,
      true,
    );
  }

  public getEndpointAuthorizationParameter(
    id: string,
    key: string,
  ): string | null {
    return this._azurePipelinesRunnerWrapper.getEndpointAuthorizationParameter(
      id,
      key,
      true,
    );
  }

  public locInitialize(folder: string): void {
    this._azurePipelinesRunnerWrapper.setResourcePath(
      path.join(folder, "task.json"),
    );
  }

  public loc(key: string, ...param: string[]): string {
    return this._azurePipelinesRunnerWrapper.loc(key, ...param);
  }

  public logDebug(message: string): void {
    this._azurePipelinesRunnerWrapper.debug(message);
  }

  public logError(message: string): void {
    this._azurePipelinesRunnerWrapper.error(message);
  }

  public logWarning(message: string): void {
    this._azurePipelinesRunnerWrapper.warning(message);
  }

  public setStatusFailed(message: string): void {
    this._azurePipelinesRunnerWrapper.setResult(
      taskLib.TaskResult.Failed,
      message,
    );
  }

  public setStatusSkipped(message: string): void {
    this._azurePipelinesRunnerWrapper.setResult(
      taskLib.TaskResult.Skipped,
      message,
    );
  }

  public setStatusSucceeded(message: string): void {
    this._azurePipelinesRunnerWrapper.setResult(
      taskLib.TaskResult.Succeeded,
      message,
    );
  }

  public setSecret(value: string): void {
    this._azurePipelinesRunnerWrapper.setSecret(value);
  }
}
