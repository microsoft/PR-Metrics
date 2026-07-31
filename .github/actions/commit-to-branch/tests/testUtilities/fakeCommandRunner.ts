/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type CommandRunnerInterface from "../../src/interfaces/commandRunnerInterface.js";

const buildKey = (args: readonly string[]): string => args.join(" ");

/**
 * A test double for `CommandRunnerInterface`, which records the exact argument vectors it is invoked with.
 */
export default class FakeCommandRunner implements CommandRunnerInterface {
  private readonly _invocations: string[][] = [];
  private readonly _failures = new Map<string, Error>();
  private readonly _responses = new Map<string, Buffer>();

  /**
   * Gets the argument vectors with which the runner was invoked, in invocation order.
   * @returns The argument vectors.
   */
  public get invocations(): string[][] {
    return this._invocations;
  }

  /**
   * Registers the output to return for an exact argument vector.
   * @param args The expected argument vector.
   * @param output The output to return.
   */
  public setResponse(args: readonly string[], output: Buffer | string): void {
    this._responses.set(
      buildKey(args),
      typeof output === "string" ? Buffer.from(output, "utf8") : output,
    );
  }

  /**
   * Registers a failure to raise for an exact argument vector.
   * @param args The expected argument vector.
   * @param error The error to raise.
   */
  public setFailure(args: readonly string[], error: Error): void {
    this._failures.set(buildKey(args), error);
  }

  /**
   * Runs the command with the specified arguments.
   * @param args The arguments with which to invoke the command.
   * @returns A promise containing the registered output.
   */
  public async run(args: readonly string[]): Promise<Buffer> {
    this._invocations.push([...args]);
    const key: string = buildKey(args);
    const failure: Error | undefined = this._failures.get(key);
    if (typeof failure !== "undefined") {
      return Promise.reject(failure);
    }

    const response: Buffer | undefined = this._responses.get(key);
    if (typeof response === "undefined") {
      return Promise.reject(
        new Error(`No response registered for 'git ${key}'.`),
      );
    }

    return Promise.resolve(response);
  }
}
