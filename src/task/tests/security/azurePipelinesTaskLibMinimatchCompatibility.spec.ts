/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";

interface MinimatchInstanceInterface {
  readonly match: (candidate: string) => boolean;
}

interface MinimatchModuleInterface {
  readonly braceExpand: (pattern: string) => string[];
  readonly filter: (
    pattern: string,
    options?: Record<string, unknown>,
  ) => (candidate: string) => boolean;
  readonly match: (
    candidates: string[],
    pattern: string,
    options?: Record<string, unknown>,
  ) => string[];
}

interface PackageJsonInterface {
  readonly version: string;
}

describe("azure-pipelines-task-lib minimatch compatibility", (): void => {
  const require = createRequire(import.meta.url);
  const taskLibPackageJsonPath: string = require.resolve(
    "azure-pipelines-task-lib/package.json",
  );
  const taskLibRequire = createRequire(taskLibPackageJsonPath);
  const taskLibMinimatchPackageJson = taskLibRequire(
    "minimatch/package.json",
  ) as PackageJsonInterface;
  const taskLibMinimatch = taskLibRequire(
    "minimatch",
  ) as MinimatchModuleInterface &
    Record<
      "Minimatch",
      new (
        pattern: string,
        options?: Record<string, unknown>,
      ) => MinimatchInstanceInterface
    >;

  it("should resolve azure-pipelines-task-lib to a fixed minimatch release", (): void => {
    assert.equal(taskLibMinimatchPackageJson.version, "10.2.6");
  });

  it("should preserve the CommonJS minimatch helpers that azure-pipelines-task-lib uses", (): void => {
    const matcher = new taskLibMinimatch.Minimatch("src/**/*.ts");
    const filter = taskLibMinimatch.filter("**/*.spec.ts");

    assert.equal(matcher.match("src/task/index.ts"), true);
    assert.deepEqual(taskLibMinimatch.braceExpand("file{1,2}.txt"), [
      "file1.txt",
      "file2.txt",
    ]);
    assert.deepEqual(
      taskLibMinimatch.match(
        ["src/task/index.ts", "src/task/index.js", "README.md"],
        "src/**/*.ts",
      ),
      ["src/task/index.ts"],
    );
    assert.equal(filter("tests/security/example.spec.ts"), true);
  });
});
