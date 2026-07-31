/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";

interface PackageLockEntry {
  integrity?: string;
  resolved?: string;
}

interface PackageLockJson {
  packages?: Record<string, PackageLockEntry>;
}

const repositoryRootPath: string = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);
const npmrcPath: string = path.join(repositoryRootPath, ".npmrc");
const packageLockPath: string = path.join(
  repositoryRootPath,
  "package-lock.json",
);
const releaseInitiatePath: string = path.join(
  repositoryRootPath,
  ".github",
  "workflows",
  "release-initiate.yml",
);

/*
 * The three hosts the 1ES public npm feed itself uses for anonymous mirror
 * restores. The CFSClean network isolation policy on the Azure DevOps pull
 * request pipelines approves only these hosts, under this exact feed path.
 */
const approvedMirrorPrefixes: readonly string[] = [
  "https://ms-feed-2.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
  "https://ms-feed-12.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
  "https://ms-feed-25.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
];

const publicRegistryHost = "registry.npmjs.org";

const readNpmrcRegistryHost = (npmrcContents: string): string => {
  const registryMatch: RegExpExecArray | null =
    /^registry\s*=\s*(?<registry>https?:\/\/[^/]+)\//mu.exec(npmrcContents);

  assert.ok(registryMatch !== null, "Expected .npmrc to declare a registry");

  const registryGroups: RegExpExecArray["groups"] | undefined =
    registryMatch.groups;
  if (typeof registryGroups === "undefined") {
    throw new TypeError("Expected .npmrc to declare a registry");
  }

  const registryUrl: string | undefined = registryGroups.registry;
  if (typeof registryUrl !== "string") {
    throw new TypeError("Expected .npmrc to declare a registry");
  }

  return new URL(registryUrl).host;
};

describe("package-lock.json registry policy", (): void => {
  const npmrcContents: string = fs.readFileSync(npmrcPath, "utf8");
  const npmrcRegistryHost: string = readNpmrcRegistryHost(npmrcContents);
  const packageLockContents: string = fs.readFileSync(packageLockPath, "utf8");
  const packageLockJson: PackageLockJson = JSON.parse(
    packageLockContents,
  ) as PackageLockJson;
  const resolvedEntries: [string, PackageLockEntry & { resolved: string }][] =
    [];

  for (const [packageName, packageEntry] of Object.entries(
    packageLockJson.packages ?? {},
  )) {
    if (typeof packageEntry.resolved !== "string") {
      continue;
    }

    resolvedEntries.push([
      packageName,
      packageEntry as PackageLockEntry & { resolved: string },
    ]);
  }

  it("should declare the public npm registry in .npmrc as the developer default", (): void => {
    // Assert
    assert.equal(npmrcRegistryHost, publicRegistryHost);
  });

  it("should keep every committed resolved package URL on an approved 1ES mirror host", (): void => {
    // Assert
    assert.notEqual(resolvedEntries.length, 0);

    for (const [packageName, packageEntry] of resolvedEntries) {
      const resolvedUrl: string = packageEntry.resolved;

      assert.equal(
        approvedMirrorPrefixes.some((prefix) =>
          resolvedUrl.startsWith(prefix),
        ),
        true,
        `Expected '${packageName}' to resolve from an approved 1ES mirror, but found '${resolvedUrl}'.`,
      );
    }
  });

  it("should not commit any resolved package URL from the public npm registry", (): void => {
    // Assert
    for (const [packageName, packageEntry] of resolvedEntries) {
      const resolvedUrl: string = packageEntry.resolved;

      if (!resolvedUrl.startsWith("http://") && !resolvedUrl.startsWith("https://")) {
        continue;
      }

      assert.notEqual(
        new URL(resolvedUrl).host,
        publicRegistryHost,
        `Expected '${packageName}' to avoid resolving from the public npm registry '${publicRegistryHost}'.`,
      );
    }
  });

  it("should keep integrity for every resolved package entry", (): void => {
    // Assert
    for (const [packageName, packageEntry] of resolvedEntries) {
      assert.equal(
        typeof packageEntry.integrity,
        "string",
        `Expected '${packageName}' to retain integrity.`,
      );
      assert.notEqual(
        packageEntry.integrity,
        "",
        `Expected '${packageName}' to retain a non-empty integrity.`,
      );
    }
  });
});

describe("release-initiate.yml lockfile normalization ordering", (): void => {
  const workflowContents: string = fs.readFileSync(
    releaseInitiatePath,
    "utf8",
  );
  const stepNamePattern = /- name: (?<name>.+)/gu;
  const stepNames: string[] = [...workflowContents.matchAll(stepNamePattern)]
    .map((match) => match.groups?.name)
    .filter((name): name is string => typeof name === "string");

  const dependenciesStepIndex: number = stepNames.indexOf(
    "npm – Update Transitive Dependencies",
  );
  const normalizeStepIndex: number = stepNames.indexOf(
    "npm – Normalize Lockfile Registry",
  );
  const commitStepIndices: number[] = stepNames.reduce<number[]>(
    (indices, name, index) => {
      if (name === "Git – Commit & Push (Signed)") {
        indices.push(index);
      }

      return indices;
    },
    [],
  );

  it("should include a lockfile normalization step", (): void => {
    // Assert
    assert.notEqual(normalizeStepIndex, -1);
  });

  it("should run the normalization step immediately after the dependency update", (): void => {
    // Assert
    assert.notEqual(dependenciesStepIndex, -1);
    assert.equal(normalizeStepIndex, dependenciesStepIndex + 1);
  });

  it("should run the normalization step before the dependency update is committed", (): void => {
    // Arrange
    const commitStepIndex: number = commitStepIndices.find(
      (index) => index > normalizeStepIndex,
    ) ?? -1;

    // Assert
    assert.notEqual(commitStepIndex, -1);
    assert.ok(normalizeStepIndex < commitStepIndex);
  });

  it("should invoke the normalization script without credentials", (): void => {
    // Arrange
    const stepPattern =
      /- name: npm – Normalize Lockfile Registry\s*\n\s*run: (?<command>.+)/u;
    const stepMatch: RegExpExecArray | null = stepPattern.exec(
      workflowContents,
    );

    // Assert
    assert.ok(stepMatch !== null, "Expected to find the normalization step");
    assert.equal(
      stepMatch.groups?.command,
      "node scripts/normalize-package-lock-registry.mjs",
    );

    const normalizeStepBlock: string = workflowContents
      .split("- name: npm – Normalize Lockfile Registry")[1]
      ?.split(/\n\s*- name:/u)[0] ?? "";
    assert.equal(normalizeStepBlock.includes("token:"), false);
    assert.equal(normalizeStepBlock.includes("secrets."), false);
  });
});
