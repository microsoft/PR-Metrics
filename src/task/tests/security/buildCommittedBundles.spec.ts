/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

type PackageJsonScriptEntries = [scriptName: string, command: string][];

const repositoryRootPath: string = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);
const scriptPath: string = path.join(
  repositoryRootPath,
  "scripts",
  "build-committed-bundles.mjs",
);
const markerScriptContents = [
  "import { writeFileSync } from 'node:fs';",
  "writeFileSync(process.argv[2], 'ok');",
].join("\n");
const failScriptContents = "process.exit(1);";

const writePackageJson = (
  targetPath: string,
  scriptEntries: PackageJsonScriptEntries,
): void => {
  fs.writeFileSync(
    path.join(targetPath, "package.json"),
    JSON.stringify({
      name: "fixture",
      scripts: Object.fromEntries(scriptEntries),
    }),
  );
};

const runScript = (
  targetPath: string,
): { output: string; status: number } => {
  try {
    const output: string = execFileSync(
      process.execPath,
      [scriptPath, targetPath],
      { encoding: "utf8" },
    );

    return { output, status: 0 };
  } catch (error) {
    const executionError = error as {
      status: number | null;
      stdout: string;
      stderr: string;
    };

    return {
      output: executionError.stdout + executionError.stderr,
      status: executionError.status ?? 1,
    };
  }
};

describe("scripts/build-committed-bundles.mjs", (): void => {
  let workingDirectory = "";

  beforeEach((): void => {
    workingDirectory = fs.mkdtempSync(
      path.join(import.meta.dirname, "build-committed-bundles-"),
    );
    fs.writeFileSync(
      path.join(workingDirectory, "write-marker.mjs"),
      markerScriptContents,
    );
    fs.writeFileSync(
      path.join(workingDirectory, "fail.mjs"),
      failScriptContents,
    );
  });

  afterEach((): void => {
    fs.rmSync(workingDirectory, { force: true, recursive: true });
  });

  it("always runs the root 'build:package' package script", (): void => {
    writePackageJson(workingDirectory, [
      ["build:package", "node write-marker.mjs build-package.marker"],
    ]);

    const { output, status } = runScript(workingDirectory);

    assert.equal(status, 0);
    assert.equal(
      fs.existsSync(path.join(workingDirectory, "build-package.marker")),
      true,
    );
    assert.equal(output.includes("build:package"), true);
  });

  it("runs the 'build:actions' package script when it exists", (): void => {
    writePackageJson(workingDirectory, [
      ["build:package", "node write-marker.mjs build-package.marker"],
      ["build:actions", "node write-marker.mjs build-actions.marker"],
    ]);

    const { status } = runScript(workingDirectory);

    assert.equal(status, 0);
    assert.equal(
      fs.existsSync(path.join(workingDirectory, "build-package.marker")),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(workingDirectory, "build-actions.marker")),
      true,
    );
  });

  it("skips the 'build:actions' package script when it does not exist", (): void => {
    writePackageJson(workingDirectory, [
      ["build:package", "node write-marker.mjs build-package.marker"],
    ]);

    const { output, status } = runScript(workingDirectory);

    assert.equal(status, 0);
    assert.equal(
      fs.existsSync(path.join(workingDirectory, "build-actions.marker")),
      false,
    );
    assert.equal(output.toLowerCase().includes("build:actions"), true);
    assert.equal(output.toLowerCase().includes("skip"), true);
  });

  it("does not run 'build:actions' when 'build:package' fails, and reports failure", (): void => {
    writePackageJson(workingDirectory, [
      ["build:package", "node fail.mjs"],
      ["build:actions", "node write-marker.mjs build-actions.marker"],
    ]);

    const { status } = runScript(workingDirectory);

    assert.notEqual(status, 0);
    assert.equal(
      fs.existsSync(path.join(workingDirectory, "build-actions.marker")),
      false,
    );
  });

  it("fails when the target has no package.json", (): void => {
    const { status } = runScript(workingDirectory);

    assert.notEqual(status, 0);
  });
});
