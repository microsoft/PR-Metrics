// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'

/**
 * An interface for invoking runner functionality with any underlying runner.
 */
export default interface IRunnerInvoker {
  /**
   * Asynchronously executes an external tool.
   * @param tool The tool executable to run.
   * @param args The arguments to pass to the tool.
   * @returns A promise containing the result of the execution.
   */
  exec: (tool: string, args: string) => Promise<ExecOutput>

  /**
   * Gets the value of an input.
   * @param name The name of the input, with each word stored as a separate element of the array.
   * @returns The value of the input or `undefined` if the input was not set.
   */
  getInput: (name: string[]) => string | undefined

  /**
   * Gets the authorization details for a service endpoint.
   * @param id The name of the service endpoint.
   * @returns The authorization details or `undefined` if the endpoint was not found.
   */
  getEndpointAuthorization: (id: string) => EndpointAuthorization | undefined

  /**
   * Gets the endpoint authorization scheme for a service endpoint.
   * @param id The name of the service endpoint.
   * @returns The value of the endpoint authorization scheme or `undefined` if the scheme was not found.
   */
  getEndpointAuthorizationScheme: (id: string) => string | undefined

  /**
   * Gets the endpoint authorization parameter value for a service endpoint with the specified key.
   * @param id The name of the service endpoint.
   * @param key The key to find the endpoint authorization parameter.
   * @returns The value of the endpoint authorization parameter value or `undefined` if the parameter was not found.
   */
  getEndpointAuthorizationParameter: (id: string, key: string) => string | undefined

  /**
   * Initializes the mechanism for getting localized strings from the JSON resource file.
   * @param folder The folder in which the localized resources are stored.
   */
  locInitialize: (folder: string) => void

  /**
   * Gets the localized string from the JSON resource file and optionally formats using the additional parameters.
   * @param key The key of the resources string in the resource file.
   * @param param Optional additional parameters for formatting the string.
   * @returns The localized and formatted string.
   */
  loc: (key: string, ...param: any[]) => string

  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  logDebug: (message: string) => void

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  logError: (message: string) => void

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  logWarning: (message: string) => void

  /**
   * Sets the run status to 'failed'.
   * @param message The message to log as part of the status.
   */
  setStatusFailed: (message: string) => void

  /**
   * Sets the run status to 'skipped'.
   * @param message The message to log as part of the status.
   */
  setStatusSkipped: (message: string) => void

  /**
   * Sets the run status to 'succeeded'.
   * @param message The message to log as part of the status.
   */
  setStatusSucceeded: (message: string) => void

  /**
   * Registers a value with the logger, so the value will be masked from the logs. Multi-line secrets are disallowed.
   * @param value The value to register.
   */
  setSecret: (value: string) => void
}
