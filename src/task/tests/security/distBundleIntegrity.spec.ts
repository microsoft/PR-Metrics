/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";

interface PackageJson {
  scripts: Record<string, string>;
}

const repositoryRootPath: string = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

const readRepositoryFile = (...relativePath: string[]): string =>
  fs.readFileSync(path.join(repositoryRootPath, ...relativePath), "utf8");

const splitLines = (contents: string): string[] =>
  contents.replaceAll("\r\n", "\n").split("\n");

const getJobLines = (workflowContents: string, jobName: string): string[] => {
  const lines: string[] = splitLines(workflowContents);
  const startIndex: number = lines.indexOf(`  ${jobName}:`);

  assert.notEqual(startIndex, -1, `Could not find the job '${jobName}'.`);

  const relativeEndIndex: number = lines
    .slice(startIndex + 1)
    .findIndex(
      (line: string): boolean =>
        line.startsWith("  ") &&
        !line.startsWith("   ") &&
        line.trimEnd().endsWith(":"),
    );

  return relativeEndIndex === -1
    ? lines.slice(startIndex)
    : lines.slice(startIndex, startIndex + 1 + relativeEndIndex);
};

const getStepIndex = (jobLines: string[], fragment: string): number => {
  const index: number = jobLines.findIndex((line: string): boolean =>
    line.includes(fragment),
  );

  assert.notEqual(index, -1, `Could not find a step containing '${fragment}'.`);

  return index;
};

const getLocalActionIndex = (jobLines: string[]): number => {
  const index: number = jobLines.findIndex(
    (line: string): boolean => line.trim() === "uses: ./",
  );

  assert.notEqual(index, -1, "Could not find a step running the local action.");

  return index;
};

describe("committed dist bundle integrity", (): void => {
  const gitleaksConfiguration: string = readRepositoryFile(
    ".github",
    "linters",
    "gitleaks.toml",
  );
  const workflowContents: string = readRepositoryFile(
    ".github",
    "workflows",
    "build.yml",
  );
  const packageJson: PackageJson = JSON.parse(
    readRepositoryFile("package.json"),
  ) as PackageJson;
  const superLinterReference =
    "super-linter/super-linter@4ce20838b8ab83717e78138c5b3a1407148e0918 # v8.7.0";

  describe("gitleaks.toml", (): void => {
    it("does not allowlist the committed dist bundle", (): void => {
      assert.equal(gitleaksConfiguration.includes("dist"), false);
      assert.equal(/^\s*paths\s*=/mu.test(gitleaksConfiguration), false);
      assert.equal(/^\s*files\s*=/mu.test(gitleaksConfiguration), false);
    });

    it("allows known false positives by their shape alone", (): void => {
      assert.equal(gitleaksConfiguration.includes("[allowlist]"), true);
      assert.equal(
        gitleaksConfiguration.includes('regexTarget = "match"'),
        true,
      );
      assert.equal(gitleaksConfiguration.includes("RESOURCE_AREA_ID"), true);
    });

    it("continues to extend the default gitleaks rules", (): void => {
      assert.equal(gitleaksConfiguration.includes("useDefault = true"), true);
    });
  });

  describe("dedicated dist secret scan", (): void => {
    const getScanJobLines = (): string[] =>
      getJobLines(workflowContents, "validate-dist-secrets");

    it("scans the whole committed bundle with a pinned Gitleaks run", (): void => {
      const job: string = getScanJobLines().join("\n");

      assert.equal(job.includes(`uses: ${superLinterReference}`), true);
      assert.equal(job.includes("FILTER_REGEX_INCLUDE: .*dist/.*"), true);
      assert.equal(job.includes("GITLEAKS_CONFIG_FILE: gitleaks.toml"), true);
      assert.equal(job.includes("VALIDATE_ALL_CODEBASE: true"), true);
      assert.equal(job.includes("VALIDATE_GITLEAKS: true"), true);
      assert.equal(job.includes("FILTER_REGEX_EXCLUDE"), false);
    });

    it("runs no linter other than Gitleaks", (): void => {
      const jobLines: string[] = getScanJobLines();
      const validateEntries: string[] = jobLines
        .map((line: string): string => line.trim())
        .filter((line: string): boolean => line.startsWith("VALIDATE_"));

      assert.deepEqual(validateEntries, [
        "VALIDATE_ALL_CODEBASE: true",
        "VALIDATE_GITLEAKS: true",
      ]);
      assert.equal(
        jobLines.some((line: string): boolean =>
          line.trim().startsWith("FIX_"),
        ),
        false,
      );
    });

    it("publishes no status context that duplicates the linter job", (): void => {
      const job: string = getScanJobLines().join("\n");

      assert.equal(job.includes("MULTI_STATUS: false"), true);
      assert.equal(
        job.includes("ENABLE_GITHUB_PULL_REQUEST_SUMMARY_COMMENT: false"),
        true,
      );
      assert.equal(job.includes("permissions: {}"), true);
      assert.equal(job.includes("GITHUB_TOKEN"), false);
      assert.equal(job.includes("name: Validate – Linter"), false);
    });
  });

  describe("existing status contexts", (): void => {
    it("preserves the linter job and its Gitleaks configuration", (): void => {
      const job: string = getJobLines(workflowContents, "validate-linter").join(
        "\n",
      );

      assert.equal(job.includes("name: Validate – Linter"), true);
      assert.equal(job.includes(`uses: ${superLinterReference}`), true);
      assert.equal(job.includes("GITLEAKS_CONFIG_FILE: gitleaks.toml"), true);
      assert.equal(job.includes("FILTER_REGEX_EXCLUDE: .*dist/.*"), true);
      assert.equal(job.includes("MULTI_STATUS"), false);
    });
  });

  describe("Test GitHub Action job", (): void => {
    const jobLines: string[] = getJobLines(
      workflowContents,
      "test-github-action",
    );

    it("preserves the job name so the required check context is unchanged", (): void => {
      assert.equal(jobLines[1], "    name: Test GitHub Action");
    });

    it("verifies bundle reproducibility before minting a token or running the action", (): void => {
      const checkoutIndex: number = getStepIndex(jobLines, "actions/checkout@");
      const buildIndex: number = getStepIndex(
        jobLines,
        "run: node scripts/build-committed-bundles.mjs",
      );
      const diffIndex: number = getStepIndex(
        jobLines,
        "git diff --exit-code -- dist",
      );
      const mintIndex: number = getStepIndex(
        jobLines,
        ".github/actions/mint-github-app-token",
      );
      const actionIndex: number = getLocalActionIndex(jobLines);

      assert.equal(checkoutIndex < buildIndex, true);
      assert.equal(buildIndex < diffIndex, true);
      assert.equal(diffIndex < mintIndex, true);
      assert.equal(mintIndex < actionIndex, true);
    });

    it("builds every committed bundle through the shared helper script", (): void => {
      const buildIndex: number = getStepIndex(
        jobLines,
        "run: node scripts/build-committed-bundles.mjs",
      );

      assert.equal(
        jobLines[buildIndex - 1]?.trim(),
        "- name: npm – Build Committed Bundles",
      );
      assert.equal(
        jobLines.some((line: string): boolean =>
          line.includes("npm run build:package"),
        ),
        false,
      );
    });

    it("detects generated files that are absent from the commit", (): void => {
      const trackIndex: number = getStepIndex(
        jobLines,
        "git add --intent-to-add --ignore-removal -- dist",
      );
      const diffIndex: number = getStepIndex(
        jobLines,
        "git diff --exit-code -- dist",
      );

      assert.equal(trackIndex < diffIndex, true);
    });

    it("also tracks and diffs any repository-owned local action bundle when present", (): void => {
      const trackJobLines: string[] = jobLines.slice(
        getStepIndex(jobLines, "name: Git – Track Generated Files"),
        getStepIndex(jobLines, "name: Git – Verify Bundle Reproducibility"),
      );
      const diffJobLines: string[] = jobLines.slice(
        getStepIndex(jobLines, "name: Git – Verify Bundle Reproducibility"),
      );

      for (const stepLines of [trackJobLines, diffJobLines]) {
        const stepText: string = stepLines.join("\n");

        assert.equal(stepText.includes(".github/actions"), true);
        assert.equal(stepText.includes("dist"), true);
        assert.equal(
          /if\s*\(\$actionDistPaths\)/u.test(stepText),
          true,
          "Expected the local action bundle paths to be guarded so a repository with none does not fail the step.",
        );
      }
    });

    it("propagates a non-zero exit code from either diff so the job fails on any difference", (): void => {
      const diffStepStart: number = getStepIndex(
        jobLines,
        "name: Git – Verify Bundle Reproducibility",
      );
      const diffStepLines: string[] = jobLines.slice(diffStepStart);
      const exitCodeChecks: number = diffStepLines.filter(
        (line: string): boolean => line.includes("$LASTEXITCODE"),
      ).length;

      assert.equal(exitCodeChecks >= 2, true);
    });
  });

  describe("package.json", (): void => {
    it("empties the generated bundle before rebuilding it", (): void => {
      const buildPackage: string = packageJson.scripts["build:package"] ?? "";
      const resetIndex: number = buildPackage.indexOf(
        "npm run build:package:reset",
      );
      const buildIndex: number = buildPackage.indexOf("ncc build");

      assert.notEqual(resetIndex, -1);
      assert.notEqual(buildIndex, -1);
      assert.equal(resetIndex < buildIndex, true);
      assert.equal(
        packageJson.scripts["build:package:reset"],
        "node scripts/clean-dist.mjs",
      );
    });
  });
});
