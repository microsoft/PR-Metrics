/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import GitClient from "../src/gitClient.js";
import GitCommandRunner from "../src/gitCommandRunner.js";
import type StagedChangeInterface from "../src/interfaces/stagedChangeInterface.js";
import assert from "node:assert/strict";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const hostilePaths: string[] = [
  "a file with spaces.txt",
  "-leading-dash.txt",
  "--force.txt",
  "$(echo pwned).txt",
  // eslint-disable-next-line no-template-curly-in-string -- The value is a hostile file name rather than a template.
  "${IFS}.txt",
  "`whoami`.txt",
  "semicolon;echo pwned.txt",
  "ampersand&&echo pwned.txt",
  "{braces}.txt",
  "colon..separator.txt",
  "'single quoted'.txt",
  "percent%SYSTEMROOT%.txt",
  "hash#file.txt",
  "bang!file.txt",
  "at@file.txt",
  "equals=file.txt",
  "comma,file.txt",
  "paren(file).txt",
  "plus+file.txt",
  "tilde~file.txt",
  "Ünïcödé-文件.txt",
];

const repositoryPath: string = join(
  import.meta.dirname,
  "..",
  "integration",
  randomUUID(),
);
const binaryContents: Buffer = Buffer.from([
  0x00, 0xff, 0xfe, 0x80, 0x0a, 0x00,
]);
let stagedChanges: StagedChangeInterface[] = [];
let gitClient: GitClient;

const findChange = (path: string): StagedChangeInterface => {
  const change: StagedChangeInterface | undefined = stagedChanges.find(
    (value: StagedChangeInterface): boolean => value.path === path,
  );
  assert.ok(typeof change !== "undefined", `No staged change for '${path}'.`);
  return change;
};

describe("gitClient.ts – integration", (): void => {
  before(async (): Promise<void> => {
    mkdirSync(repositoryPath, { recursive: true });
    const commandRunner: GitCommandRunner = new GitCommandRunner(
      repositoryPath,
    );
    await commandRunner.run(["init", "-b", "main"]);
    await commandRunner.run(["config", "user.email", "test@example.com"]);
    await commandRunner.run(["config", "user.name", "Test User"]);
    await commandRunner.run(["config", "core.autocrlf", "false"]);
    await commandRunner.run(["config", "commit.gpgsign", "false"]);

    writeFileSync(join(repositoryPath, "modified.txt"), "original\n");
    writeFileSync(join(repositoryPath, "deleted.txt"), "obsolete\n");
    writeFileSync(join(repositoryPath, "untouched.txt"), "untouched\n");
    await commandRunner.run(["add", "-A"]);
    await commandRunner.run(["commit", "-m", "Initial commit"]);

    writeFileSync(join(repositoryPath, "modified.txt"), "staged\n");
    rmSync(join(repositoryPath, "deleted.txt"));
    writeFileSync(join(repositoryPath, "binary.bin"), binaryContents);
    writeFileSync(join(repositoryPath, "empty.txt"), "");
    hostilePaths.forEach((value: string): void => {
      writeFileSync(join(repositoryPath, value), `contents of ${value}\n`);
    });

    gitClient = new GitClient(commandRunner);
    await gitClient.stageAll();

    writeFileSync(
      join(repositoryPath, "modified.txt"),
      "working tree divergence\n",
    );
    writeFileSync(join(repositoryPath, "untouched.txt"), "unstaged change\n");

    stagedChanges = await gitClient.getStagedChanges();
  });

  after((): void => {
    rmSync(repositoryPath, { force: true, maxRetries: 3, recursive: true });
  });

  it("should enumerate every staged change", (): void => {
    // Act
    const paths: string[] = stagedChanges
      .map((value: StagedChangeInterface): string => value.path)
      .sort((first: string, second: string): number =>
        first.localeCompare(second),
      );

    // Assert
    const expected: string[] = [
      ...hostilePaths,
      "binary.bin",
      "deleted.txt",
      "empty.txt",
      "modified.txt",
    ].sort((first: string, second: string): number =>
      first.localeCompare(second),
    );
    assert.deepEqual(paths, expected);
  });

  it("should not report files whose changes are not staged", (): void => {
    // Assert
    assert.equal(
      stagedChanges.some(
        (value: StagedChangeInterface): boolean =>
          value.path === "untouched.txt",
      ),
      false,
    );
  });

  it("should report a deletion without an object ID", (): void => {
    // Act
    const change: StagedChangeInterface = findChange("deleted.txt");

    // Assert
    assert.equal(change.objectId, null);
  });

  it("should read content from the index rather than the working tree", async (): Promise<void> => {
    // Arrange
    const change: StagedChangeInterface = findChange("modified.txt");

    // Act
    const contents: Buffer = await gitClient.readBlob(change.objectId ?? "");

    // Assert
    assert.equal(contents.toString("utf8"), "staged\n");
  });

  it("should read a binary blob without alteration", async (): Promise<void> => {
    // Arrange
    const change: StagedChangeInterface = findChange("binary.bin");

    // Act
    const contents: Buffer = await gitClient.readBlob(change.objectId ?? "");

    // Assert
    assert.deepEqual(contents, binaryContents);
  });

  it("should read an empty blob", async (): Promise<void> => {
    // Arrange
    const change: StagedChangeInterface = findChange("empty.txt");

    // Act
    const contents: Buffer = await gitClient.readBlob(change.objectId ?? "");

    // Assert
    assert.equal(contents.length, 0);
  });

  hostilePaths.forEach((value: string): void => {
    it(`should read the blob for the hostile path ${JSON.stringify(value)}`, async (): Promise<void> => {
      // Arrange
      const change: StagedChangeInterface = findChange(value);

      // Act
      const contents: Buffer = await gitClient.readBlob(change.objectId ?? "");

      // Assert
      assert.equal(contents.toString("utf8"), `contents of ${value}\n`);
    });
  });
});
