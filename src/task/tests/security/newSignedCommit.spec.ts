/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import assert from "node:assert/strict";

interface GraphQlRequestInterface {
  readonly query: string;
  readonly variables: {
    readonly input?: {
      readonly expectedHeadOid?: string;
      readonly oid?: string;
    };
  };
}

interface ScenarioInterface {
  readonly headObjectId: string;
  readonly requests: GraphQlRequestInterface[];
  readonly result: SpawnSyncReturns<string>;
}

describe("New-SignedCommit.ps1 remote head validation", (): void => {
  const helperRelativePath = ".github/workflow-scripts/New-SignedCommit.ps1";
  const branchName = "test-branch";
  const nameWithOwner = "microsoft/PR-Metrics";
  const remoteObjectId = "0123456789abcdef0123456789abcdef01234567";
  const separator = "REQUEST-SEPARATOR";

  const findRepositoryRoot = (): string => {
    let candidate: string = import.meta.dirname;
    while (!fs.existsSync(path.join(candidate, helperRelativePath))) {
      const parent: string = path.dirname(candidate);
      if (parent === candidate) {
        throw new Error("The repository root could not be located.");
      }

      candidate = parent;
    }

    return candidate;
  };

  const repositoryRoot: string = findRepositoryRoot();
  const helperPath: string = path.join(repositoryRoot, helperRelativePath);
  const scratchPath: string = path.join(import.meta.dirname, "scratch");

  const runGit = (repositoryPath: string, ...args: string[]): string => {
    const result: SpawnSyncReturns<string> = spawnSync("git", args, {
      cwd: repositoryPath,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }

    return result.stdout.trim();
  };

  const writeFakeGitHubCli = (
    name: string,
    branchObjectId: string | null,
  ): string => {
    const binaryPath: string = path.join(scratchPath, `${name}-cli`);
    fs.mkdirSync(binaryPath, { recursive: true });
    const reference: string =
      branchObjectId === null
        ? "null"
        : `{"target":{"oid":"${branchObjectId}"}}`;
    fs.writeFileSync(
      path.join(binaryPath, "query.json"),
      `{"data":{"repository":{"id":"R_1","ref":${reference}}}}`,
    );
    fs.writeFileSync(
      path.join(binaryPath, "createRef.json"),
      `{"data":{"createRef":{"ref":{"name":"refs/heads/${branchName}"}}}}`,
    );
    fs.writeFileSync(
      path.join(binaryPath, "commit.json"),
      '{"data":{"createCommitOnBranch":{"commit":{"oid":"89abcdef0123456789abcdef0123456789abcdef"}}}}',
    );

    if (process.platform === "win32") {
      fs.writeFileSync(
        path.join(binaryPath, "gh.cmd"),
        `@echo off\r\nset STAGE=query\r\nfindstr /c:"createRef" "%~4" >nul && set STAGE=createRef\r\nfindstr /c:"createCommitOnBranch" "%~4" >nul && set STAGE=commit\r\necho ${separator}>> "%~dp0requests.log"\r\ntype "%~4" >> "%~dp0requests.log"\r\ntype "%~dp0%STAGE%.json"\r\n`,
      );
    } else {
      const scriptPath: string = path.join(binaryPath, "gh");
      fs.writeFileSync(
        scriptPath,
        `#!/bin/sh\ndirectory="$(dirname "$0")"\nstage=query\ngrep -q createRef "$4" && stage=createRef\ngrep -q createCommitOnBranch "$4" && stage=commit\necho ${separator} >> "$directory/requests.log"\ncat "$4" >> "$directory/requests.log"\ncat "$directory/$stage.json"\n`,
      );
      fs.chmodSync(scriptPath, 0o755);
    }

    return binaryPath;
  };

  const readRequests = (binaryPath: string): GraphQlRequestInterface[] =>
    fs
      .readFileSync(path.join(binaryPath, "requests.log"), "utf8")
      .split(separator)
      .map((entry: string): string => entry.trim())
      .filter((entry: string): boolean => entry !== "")
      .map(
        (entry: string): GraphQlRequestInterface =>
          JSON.parse(entry) as GraphQlRequestInterface,
      );

  const runScenario = (
    name: string,
    branchObjectId: string | null,
    createBranchOnRemote = false,
  ): ScenarioInterface => {
    const repositoryPath: string = path.join(scratchPath, name);
    fs.mkdirSync(repositoryPath, { recursive: true });
    runGit(repositoryPath, "init", "--quiet", `--initial-branch=${branchName}`);
    runGit(repositoryPath, "config", "user.email", "test@example.com");
    runGit(repositoryPath, "config", "user.name", "Test");
    runGit(repositoryPath, "config", "commit.gpgsign", "false");
    fs.writeFileSync(path.join(repositoryPath, "shared.txt"), "local base\n");
    runGit(repositoryPath, "add", "-A");
    runGit(repositoryPath, "commit", "--quiet", "--message=Initial");
    fs.writeFileSync(path.join(repositoryPath, "shared.txt"), "local change\n");

    const binaryPath: string = writeFakeGitHubCli(name, branchObjectId);
    const environment: Record<string, string | undefined> = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]: [string, string | undefined]): boolean =>
          key.toUpperCase() !== "PATH",
      ),
    );
    environment.GH_TOKEN = "fake-token";
    environment.GITHUB_REPOSITORY = nameWithOwner;
    environment.PATH = `${binaryPath}${path.delimiter}${process.env.PATH ?? ""}`;
    const result: SpawnSyncReturns<string> = spawnSync(
      "pwsh",
      [
        "-NoProfile",
        "-NonInteractive",
        "-File",
        helperPath,
        "-Message",
        "test commit",
        ...(createBranchOnRemote ? ["-CreateBranchOnRemote"] : []),
      ],
      { cwd: repositoryPath, encoding: "utf8", env: environment },
    );
    return {
      headObjectId: runGit(repositoryPath, "rev-parse", "HEAD"),
      requests: readRequests(binaryPath),
      result,
    };
  };

  fs.rmSync(scratchPath, { force: true, recursive: true });
  const mismatchScenario: ScenarioInterface = runScenario(
    "mismatch",
    remoteObjectId,
  );
  const createBranchScenario: ScenarioInterface = runScenario(
    "create-branch",
    null,
    true,
  );

  after((): void => {
    fs.rmSync(scratchPath, { force: true, recursive: true });
  });

  it("should fail before mutation when the remote head differs from local HEAD", (): void => {
    assert.notEqual(mismatchScenario.result.status, 0);
    assert.deepEqual(
      mismatchScenario.requests.map(
        (request: GraphQlRequestInterface): string => request.query,
      ),
      [
        "query ($owner: String!, $name: String!, $qualifiedName: String!) { repository(owner: $owner, name: $name) { id ref(qualifiedName: $qualifiedName) { target { oid } } } }",
      ],
    );
    assert.equal(
      mismatchScenario.result.stderr.includes("differs from the local HEAD"),
      true,
    );
    assert.notEqual(mismatchScenario.headObjectId, remoteObjectId);
  });

  it("should create an absent remote branch from local HEAD", (): void => {
    const [, createBranchRequest, commitRequest] =
      createBranchScenario.requests;

    assert.equal(createBranchScenario.result.status, 0);
    assert.equal(
      createBranchRequest?.variables.input?.oid,
      createBranchScenario.headObjectId,
    );
    assert.equal(
      commitRequest?.variables.input?.expectedHeadOid,
      createBranchScenario.headObjectId,
    );
  });
});
