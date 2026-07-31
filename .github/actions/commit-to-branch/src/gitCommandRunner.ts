/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type CommandRunnerInterface from "./interfaces/commandRunnerInterface.js";
import { execFile } from "node:child_process";

const maxBuffer = 268435456;

/**
 * A class for running Git with a fixed argument vector. No shell is involved, so no argument can ever be interpreted
 * as a command.
 */
export default class GitCommandRunner implements CommandRunnerInterface {
  private readonly _workingDirectory: string;

  /**
   * Initializes a new instance of the `GitCommandRunner` class.
   * @param workingDirectory The directory in which to run Git.
   */
  public constructor(workingDirectory: string) {
    this._workingDirectory = workingDirectory;
  }

  /**
   * Runs Git with the specified arguments.
   * @param args The arguments with which to invoke Git.
   * @returns A promise containing the raw bytes written to standard output.
   */
  public async run(args: readonly string[]): Promise<Buffer> {
    const { _workingDirectory: workingDirectory } = this;
    return new Promise<Buffer>(
      (
        resolve: (value: Buffer) => void,
        reject: (reason: Error) => void,
      ): void => {
        execFile(
          "git",
          [...args],
          {
            cwd: workingDirectory,
            encoding: "buffer",
            maxBuffer,
            shell: false,
            windowsHide: true,
          },
          (
            error: Error | null,
            stdout: Buffer | string,
            stderr: Buffer | string,
          ): void => {
            if (error === null) {
              resolve(Buffer.from(stdout));
              return;
            }

            reject(
              new Error(
                `Git failed with '${error.message}'. ${Buffer.from(stderr).toString("utf8")}`,
              ),
            );
          },
        );
      },
    );
  }
}
