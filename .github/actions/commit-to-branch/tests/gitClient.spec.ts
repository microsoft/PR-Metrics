/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "./testUtilities/assertExtensions.js";
import {
  blobArgs,
  headArgs,
  stageAllArgs,
  stagedChangesArgs,
} from "./testUtilities/gitArguments.js";
import {
  buildAddition,
  buildDeletion,
  buildOutput,
  headObjectId,
  objectIdTwo,
} from "./testUtilities/rawIndex.js";
import FakeCommandRunner from "./testUtilities/fakeCommandRunner.js";
import GitClient from "../src/gitClient.js";
import assert from "node:assert/strict";

describe("gitClient.ts", (): void => {
  describe("stageAll()", (): void => {
    it("should stage all changes via the argument vector", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(stageAllArgs, "");
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act
      await gitClient.stageAll();

      // Assert
      assert.deepEqual(commandRunner.invocations, [[...stageAllArgs]]);
    });
  });

  describe("getHeadObjectId()", (): void => {
    it("should return the trimmed object ID of HEAD", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, `${headObjectId}\n`);
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act
      const result: string = await gitClient.getHeadObjectId();

      // Assert
      assert.equal(result, headObjectId);
      assert.deepEqual(commandRunner.invocations, [[...headArgs]]);
    });

    it("should throw when HEAD cannot be resolved to an object ID", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(headArgs, "HEAD\n");
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => gitClient.getHeadObjectId(),
        'The Git object ID "HEAD" is invalid.',
      );
    });
  });

  describe("getStagedChanges()", (): void => {
    it("should read the index with NUL delimited output and no rename detection", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(
        stagedChangesArgs,
        buildOutput([
          buildAddition(objectIdTwo, "added file.txt"),
          buildDeletion("deleted.txt"),
        ]),
      );
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act
      const result: unknown = await gitClient.getStagedChanges();

      // Assert
      assert.deepEqual(result, [
        { objectId: objectIdTwo, path: "added file.txt" },
        { objectId: null, path: "deleted.txt" },
      ]);
      assert.deepEqual(commandRunner.invocations, [[...stagedChangesArgs]]);
    });
  });

  describe("readBlob()", (): void => {
    it("should read the blob from the object store", async (): Promise<void> => {
      // Arrange
      const contents: Buffer = Buffer.from("staged contents", "utf8");
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(blobArgs(objectIdTwo), contents);
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act
      const result: Buffer = await gitClient.readBlob(objectIdTwo);

      // Assert
      assert.deepEqual(result, contents);
      assert.deepEqual(commandRunner.invocations, [[...blobArgs(objectIdTwo)]]);
    });

    it("should read a binary blob without alteration", async (): Promise<void> => {
      // Arrange
      const contents: Buffer = Buffer.from([
        0x00, 0xff, 0xfe, 0x80, 0x0a, 0x00,
      ]);
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(blobArgs(objectIdTwo), contents);
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act
      const result: Buffer = await gitClient.readBlob(objectIdTwo);

      // Assert
      assert.deepEqual(result, contents);
    });

    it("should read an empty blob", async (): Promise<void> => {
      // Arrange
      const commandRunner: FakeCommandRunner = new FakeCommandRunner();
      commandRunner.setResponse(blobArgs(objectIdTwo), Buffer.alloc(0));
      const gitClient: GitClient = new GitClient(commandRunner);

      // Act
      const result: Buffer = await gitClient.readBlob(objectIdTwo);

      // Assert
      assert.equal(result.length, 0);
    });

    {
      const testCases: string[] = [
        "HEAD",
        "--help",
        "-x",
        "",
        "../../../etc/passwd",
        `${objectIdTwo} --output=pwned`,
        "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
      ];

      testCases.forEach((value: string): void => {
        it(`should throw without invoking Git for the invalid object ID ${JSON.stringify(value)}`, async (): Promise<void> => {
          // Arrange
          const commandRunner: FakeCommandRunner = new FakeCommandRunner();
          const gitClient: GitClient = new GitClient(commandRunner);

          // Act & Assert
          await AssertExtensions.toThrowAsync(
            async (): Promise<unknown> => gitClient.readBlob(value),
            `The Git object ID ${JSON.stringify(value)} is invalid.`,
          );
          assert.deepEqual(commandRunner.invocations, []);
        });
      });
    }
  });
});
