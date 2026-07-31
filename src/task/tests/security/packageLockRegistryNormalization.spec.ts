/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import assert from "node:assert/strict";

interface NormalizationOutcome {
  contents: string;
  status: number;
  stderr: string;
  stdout: string;
}

describe("scripts/normalize-package-lock-registry.mjs", (): void => {
  const repositoryPath: string = path.join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
  );
  const scriptPath: string = path.join(
    repositoryPath,
    "scripts",
    "normalize-package-lock-registry.mjs",
  );
  const scratchPath: string = path.join(
    import.meta.dirname,
    "packageLockRegistryNormalization",
  );

  const publicRegistryPrefix = "https://registry.npmjs.org/";

  /*
   * The mirror prefix that every rewritten URL adopts. The 1ES public feed
   * answers on several hosts, so the URLs the mirror itself records are
   * preserved as they are, but a URL this script rewrites always names the
   * single canonical host.
   */
  const mirrorPrefix =
    "https://ms-feed-25.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/";

  const approvedPrefixes: string[] = [
    "https://ms-feed-2.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
    "https://ms-feed-12.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/",
    mirrorPrefix,
  ];

  const packageSuffix = "example/-/example-1.0.0.tgz";

  const createEntry = (name: string, resolved: string): string =>
    [
      `    "node_modules/${name}": {`,
      `      "version": "1.0.0",`,
      `      "resolved": "${resolved}",`,
      `      "integrity": "sha512-${name}Integrity",`,
      `      "dev": true,`,
      `      "license": "MIT",`,
      `      "engines": {`,
      `        "node": ">=24.13.0"`,
      `      }`,
      `    }`,
    ].join("\n");

  const createLockfile = (...entries: string[]): string =>
    [
      "{",
      '  "name": "prmetrics",',
      '  "version": "1.7.16",',
      '  "lockfileVersion": 3,',
      '  "requires": true,',
      '  "packages": {',
      '    "": {',
      '      "name": "prmetrics",',
      '      "version": "1.7.16"',
      "    },",
      entries.join(",\n"),
      "  }",
      "}",
      "",
    ].join("\n");

  const normalize = (contents: string): NormalizationOutcome => {
    const lockfilePath: string = path.join(scratchPath, "package-lock.json");
    fs.writeFileSync(lockfilePath, contents);
    const outcome: SpawnSyncReturns<string> = spawnSync(
      process.execPath,
      [scriptPath, lockfilePath],
      { encoding: "utf8" },
    );
    return {
      contents: fs.readFileSync(lockfilePath, "utf8"),
      status: outcome.status ?? -1,
      stderr: outcome.stderr,
      stdout: outcome.stdout,
    };
  };

  beforeEach((): void => {
    fs.rmSync(scratchPath, { force: true, recursive: true });
    fs.mkdirSync(scratchPath, { recursive: true });
  });

  after((): void => {
    fs.rmSync(scratchPath, { force: true, recursive: true });
  });

  it("should exist within the repository", (): void => {
    // Assert
    assert.equal(fs.existsSync(scriptPath), true);
  });

  it("should rewrite a public registry URL to the approved mirror", (): void => {
    // Arrange
    const contents: string = createLockfile(
      createEntry("example", `${publicRegistryPrefix}${packageSuffix}`),
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(
      outcome.stdout.startsWith(
        `Rewrote 1 resolved URL(s) of '${path.join(scratchPath, "package-lock.json")}' to '${mirrorPrefix}'.`,
      ),
      true,
    );
    assert.equal(
      outcome.contents,
      createLockfile(createEntry("example", `${mirrorPrefix}${packageSuffix}`)),
    );
  });

  it("should rewrite a scoped public registry URL to the approved mirror", (): void => {
    // Arrange
    const suffix = "@octokit/core/-/core-7.0.0.tgz";
    const contents: string = createLockfile(
      createEntry("scoped", `${publicRegistryPrefix}${suffix}`),
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(
      outcome.contents.includes(`"resolved": "${mirrorPrefix}${suffix}"`),
      true,
    );
  });

  approvedPrefixes.forEach((prefix: string): void => {
    it(`should preserve the approved URL prefix '${prefix}'`, (): void => {
      // Arrange
      const contents: string = createLockfile(
        createEntry("example", `${prefix}${packageSuffix}`),
      );

      // Act
      const outcome: NormalizationOutcome = normalize(contents);

      // Assert
      assert.equal(outcome.status, 0, outcome.stderr);
      assert.equal(outcome.contents, contents);
    });
  });

  it("should preserve the integrity, ordering and structure of every entry", (): void => {
    // Arrange
    const contents: string = createLockfile(
      createEntry("first", `${publicRegistryPrefix}first/-/first-1.0.0.tgz`),
      createEntry(
        "second",
        `${approvedPrefixes[0] ?? ""}second/-/second-2.0.0.tgz`,
      ),
      createEntry("third", `${publicRegistryPrefix}third/-/third-3.0.0.tgz`),
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(
      outcome.stdout.startsWith("Rewrote 2 resolved URL(s)"),
      true,
    );
    assert.equal(
      outcome.contents,
      createLockfile(
        createEntry("first", `${mirrorPrefix}first/-/first-1.0.0.tgz`),
        createEntry(
          "second",
          `${approvedPrefixes[0] ?? ""}second/-/second-2.0.0.tgz`,
        ),
        createEntry("third", `${mirrorPrefix}third/-/third-3.0.0.tgz`),
      ),
    );
    assert.equal(
      contents.replace(/"resolved": "[^"]*"/gu, ""),
      outcome.contents.replace(/"resolved": "[^"]*"/gu, ""),
    );
  });

  it("should reject an unexpected host", (): void => {
    // Arrange
    const resolved = `https://registry.example.com/${packageSuffix}`;
    const contents: string = createLockfile(createEntry("example", resolved));

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.stderr.includes(resolved), true);
    assert.equal(outcome.contents, contents);
  });

  it("should reject an unapproved Azure Artifacts host", (): void => {
    // Arrange
    const resolved = `https://ms-feed-99.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/${packageSuffix}`;
    const contents: string = createLockfile(createEntry("example", resolved));

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.stderr.includes(resolved), true);
    assert.equal(outcome.contents, contents);
  });

  it("should reject an unapproved feed path on an approved host", (): void => {
    // Arrange
    const resolved = `https://ms-feed-2.pkgs.visualstudio.com/attacker/_packaging/attacker/npm/registry/${packageSuffix}`;
    const contents: string = createLockfile(createEntry("example", resolved));

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.stderr.includes(resolved), true);
    assert.equal(outcome.contents, contents);
  });

  it("should reject an insecure transport", (): void => {
    // Arrange
    const resolved = `http://ms-feed-2.pkgs.visualstudio.com/1es-public/_packaging/npm-public/npm/registry/${packageSuffix}`;
    const contents: string = createLockfile(createEntry("example", resolved));

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.stderr.includes(resolved), true);
    assert.equal(outcome.contents, contents);
  });

  it("should reject an insecure public registry URL", (): void => {
    // Arrange
    const resolved = `http://registry.npmjs.org/${packageSuffix}`;
    const contents: string = createLockfile(createEntry("example", resolved));

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.stderr.includes(resolved), true);
    assert.equal(outcome.contents, contents);
  });

  it("should reject a resolved URL that is not an HTTP URL", (): void => {
    // Arrange
    const resolved = "file:../attacker/example-1.0.0.tgz";
    const contents: string = createLockfile(createEntry("example", resolved));

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.stderr.includes(resolved), true);
    assert.equal(outcome.contents, contents);
  });

  it("should reject every unapproved URL before writing any change", (): void => {
    // Arrange
    const resolved = `https://registry.example.com/${packageSuffix}`;
    const contents: string = createLockfile(
      createEntry("first", `${publicRegistryPrefix}first/-/first-1.0.0.tgz`),
      createEntry("second", resolved),
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 1);
    assert.equal(outcome.contents, contents);
  });

  it("should rewrite repeatedly to the same result", (): void => {
    // Arrange
    const contents: string = createLockfile(
      createEntry("example", `${publicRegistryPrefix}${packageSuffix}`),
    );

    // Act
    const first: NormalizationOutcome = normalize(contents);
    const second: NormalizationOutcome = normalize(first.contents);

    // Assert
    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(second.contents, first.contents);
  });

  it("should leave the committed lockfile unchanged", (): void => {
    // Arrange
    const contents: string = fs.readFileSync(
      path.join(repositoryPath, "package-lock.json"),
      "utf8",
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(outcome.contents, contents);
  });

  it("should record every rewrite within its output", (): void => {
    // Arrange
    const contents: string = createLockfile(
      createEntry("first", `${publicRegistryPrefix}first/-/first-1.0.0.tgz`),
      createEntry("second", `${publicRegistryPrefix}second/-/second-2.0.0.tgz`),
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(outcome.stdout.includes("2"), true);
  });

  it("should write valid JSON", (): void => {
    // Arrange
    const contents: string = createLockfile(
      createEntry("example", `${publicRegistryPrefix}${packageSuffix}`),
    );

    // Act
    const outcome: NormalizationOutcome = normalize(contents);

    // Assert
    assert.equal(outcome.status, 0, outcome.stderr);
    assert.doesNotThrow((): void => {
      JSON.parse(outcome.contents);
    });
  });
});
