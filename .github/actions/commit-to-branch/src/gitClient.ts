/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type CommandRunnerInterface from "./interfaces/commandRunnerInterface.js";
import type StagedChangeInterface from "./interfaces/stagedChangeInterface.js";
import { formatPath } from "./pathFormatter.js";
import { parseStagedChanges } from "./gitIndexParser.js";

const objectIdExpression = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;
const stageAllArgs: readonly string[] = ["add", "-A"];
const headArgs: readonly string[] = ["rev-parse", "HEAD"];
const stagedChangesArgs: readonly string[] = [
  "-c",
  "core.quotePath=false",
  "diff-index",
  "--cached",
  "--no-renames",
  "-z",
  "HEAD",
  "--",
];

const validateObjectId = (objectId: string): void => {
  if (!objectIdExpression.test(objectId)) {
    throw new Error(`The Git object ID ${formatPath(objectId)} is invalid.`);
  }
};

/**
 * A class for reading the Git index. File paths are only ever received from Git and are never passed back to it, so
 * hostile file names cannot influence the commands that are run.
 */
export default class GitClient {
  private readonly _commandRunner: CommandRunnerInterface;

  /**
   * Initializes a new instance of the `GitClient` class.
   * @param commandRunner The runner used to invoke Git.
   */
  public constructor(commandRunner: CommandRunnerInterface) {
    this._commandRunner = commandRunner;
  }

  /**
   * Stages all working tree changes. The arguments are fixed and are passed through the argument vector, so no path is
   * ever interpolated into a command.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async stageAll(): Promise<void> {
    await this._commandRunner.run(stageAllArgs);
  }

  /**
   * Gets the object ID of the currently checked out commit.
   * @returns A promise containing the object ID.
   */
  public async getHeadObjectId(): Promise<string> {
    const output: Buffer = await this._commandRunner.run(headArgs);
    const objectId: string = output.toString("utf8").trim();
    validateObjectId(objectId);
    return objectId;
  }

  /**
   * Gets the changes currently present in the Git index.
   * @returns A promise containing the staged changes.
   */
  public async getStagedChanges(): Promise<StagedChangeInterface[]> {
    const output: Buffer = await this._commandRunner.run(stagedChangesArgs);
    return parseStagedChanges(output);
  }

  /**
   * Reads the raw bytes of a blob from the Git object store, so that the content committed is always the staged
   * content rather than the potentially divergent working tree content.
   * @param objectId The object ID of the blob.
   * @returns A promise containing the raw bytes of the blob.
   */
  public async readBlob(objectId: string): Promise<Buffer> {
    validateObjectId(objectId);
    return this._commandRunner.run(["cat-file", "blob", objectId]);
  }
}
