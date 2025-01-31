/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as taskLib from "azure-pipelines-task-lib/task";
import {
  IExecOptions,
  IExecSyncResult,
} from "azure-pipelines-task-lib/toolrunner";
import { singleton } from "tsyringe";

/**
 * A wrapper around the Azure Pipelines runner, to facilitate testability.
 */
@singleton()
export default class AzurePipelinesRunnerWrapper {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  public debug(message: string): void {
    taskLib.debug(message);
  }

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  public error(message: string): void {
    taskLib.error(message);
  }

  /**
   * Asynchronously executes an external tool.
   * @param tool The tool executable to run.
   * @param args The arguments to pass to the tool.
   * @param options The execution options.
   * @returns The result of the execution.
   */
  public execSync(
    tool: string,
    args: string,
    options: IExecOptions,
  ): IExecSyncResult {
    return taskLib.execSync(tool, args, options);
  }

  /**
   * Gets the value of an input.
   * @param name The name of the input.
   * @returns The value of the input or `null` if the input was not set.
   */
  public getInput(name: string): string | null {
    return taskLib.getInput(name) ?? null;
  }

  /**
   * Gets the authorization details for a service endpoint.
   * @param id The name of the service endpoint.
   * @param optional A value indicating whether the URL is optional.
   * @returns The authorization details or `null` if the endpoint was not found.
   */
  public getEndpointAuthorization(
    id: string,
    optional: boolean,
  ): taskLib.EndpointAuthorization | null {
    return taskLib.getEndpointAuthorization(id, optional) ?? null;
  }

  /**
   * Gets the endpoint authorization scheme for a service endpoint.
   * @param id The name of the service endpoint.
   * @param optional A value indicating whether the endpoint authorization scheme is optional.
   * @returns The value of the endpoint authorization scheme or `null` if the scheme was not found.
   */
  public getEndpointAuthorizationScheme(
    id: string,
    optional: boolean,
  ): string | null {
    return taskLib.getEndpointAuthorizationScheme(id, optional) ?? null;
  }

  /**
   * Gets the endpoint authorization parameter value for a service endpoint with the specified key.
   * @param id The name of the service endpoint.
   * @param key The key to find the endpoint authorization parameter.
   * @param optional A value indicating whether the endpoint authorization scheme is optional.
   * @returns The value of the endpoint authorization parameter value or `null` if the parameter was not found.
   */
  public getEndpointAuthorizationParameter(
    id: string,
    key: string,
    optional: boolean,
  ): string | null {
    return taskLib.getEndpointAuthorizationParameter(id, key, optional) ?? null;
  }

  /**
   * Registers a value with the logger, so the value will be masked from the logs. Multi-line secrets are disallowed.
   * @param value The value to register.
   */
  public setSecret(value: string): void {
    taskLib.setSecret(value);
  }

  /**
   * Initializes the mechanism for getting localized strings from the JSON resource file by setting the resource path.
   * @param path The path of the file containing the resources.
   */
  public setResourcePath(path: string): void {
    taskLib.setResourcePath(path);
  }

  /**
   * Gets the localized string from the JSON resource file and optionally formats using the additional parameters.
   * @param key The key of the resources string in the resource file.
   * @param param Optional additional parameters for formatting the string.
   * @returns The localized and formatted string.
   */
  public loc(key: string, ...param: string[]): string {
    return taskLib.loc(key, ...param);
  }

  /**
   * Sets the run result.
   * @param result The result of the run.
   * @param message The message to log as part of the status.
   */
  public setResult(result: taskLib.TaskResult, message: string): void {
    taskLib.setResult(result, message);
  }

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  public warning(message: string): void {
    taskLib.warning(message);
  }
}
