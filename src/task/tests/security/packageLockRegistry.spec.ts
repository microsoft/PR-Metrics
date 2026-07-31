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
const packageLockPath: string = path.join(repositoryRootPath, "package-lock.json");
const oldRegistryPrefixes: readonly string[] = [
  "https://ms-feed-2.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
  "https://ms-feed-12.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
  "https://ms-feed-25.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
];

const readRegistryHost = (npmrcContents: string): string => {
  const registryMatch: RegExpExecArray | null = /^registry\s*=\s*(?<registry>https?:\/\/[^/]+)\//mu.exec(
    npmrcContents,
  );

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
  const registryHost: string = new URL(registryUrl).host;

  assert.notEqual(registryHost, "", "Expected .npmrc registry host to exist");

  return registryHost;
};

describe("package-lock.json registry provenance", (): void => {
  const npmrcContents: string = fs.readFileSync(npmrcPath, "utf8");
  const registryHost: string = readRegistryHost(npmrcContents);
  const packageLockContents: string = fs.readFileSync(packageLockPath, "utf8");
  const packageLockJson: PackageLockJson = JSON.parse(
    packageLockContents,
  ) as PackageLockJson;
  const resolvedEntries: [
    string,
    PackageLockEntry & { resolved: string },
  ][] = [];

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

  it("should declare the public npm registry in .npmrc", (): void => {
    // Assert
    assert.equal(registryHost, "registry.npmjs.org");
  });

  it("should not contain resolved package URLs from deprecated proxy hosts", (): void => {
    // Assert
    for (const [packageName, packageEntry] of resolvedEntries) {
      const resolvedUrl: string = packageEntry.resolved;

      for (const oldRegistryPrefix of oldRegistryPrefixes) {
        assert.equal(
          resolvedUrl.startsWith(oldRegistryPrefix),
          false,
          `Expected '${packageName}' to avoid deprecated registry prefix '${oldRegistryPrefix}'.`,
        );
      }
    }
  });

  it("should keep every http(s) resolved package URL on the declared registry host", (): void => {
    // Assert
    for (const [packageName, packageEntry] of resolvedEntries) {
      const resolvedUrl: string = packageEntry.resolved;

      if (!resolvedUrl.startsWith("http://") && !resolvedUrl.startsWith("https://")) {
        continue;
      }

      assert.equal(
        new URL(resolvedUrl).host,
        registryHost,
        `Expected '${packageName}' to resolve from '${registryHost}'.`,
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
