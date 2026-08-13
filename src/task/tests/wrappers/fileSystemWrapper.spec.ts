/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fsPromises from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  azureCliConfigDirectoryCleanupMaxRetries,
  azureCliConfigDirectoryCleanupRetryDelayMs,
} from "../../src/utilities/constants.js";
import FileSystemWrapper from "../../src/wrappers/fileSystemWrapper.js";
import type { Stats } from "node:fs";
import assert from "node:assert/strict";

describe("fileSystemWrapper.ts", (): void => {
  const createdPaths: string[] = [];

  afterEach(async (): Promise<void> => {
    await Promise.all(
      createdPaths.splice(0).map(
        async (createdPath: string): Promise<void> =>
          fsPromises.rm(createdPath, {
            force: true,
            recursive: true,
          }),
      ),
    );
  });

  describe("directoryExists()", (): void => {
    it("returns true for an existing directory", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();

      // Act
      const result: boolean = await fileSystemWrapper.directoryExists(
        os.tmpdir(),
      );

      // Assert
      assert.equal(result, true);
    });

    it("returns false for a path that does not exist", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();
      const missingPath: string = path.join(
        os.tmpdir(),
        "pr-metrics-missing-directory",
      );

      // Act
      const result: boolean =
        await fileSystemWrapper.directoryExists(missingPath);

      // Assert
      assert.equal(result, false);
    });

    it("returns false for a path that refers to a file", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();
      const directoryPath: string = await fsPromises.mkdtemp(
        path.join(os.tmpdir(), "pr-metrics-file-"),
      );
      createdPaths.push(directoryPath);
      const filePath: string = path.join(directoryPath, "file.tmp");
      await fsPromises.writeFile(filePath, "");

      // Act
      const result: boolean = await fileSystemWrapper.directoryExists(filePath);

      // Assert
      assert.equal(result, false);
    });
  });

  describe("mkdtemp()", (): void => {
    it("creates a unique directory using the specified prefix", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();
      const prefix: string = path.join(os.tmpdir(), "pr-metrics-mkdtemp-");

      // Act
      const firstDirectory: string = await fileSystemWrapper.mkdtemp(prefix);
      const secondDirectory: string = await fileSystemWrapper.mkdtemp(prefix);
      createdPaths.push(firstDirectory, secondDirectory);

      // Assert
      assert.notEqual(firstDirectory, secondDirectory);
      const firstStats: Stats = await fsPromises.stat(firstDirectory);
      assert.equal(firstStats.isDirectory(), true);
    });
  });

  describe("chmod()", (): void => {
    it("does not throw for an existing directory", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();
      const prefix: string = path.join(os.tmpdir(), "pr-metrics-chmod-");
      const directory: string = await fileSystemWrapper.mkdtemp(prefix);
      createdPaths.push(directory);

      // Act
      const func: () => Promise<void> = async () =>
        fileSystemWrapper.chmod(directory, 0o700);

      // Assert
      await assert.doesNotReject(func);
    });
  });

  describe("rm()", (): void => {
    it("recursively removes a directory and its contents", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();
      const prefix: string = path.join(os.tmpdir(), "pr-metrics-rm-");
      const directory: string = await fileSystemWrapper.mkdtemp(prefix);
      await fsPromises.writeFile(path.join(directory, "file.txt"), "content");

      // Act
      await fileSystemWrapper.rm(directory);

      // Assert
      const exists: boolean =
        await fileSystemWrapper.directoryExists(directory);
      assert.equal(exists, false);
    });

    it("passes bounded retry options to the underlying recursive removal", async (): Promise<void> => {
      // Arrange
      type RmOptions = NonNullable<Parameters<typeof fsPromises.rm>[1]>;

      const rmCalls: { path: string; options: RmOptions | undefined }[] = [];
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper({
        chmod: async (): Promise<void> => Promise.resolve(),
        mkdtemp: async (): Promise<string> => Promise.resolve(""),
        rm: async (pathName: string, options?: RmOptions): Promise<void> => {
          rmCalls.push({
            options,
            path: pathName,
          });
          return Promise.resolve();
        },
        stat: async (): Promise<Stats> =>
          Promise.resolve({
            isDirectory: (): boolean => true,
          } as Stats),
      } as never);
      const directory: string = path.join(
        os.tmpdir(),
        `pr-metrics-rm-options-${String(Date.now())}`,
      );

      // Act
      await fileSystemWrapper.rm(directory);

      // Assert
      assert.deepEqual(rmCalls, [
        {
          options: {
            force: true,
            maxRetries: azureCliConfigDirectoryCleanupMaxRetries,
            recursive: true,
            retryDelay: azureCliConfigDirectoryCleanupRetryDelayMs,
          },
          path: directory,
        },
      ]);
    });

    it("does not throw when the path does not exist", async (): Promise<void> => {
      // Arrange
      const fileSystemWrapper: FileSystemWrapper = new FileSystemWrapper();
      const missingPath: string = path.join(
        os.tmpdir(),
        "pr-metrics-rm-missing",
      );

      // Act
      const func: () => Promise<void> = async () =>
        fileSystemWrapper.rm(missingPath);

      // Assert
      await assert.doesNotReject(func);
    });
  });
});
