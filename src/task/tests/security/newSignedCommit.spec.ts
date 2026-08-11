/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import assert from "node:assert/strict";

interface FileAdditionInterface {
  contents: string;
  path: string;
}

interface CommitPayloadInterface {
  readonly query: string;
  readonly variables: {
    readonly input: {
      readonly branch: {
        readonly branchName: string;
        readonly repositoryNameWithOwner: string;
      };
      readonly expectedHeadOid: string;
      readonly fileChanges: {
        readonly additions: FileAdditionInterface[];
        readonly deletions: { path: string }[];
      };
      readonly message: { readonly headline: string };
    };
  };
}

interface ScenarioInterface {
  readonly headObjectId: string;
  readonly payload: CommitPayloadInterface | null;
  readonly repositoryPath: string;
  readonly result: SpawnSyncReturns<string>;
}

describe("New-SignedCommit.ps1", (): void => {
  const helperRelativePath = ".github/workflow-scripts/New-SignedCommit.ps1";
  const commitMessage = "chore: fix linting";
  const nameWithOwner = "microsoft/PR-Metrics";
  const branchName = "test-branch";

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
  const workflowsPath: string = path.join(repositoryRoot, ".github/workflows");
  const scratchPath: string = path.join(import.meta.dirname, "scratch");

  const compareBytes = (first: string, second: string): number =>
    Buffer.compare(Buffer.from(first, "utf8"), Buffer.from(second, "utf8"));

  const readWorkflow = (name: string): string =>
    fs.readFileSync(path.join(workflowsPath, name), "utf8");

  const getCommitSteps = (workflow: string): string[] =>
    workflow
      .split(/\n\s*\n/u)
      .filter((step: string): boolean => step.includes("New-SignedCommit.ps1"));

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

  // The scenarios run while the suite is defined, so the Mocha timeout does not apply to Git and PowerShell.
  const runScenario = (
    name: string,
    stage: (repositoryPath: string) => void,
  ): ScenarioInterface => {
    const repositoryPath: string = path.join(scratchPath, name);
    fs.mkdirSync(repositoryPath, { recursive: true });
    runGit(repositoryPath, "init", "--quiet", `--initial-branch=${branchName}`);
    runGit(repositoryPath, "config", "user.email", "test@example.com");
    runGit(repositoryPath, "config", "user.name", "Test");
    runGit(repositoryPath, "config", "commit.gpgsign", "false");
    fs.writeFileSync(path.join(repositoryPath, "modified.txt"), "original\n");
    fs.writeFileSync(path.join(repositoryPath, "deleted.txt"), "removed\n");
    runGit(repositoryPath, "add", "-A");
    runGit(repositoryPath, "commit", "--quiet", "--message=Initial");
    stage(repositoryPath);

    const payloadPath: string = path.join(repositoryPath, "payload.json");
    const environment: Record<string, string | undefined> = {
      ...process.env,
    };
    environment.GH_TOKEN = "";
    environment.GITHUB_REPOSITORY = nameWithOwner;
    const result: SpawnSyncReturns<string> = spawnSync(
      "pwsh",
      [
        "-NoProfile",
        "-NonInteractive",
        "-File",
        helperPath,
        "-Message",
        commitMessage,
        "-PayloadOutputPath",
        payloadPath,
      ],
      { cwd: repositoryPath, encoding: "utf8", env: environment },
    );
    return {
      headObjectId: runGit(repositoryPath, "rev-parse", "HEAD"),
      payload: fs.existsSync(payloadPath)
        ? (JSON.parse(
            fs.readFileSync(payloadPath, "utf8"),
          ) as CommitPayloadInterface)
        : null,
      repositoryPath,
      result,
    };
  };

  const hostileNames: string[] = [
    "hostile $(Get-Content pwned).txt",
    "hostile `whoami` && echo.txt",
    "hostile '; rm -rf . ;'.txt",
    "hostile ünïcödé 🙂.txt",
  ];
  if (process.platform !== "win32") {
    hostileNames.push("hostile\nnewline.txt", "hostile::colon.txt");
  }

  fs.rmSync(scratchPath, { force: true, recursive: true });
  const contentScenario: ScenarioInterface = runScenario(
    "content",
    (repositoryPath: string): void => {
      fs.writeFileSync(path.join(repositoryPath, "added.txt"), "added\n");
      fs.writeFileSync(path.join(repositoryPath, "modified.txt"), "updated\n");
      fs.rmSync(path.join(repositoryPath, "deleted.txt"));
      fs.writeFileSync(path.join(repositoryPath, "empty.txt"), "");
      fs.writeFileSync(
        path.join(repositoryPath, "binary.dat"),
        Buffer.from([0, 1, 255, 13, 10, 0]),
      );
    },
  );
  const stagedScenario: ScenarioInterface = runScenario(
    "staged",
    (repositoryPath: string): void => {
      fs.writeFileSync(path.join(repositoryPath, "modified.txt"), "staged\n");
      runGit(repositoryPath, "add", "modified.txt");
      runGit(repositoryPath, "update-index", "--skip-worktree", "modified.txt");
      fs.writeFileSync(path.join(repositoryPath, "modified.txt"), "worktree\n");
    },
  );
  const hostileScenario: ScenarioInterface = runScenario(
    "hostile",
    (repositoryPath: string): void => {
      for (const name of hostileNames) {
        fs.writeFileSync(path.join(repositoryPath, name), "safe\n");
      }
    },
  );
  const executableScenario: ScenarioInterface = runScenario(
    "executable",
    (repositoryPath: string): void => {
      const filePath: string = path.join(repositoryPath, "modified.txt");
      fs.writeFileSync(filePath, "updated\n");
      fs.chmodSync(filePath, 0o755);
      runGit(repositoryPath, "add", "modified.txt");
      runGit(repositoryPath, "update-index", "--chmod=+x", "modified.txt");
    },
  );
  const unchangedScenario: ScenarioInterface = runScenario(
    "unchanged",
    (repositoryPath: string): void => {
      fs.writeFileSync(path.join(repositoryPath, "modified.txt"), "original\n");
    },
  );

  after((): void => {
    fs.rmSync(scratchPath, { force: true, recursive: true });
  });

  it("should not reference a third-party or locally compiled commit action", (): void => {
    // Arrange
    const gitHubPath: string = path.join(repositoryRoot, ".github");
    const files: string[] = [
      ...fs
        .globSync(["**/*.yml", "**/*.yaml", "**/*.ps1", "**/*.md"], {
          cwd: gitHubPath,
        })
        .map((file: string): string => path.join(gitHubPath, file)),
      path.join(repositoryRoot, "package.json"),
      path.join(repositoryRoot, "AGENTS.md"),
      path.join(repositoryRoot, "docs/development.md"),
    ];

    // Assert
    assert.equal(
      fs.existsSync(path.join(gitHubPath, "actions/commit-to-branch")),
      false,
    );
    for (const file of files) {
      const contents: string = fs.readFileSync(file, "utf8");
      assert.equal(contents.includes("github-api-commit-action"), false, file);
      assert.equal(contents.includes("commit-to-branch"), false, file);
    }
  });

  it("should invoke the helper from every automated commit step", (): void => {
    // Arrange
    const buildSteps: string[] = getCommitSteps(readWorkflow("build.yml"));
    const releaseSteps: string[] = getCommitSteps(
      readWorkflow("release-initiate.yml"),
    );

    // Assert
    assert.equal(buildSteps.length, 2);
    assert.equal(releaseSteps.length, 2);
    for (const step of [...buildSteps, ...releaseSteps]) {
      const runSection: string = step.substring(
        step.indexOf("run:"),
        step.search(/^ {8}env:$/mu),
      );
      assert.equal(step.includes("name: Git – Commit & Push (Signed)"), true);
      assert.equal(runSection.includes(helperRelativePath), true);
      assert.equal(runSection.includes("-Message $env:COMMIT_MESSAGE"), true);
      assert.equal(runSection.includes("${{"), false);
      assert.match(step, /^ {10}COMMIT_MESSAGE: /mu);
      assert.match(
        step,
        /^ {10}GH_TOKEN: \$\{\{ steps\.app-token\.outputs\.token \}\}$/mu,
      );
    }

    for (const step of buildSteps) {
      assert.equal(step.includes("-CreateBranchOnRemote"), false);
    }

    for (const step of releaseSteps) {
      assert.equal(step.includes("-CreateBranchOnRemote"), true);
    }

    assert.equal(fs.readFileSync(helperPath, "utf8").includes("${{"), false);
  });

  it("should encode the staged content of every change", (): void => {
    // Arrange
    const payload: CommitPayloadInterface | null = contentScenario.payload;

    // Assert
    assert.ok(payload);
    assert.deepEqual(payload.variables.input.fileChanges.additions, [
      {
        contents: Buffer.from("added\n").toString("base64"),
        path: "added.txt",
      },
      {
        contents: Buffer.from([0, 1, 255, 13, 10, 0]).toString("base64"),
        path: "binary.dat",
      },
      { contents: "", path: "empty.txt" },
      {
        contents: Buffer.from("updated\n").toString("base64"),
        path: "modified.txt",
      },
    ]);
    assert.deepEqual(payload.variables.input.fileChanges.deletions, [
      { path: "deleted.txt" },
    ]);
    assert.equal(
      payload.variables.input.expectedHeadOid,
      contentScenario.headObjectId,
    );
    assert.equal(payload.variables.input.branch.branchName, branchName);
    assert.equal(
      payload.variables.input.branch.repositoryNameWithOwner,
      nameWithOwner,
    );
    assert.equal(payload.variables.input.message.headline, commitMessage);
    assert.equal(
      payload.query.includes("createCommitOnBranch(input: $input)"),
      true,
    );
  });

  it("should commit the staged blob rather than the working tree content", (): void => {
    // Assert
    assert.deepEqual(stagedScenario.payload?.variables.input.fileChanges, {
      additions: [
        {
          contents: Buffer.from("staged\n").toString("base64"),
          path: "modified.txt",
        },
      ],
      deletions: [],
    });
  });

  it("should treat hostile file names as data", (): void => {
    // Arrange
    const additions: FileAdditionInterface[] =
      hostileScenario.payload?.variables.input.fileChanges.additions ?? [];
    const paths: string[] = additions.map(
      (addition: FileAdditionInterface): string => addition.path,
    );

    // Assert
    assert.equal(hostileScenario.result.status, 0);
    assert.deepEqual(
      paths.sort(compareBytes),
      [...hostileNames].sort(compareBytes),
    );
    assert.equal(
      fs.existsSync(path.join(hostileScenario.repositoryPath, "pwned")),
      false,
    );
  });

  it("should fail when a change uses an unsupported file mode", (): void => {
    // Assert
    assert.notEqual(executableScenario.result.status, 0);
    assert.equal(executableScenario.payload, null);
    assert.equal(
      executableScenario.result.stderr.includes(
        "uses the unsupported file mode '100755'",
      ),
      true,
    );
  });

  it("should not create a request when nothing is staged", (): void => {
    // Assert
    assert.equal(unchangedScenario.result.status, 0);
    assert.equal(unchangedScenario.payload, null);
    assert.equal(
      unchangedScenario.result.stdout.includes("No staged changes were found"),
      true,
    );
  });
});
