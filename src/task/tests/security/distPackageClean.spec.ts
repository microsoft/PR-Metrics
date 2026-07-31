/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

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
  "clean-dist.mjs",
);
const readmeContents = "# dist folder\n";

const runScript = (targetPath: string): string =>
  execFileSync(process.execPath, [scriptPath, targetPath], {
    encoding: "utf8",
  });

describe("scripts/clean-dist.mjs", (): void => {
  let workingDirectory = "";
  let distPath = "";

  beforeEach((): void => {
    workingDirectory = fs.mkdtempSync(
      path.join(import.meta.dirname, "clean-dist-"),
    );
    distPath = path.join(workingDirectory, "dist");
  });

  afterEach((): void => {
    fs.rmSync(workingDirectory, { force: true, recursive: true });
  });

  it("removes every generated child while preserving the authored README", (): void => {
    fs.mkdirSync(path.join(distPath, "nested"), { recursive: true });
    fs.writeFileSync(path.join(distPath, "README.md"), readmeContents);
    fs.writeFileSync(path.join(distPath, "index.mjs"), "stale");
    fs.writeFileSync(path.join(distPath, "exec-child.js"), "stale");
    fs.writeFileSync(path.join(distPath, "nested", "removed.js"), "stale");
    fs.writeFileSync(path.join(distPath, ".hidden"), "stale");

    runScript(distPath);

    assert.deepEqual(fs.readdirSync(distPath), ["README.md"]);
    assert.equal(
      fs.readFileSync(path.join(distPath, "README.md"), "utf8"),
      readmeContents,
    );
  });

  it("creates the directory when it is absent", (): void => {
    runScript(distPath);

    assert.equal(fs.existsSync(distPath), true);
    assert.deepEqual(fs.readdirSync(distPath), []);
  });

  it("leaves an already clean directory untouched", (): void => {
    fs.mkdirSync(distPath, { recursive: true });
    fs.writeFileSync(path.join(distPath, "README.md"), readmeContents);

    runScript(distPath);

    assert.deepEqual(fs.readdirSync(distPath), ["README.md"]);
  });

  it("reports the removed entries", (): void => {
    fs.mkdirSync(distPath, { recursive: true });
    fs.writeFileSync(path.join(distPath, "README.md"), readmeContents);
    fs.writeFileSync(path.join(distPath, "index.mjs"), "stale");

    const output: string = runScript(distPath);

    assert.equal(output.includes("index.mjs"), true);
    assert.equal(output.includes("README.md"), false);
  });

  it("refuses to delete a path that is not a directory", (): void => {
    fs.writeFileSync(distPath, "not a directory");

    assert.throws((): string => runScript(distPath));
    assert.equal(fs.existsSync(distPath), true);
  });
});
