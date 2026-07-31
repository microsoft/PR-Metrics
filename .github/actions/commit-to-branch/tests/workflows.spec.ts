/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import assert from "node:assert/strict";
import { join } from "node:path";

const repositoryRoot: string = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
);
const actionPath: string = join(
  repositoryRoot,
  ".github",
  "actions",
  "commit-to-branch",
);
const localActionReference = "uses: ./.github/actions/commit-to-branch";
/*
 * The scan excludes test sources, as the forbidden references appear within the
 * assertions themselves.
 */
const excludedDirectories: string[] = [
  ".git",
  "debug",
  "dist",
  "integration",
  "node_modules",
  "release",
  "tests",
];

const readText = (path: string): string =>
  readFileSync(path, "utf8").replaceAll("\r\n", "\n");

const readWorkflow = (name: string): string =>
  readText(join(repositoryRoot, ".github", "workflows", name));

const getJobSection = (content: string, jobId: string): string => {
  const lines: string[] = content.split("\n");
  const startIndex: number = lines.indexOf(`  ${jobId}:`);
  assert.notEqual(startIndex, -1, `The job '${jobId}' was not found.`);
  let endIndex: number = lines.length;
  for (let index: number = startIndex + 1; index < lines.length; index += 1) {
    if (/^ {2}\S/u.test(lines[index] ?? "")) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join("\n");
};

const getFiles = (directory: string): string[] => {
  const result: string[] = [];
  readdirSync(directory).forEach((entry: string): void => {
    const entryPath: string = join(directory, entry);
    if (statSync(entryPath).isDirectory()) {
      if (!excludedDirectories.includes(entry)) {
        result.push(...getFiles(entryPath));
      }
    } else {
      result.push(entryPath);
    }
  });

  return result;
};

const countOccurrences = (content: string, value: string): number =>
  content.split(value).length - 1;

describe("workflows", (): void => {
  describe("commit automation", (): void => {
    it("should not reference the third-party commit action anywhere", (): void => {
      // Arrange
      const files: string[] = [
        ...getFiles(join(repositoryRoot, ".github")),
        ...getFiles(join(repositoryRoot, "docs")),
        join(repositoryRoot, "README.md"),
        join(repositoryRoot, "AGENTS.md"),
      ];

      // Act
      const matches: string[] = files.filter((value: string): boolean =>
        readText(value).includes("github-api-commit-action"),
      );

      // Assert
      assert.deepEqual(matches, []);
    });

    it("should not reference the third-party commit action publisher anywhere", (): void => {
      // Arrange
      const files: string[] = getFiles(join(repositoryRoot, ".github"));

      // Act
      const matches: string[] = files.filter((value: string): boolean =>
        readText(value).includes("grafana/"),
      );

      // Assert
      assert.deepEqual(matches, []);
    });
  });

  describe("build.yml", (): void => {
    it("should preserve the pull request validation job identifiers and names", (): void => {
      // Arrange
      const content: string = readWorkflow("build.yml");

      // Assert
      assert.ok(content.includes("\n  update-code:\n"));
      assert.ok(content.includes("\n    name: Update Code\n"));
      assert.ok(content.includes("\n  validate-linter:\n"));
      assert.ok(content.includes("\n    name: Validate – Linter\n"));
      assert.ok(content.includes("\n  build:\n"));
      assert.ok(content.includes("\n  validate:\n"));
      assert.ok(content.includes("\n  test-github-action:\n"));
      assert.ok(content.includes("\n  dependabot:\n"));
    });

    it("should never commit from a pull request validation job", (): void => {
      // Arrange
      const content: string = readWorkflow("build.yml");

      // Assert
      assert.equal(content.includes(localActionReference), false);
      assert.equal(content.includes("git stash"), false);
      assert.equal(content.includes("git commit"), false);
      assert.equal(content.includes("git push"), false);
    });

    {
      const testCases: string[] = ["update-code", "validate-linter"];

      testCases.forEach((value: string): void => {
        it(`should not request write access to contents within the '${value}' job`, (): void => {
          // Arrange
          const section: string = getJobSection(
            readWorkflow("build.yml"),
            value,
          );

          // Assert
          assert.equal(section.includes('"contents":"write"'), false);
          assert.equal(section.includes("contents: write"), false);
        });

        it(`should fail rather than auto-fix within the '${value}' job`, (): void => {
          // Arrange
          const section: string = getJobSection(
            readWorkflow("build.yml"),
            value,
          );

          // Assert
          assert.ok(
            section.includes(".github/workflow-scripts/Assert-NoChanges.ps1"),
          );
        });
      });
    }

    it("should not mint an application token within the 'update-code' job", (): void => {
      // Arrange
      const section: string = getJobSection(
        readWorkflow("build.yml"),
        "update-code",
      );

      // Assert
      assert.equal(section.includes("mint-github-app-token"), false);
      assert.equal(section.includes("id-token: write"), false);
    });

    it("should limit the linter token to status updates", (): void => {
      // Arrange
      const section: string = getJobSection(
        readWorkflow("build.yml"),
        "validate-linter",
      );

      // Assert
      assert.ok(section.includes('permissions: \'{"statuses":"write"}\''));
    });
  });

  describe("release-initiate.yml", (): void => {
    it("should commit through the repository owned action only", (): void => {
      // Arrange
      const content: string = readWorkflow("release-initiate.yml");

      // Assert
      assert.equal(countOccurrences(content, localActionReference), 2);
      assert.equal(countOccurrences(content, "uses: grafana/"), 0);
    });

    it("should guard against initiation from a branch other than main", (): void => {
      // Arrange
      const content: string = readWorkflow("release-initiate.yml");

      // Act
      const guardIndex: number = content.indexOf(
        "github.ref != 'refs/heads/main'",
      );
      const checkoutIndex: number = content.indexOf("uses: actions/checkout@");
      const actionIndex: number = content.indexOf(localActionReference);

      // Assert
      assert.notEqual(guardIndex, -1);
      assert.notEqual(checkoutIndex, -1);
      assert.notEqual(actionIndex, -1);
      assert.ok(guardIndex < checkoutIndex);
      assert.ok(checkoutIndex < actionIndex);
    });

    it("should check out the trusted main branch explicitly", (): void => {
      // Arrange
      const content: string = readWorkflow("release-initiate.yml");

      // Assert
      assert.equal(countOccurrences(content, "ref: main"), 2);
    });

    it("should create the release branch only for the first commit", (): void => {
      // Arrange
      const content: string = readWorkflow("release-initiate.yml");

      // Assert
      assert.equal(countOccurrences(content, "create-branch: true"), 1);
      assert.equal(countOccurrences(content, "stage-all: true"), 2);
      assert.equal(
        countOccurrences(
          content,
          // eslint-disable-next-line no-template-curly-in-string -- The value is a workflow expression rather than a template.
          "token: ${{ steps.app-token.outputs.token }}",
        ),
        3,
      );
    });
  });

  describe("action.yml", (): void => {
    it("should run the committed Node.js bundle", (): void => {
      // Arrange
      const content: string = readText(join(actionPath, "action.yml"));

      // Assert
      assert.ok(content.includes("using: node24"));
      assert.ok(content.includes("main: dist/index.mjs"));
    });

    it("should declare every input used by the workflows", (): void => {
      // Arrange
      const content: string = readText(join(actionPath, "action.yml"));

      // Assert
      assert.ok(content.includes("\n  branch:\n"));
      assert.ok(content.includes("\n  commit-message:\n"));
      assert.ok(content.includes("\n  create-branch:\n"));
      assert.ok(content.includes("\n  stage-all:\n"));
      assert.ok(content.includes("\n  token:\n"));
    });

    it("should have a committed bundle", (): void => {
      // Act
      const stats: ReturnType<typeof statSync> = statSync(
        join(actionPath, "dist", "index.mjs"),
      );

      // Assert
      assert.ok(stats.size > 0);
    });
  });
});
