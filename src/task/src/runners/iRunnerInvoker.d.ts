// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from '../git/gitWritableStream'

/**
 * An interface for invoking runner functionality with any underlying runner.
 */
export default interface IRunnerInvoker {
  /**
   * Logs a debug message.
   * @param message The message to log.
   */
  debug (message: string): void

  /**
   * Logs an error message.
   * @param message The message to log.
   */
  error (message: string): void

  /**
   * Asynchronously executes an external tool.
   * @param tool The tool executable to run.
   * @param args The arguments to pass to the tool.
   * @param failOnError A value indicating whether the execution should fail when an error is printed.
   * @param outputStream The stream to which to write output text.
   * @param errorStream The stream to which to write error text.
   * @returns A promise containing the result of the execution.
   */
  exec (tool: string, args: string | string[], failOnError: boolean, outputStream: GitWritableStream, errorStream: GitWritableStream): Promise<number>

  /**
   * Gets the value of an input. If the input is `required` but nonexistent, this method will throw.
   * @param name The name of the input.
   * @param required A value indicating whether the input is required.
   * @returns The value of the input or `undefined` if the input was not set.
   */
  getInput (name: string, required: boolean | undefined): string | undefined

  /**
   * Gets the localized string from the JSON resource file and optionally formats using the additional parameters.
   * @param key The key of the resources string in the resource file.
   * @param param Optional additional parameters for formatting the string.
   * @returns The localized and formatted string.
   */
  loc (key: string, ...param: any[]): string

  /**
   * Logs a warning message.
   * @param message The message to log.
   */
  warning (message: string): void
}
