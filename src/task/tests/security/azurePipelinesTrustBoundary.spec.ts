/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";

interface PackageLock {
  packages: Record<string, PackageLockEntry>;
}

interface PackageLockEntry {
  integrity?: string;
  resolved?: string;
}

interface PackageManifest {
  scripts: Record<string, string>;
}

interface PipelineStep {
  condition: string;
  contents: string;
  displayName: string;
  kind: string;
  value: string;
}

interface RepositoryResource {
  alias: string;
  properties: Map<string, string>;
}

describe("azure-devops pipelines", (): void => {
  const repositoryPath: string = path.join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
  );
  const pipelinesPath: string = path.join(
    repositoryPath,
    ".github",
    "azure-devops",
  );

  const validationTemplateFile = "pr-validation-template.yml";
  const productionTemplateFile = "template.yml";
  const pullRequestRootFiles: string[] = ["pr.yml", "pr-test.yml"];
  const selfRepositoryAlias = "self";

  /*
   * The pull request pipelines restore dependencies anonymously. Every package
   * is pinned by package-lock.json to the 1ES public npm mirror, which the
   * network isolation policy (CFSClean) approves, together with an integrity
   * hash, so no feed credential is created, injected or destroyed anywhere
   * within the pull request graph.
   */
  const approvedFeedHosts: string[] = [
    "ms-feed-12.pkgs.visualstudio.com",
    "ms-feed-2.pkgs.visualstudio.com",
    "ms-feed-25.pkgs.visualstudio.com",
  ];
  const approvedFeedPath = "/1es-public/_packaging/npm-public/npm/registry/";

  /*
   * The mirror supplies SHA-1 Subresource Integrity hashes for the packages it
   * proxies, which npm verifies on every restore, so those are accepted
   * alongside the stronger algorithms.
   */
  const integrityPattern = /^sha(?:1|256|384|512)-[A-Za-z0-9+/]+={0,2}$/u;

  /*
   * '--replace-registry-host=never' fetches each package from the exact URL
   * recorded in the lockfile, so no registry configuration can redirect the
   * restore; '--no-audit' avoids the only other host a restore would reach;
   * and '--ignore-scripts' blocks pull request controlled package.json scripts.
   */
  const restoreCommand =
    "npm ci --ignore-scripts --no-audit --replace-registry-host=never";

  const checkoutStepName = "Checkout";
  const nodeStepName = "Install Node.js";
  const restoreStepName = "npm – Restore Dependencies";

  const restoreBoundary: string[] = [
    checkoutStepName,
    nodeStepName,
    restoreStepName,
  ];

  const restoringJobIds: string[] = [
    "Prerequisites",
    "PRMetrics_Ubuntu",
    "PRMetrics_Windows",
  ];

  const expectedJobs: Map<string, string> = new Map<string, string>([
    ["Prerequisites", "Prerequisites"],
    ["PRMetrics_Ubuntu", "PR Metrics – Ubuntu"],
    ["PRMetrics_Windows", "PR Metrics – Windows"],
    ["Validation", "Validation"],
  ]);

  const expectedSteps: Map<string, string[]> = new Map<string, string[]>([
    ["Prerequisites", [...restoreBoundary, "npm – Lint"]],
    ["PRMetrics_Ubuntu", [...restoreBoundary, "npm – Test"]],
    ["PRMetrics_Windows", [...restoreBoundary, "npm – Test"]],
    [
      "Validation",
      [
        checkoutStepName,
        "Component Detection",
        "PoliCheck",
        "Guardian – Publish Artifacts",
        "Guardian – Perform Analysis",
      ],
    ],
  ]);

  /*
   * The scripts that the pull request pipelines may run. Each must be free of a
   * nested install, as that would restore dependencies outside the pinned
   * command and could therefore reach an unapproved registry.
   */
  const permittedScripts: Map<string, string> = new Map<string, string>([
    ["npm – Lint", "npm run lint"],
    ["npm – Test", "npm run test:fast"],
  ]);

  /*
   * The remote template repositories are pinned in full. A change to the alias,
   * type, name or ref of a declaration, or the addition of any further property
   * such as a service connection endpoint, must fail rather than silently
   * redirect a pipeline at attacker controlled templates.
   */
  const officeTemplateProperties: Map<string, string> = new Map<string, string>(
    [
      ["name", "1ESPipelineTemplates/OfficePipelineTemplates"],
      ["ref", "refs/tags/release"],
      ["type", "git"],
    ],
  );
  const oneEsTemplateProperties: Map<string, string> = new Map<string, string>([
    ["name", "1ESPipelineTemplates/1ESPipelineTemplates"],
    ["ref", "refs/tags/release"],
    ["type", "git"],
  ]);

  const expectedResources: Map<string, RepositoryResource[]> = new Map<
    string,
    RepositoryResource[]
  >([
    [
      "pr.yml",
      [
        {
          alias: "OfficePipelineTemplates",
          properties: officeTemplateProperties,
        },
      ],
    ],
    [
      "pr-test.yml",
      [{ alias: "1ESPipelineTemplates", properties: oneEsTemplateProperties }],
    ],
    [validationTemplateFile, []],
    [
      "prod.yml",
      [
        {
          alias: "OfficePipelineTemplates",
          properties: officeTemplateProperties,
        },
      ],
    ],
    [
      "release.yml",
      [
        {
          alias: "OfficePipelineTemplates",
          properties: officeTemplateProperties,
        },
      ],
    ],
    [productionTemplateFile, []],
  ]);

  const expectedRoots: Map<string, string> = new Map<string, string>([
    [
      "pr.yml",
      "v1/Office.Unofficial.PipelineTemplate.yml@OfficePipelineTemplates",
    ],
    [
      "pr-test.yml",
      "v1/1ES.Unofficial.PipelineTemplate.yml@1ESPipelineTemplates",
    ],
  ]);

  const forbiddenPatterns: Map<string, RegExp> = new Map<string, RegExp>([
    ["a variable group", /^[ \t]*-?[ \t]*group:/mu],
    ["the public npm registry", /registry\.npmjs\.org/u],
    ["an authenticated package feed", /pkgs\.dev\.azure\.com/u],
    ["npm feed authentication", /npmAuthenticate/u],
    ["an npm authentication token", /_authToken|_auth\b|always-auth/u],
    ["an npm registry override", /--registry\b/u],
    ["an npm configuration override", /--userconfig|--globalconfig/u],
    ["an Azure CLI task", /AzureCLI/u],
    [
      "a service connection",
      /azureSubscription|connectionType|ConnectedServiceName|azureRM|customEndpoint|workloadIdentityServiceConnection/u,
    ],
    ["the tfx CLI", /\btfx\b/u],
    ["an Azure DevOps task deployment", /build tasks (?<operation>\S+)/u],
    ["an extension publication", /extension (?<action>create|publish)/u],
    [
      "a GitHub App token",
      /GitHubAppToken|New-GitHubAppToken|mint-github-app-token/u,
    ],
    ["the shared PRMetrics task", /PRMetrics@/u],
    ["the PR Metrics access token", /PR_METRICS_ACCESS_TOKEN/u],
    ["a key vault", /key ?vault/iu],
    ["an access token", /accesstoken/iu],
    ["persisted Git credentials", /persistCredentials:[ \t]*true/u],
    ["ESRP code signing", /EsrpCodeSigning/u],
    ["the Azure DevOps account name", /ADOACCOUNT/u],
    ["an npm configuration file", /npmrc/iu],
  ]);

  const stepKinds: string[] = [
    "bash",
    "checkout",
    "download",
    "powershell",
    "pwsh",
    "script",
    "task",
    "template",
  ];

  const compareStrings = (first: string, second: string): number =>
    first < second ? -1 : Number(first > second);

  const compareEntries = (
    first: [string, string],
    second: [string, string],
  ): number => compareStrings(first[0], second[0]);

  /*
   * Comments are inert, so only the executable YAML is scanned. This allows the
   * templates to document the trust boundary using the very terms it forbids.
   */
  const removeComments = (contents: string): string =>
    contents.replace(/(?<prefix>^|[ \t])#.*$/gmu, "$<prefix>");

  const readPipeline = (fileName: string): string =>
    removeComments(fs.readFileSync(path.join(pipelinesPath, fileName), "utf8"));

  const getPipelineFiles = (): string[] =>
    fs
      .readdirSync(pipelinesPath)
      .filter((fileName: string): boolean => fileName.endsWith(".yml"))
      .sort(compareStrings);

  const normalizeReference = (reference: string): string =>
    reference
      .replace(/^["']/u, "")
      .replace(/["']$/u, "")
      .replace(/\\/gu, "/")
      .replace(/^\.\//u, "");

  const getRepositoryResources = (contents: string): RepositoryResource[] => {
    const result: RepositoryResource[] = [];
    let current: RepositoryResource | null = null;
    let indent = -1;
    for (const line of contents.split(/\r?\n/u)) {
      const start: RegExpExecArray | null =
        /^(?<indent>[ ]*)-[ ]*repository:[ ]*(?<alias>\S+)[ ]*$/u.exec(line);
      if (start !== null) {
        current = {
          alias: start.groups?.alias ?? "",
          properties: new Map<string, string>(),
        };
        indent = (start.groups?.indent ?? "").length;
        result.push(current);
        continue;
      }

      if (current === null) {
        continue;
      }

      const property: RegExpExecArray | null =
        /^(?<indent>[ ]*)(?<name>[A-Za-z]+):[ ]*(?<value>.*?)[ \t]*$/u.exec(
          line,
        );
      if (
        property === null ||
        (property.groups?.indent ?? "").length !== indent + 2
      ) {
        current = null;
        continue;
      }

      current.properties.set(
        property.groups?.name ?? "",
        property.groups?.value ?? "",
      );
    }

    return result;
  };

  const isPinnedResource = (
    declared: RepositoryResource,
    pinned: RepositoryResource,
  ): boolean =>
    declared.alias === pinned.alias &&
    declared.properties.size === pinned.properties.size &&
    Array.from(pinned.properties.entries()).every(
      ([name, value]: [string, string]): boolean =>
        declared.properties.get(name) === value,
    );

  /*
   * A repository resource redirects every reference qualified by its alias, so
   * a declaration is honoured only when it matches the pinned tuple exactly.
   * Anything else – an unexpected alias, an altered type, name or ref, or an
   * added property – fails rather than resolving as a trusted remote template.
   */
  const getRemoteAliases = (contents: string, fileName: string): string[] => {
    const pinned: RepositoryResource[] = expectedResources.get(fileName) ?? [];
    return getRepositoryResources(contents).map(
      (declared: RepositoryResource, index: number): string => {
        const expected: RepositoryResource | undefined = pinned[index];
        if (expected === undefined || !isPinnedResource(declared, expected)) {
          throw new Error(
            `'${fileName}' declares the repository alias '${declared.alias}' with an unpinned declaration.`,
          );
        }

        return declared.alias;
      },
    );
  };

  /*
   * Azure Pipelines resolves a reference of the form 'path@alias' against the
   * repository resource named by the alias, and the built-in 'self' alias names
   * this repository. Treating every qualified reference as remote would
   * therefore allow 'template.yml@self' to smuggle the privileged template back
   * into the pull request graph, so only aliases that the pipeline itself
   * declares, with the pinned declaration, are treated as remote and anything
   * else is rejected outright.
   */
  const resolveTemplateReference = (
    reference: string,
    fileName: string,
    contents: string,
  ): string | null => {
    const normalized: string = normalizeReference(reference);
    const separatorIndex: number = normalized.indexOf("@");
    if (separatorIndex === -1) {
      return normalized;
    }

    const target: string = normalized.slice(0, separatorIndex);
    const alias: string = normalized.slice(separatorIndex + 1);
    if (alias === selfRepositoryAlias) {
      return target;
    }

    if (getRemoteAliases(contents, fileName).includes(alias)) {
      return null;
    }

    throw new Error(
      `'${fileName}' references the template '${reference}' through the undeclared repository alias '${alias}'.`,
    );
  };

  const getLocalTemplateReferences = (
    contents: string,
    fileName: string,
  ): string[] => {
    const result: string[] = [];
    for (const match of contents.matchAll(
      /^[ \t]*-?[ \t]*template:[ \t]*(?<reference>\S+)[ \t]*$/gmu,
    )) {
      const resolved: string | null = resolveTemplateReference(
        match.groups?.reference ?? "",
        fileName,
        contents,
      );
      if (resolved !== null) {
        result.push(resolved);
      }
    }

    return result;
  };

  const getReachableFiles = (
    rootFileName: string,
    reader: (fileName: string) => string = readPipeline,
  ): string[] => {
    const reachable: Set<string> = new Set<string>();
    const pending: string[] = [rootFileName];
    while (pending.length > 0) {
      const current: string = pending.shift() ?? "";
      if (!reachable.has(current)) {
        reachable.add(current);
        for (const reference of getLocalTemplateReferences(
          reader(current),
          current,
        )) {
          pending.push(reference);
        }
      }
    }

    return Array.from(reachable).sort(compareStrings);
  };

  const getJobs = (contents: string): Map<string, string> => {
    const result: Map<string, string> = new Map<string, string>();
    for (const match of contents.matchAll(
      /^[ \t]*-[ \t]*job:[ \t]*(?<jobId>\S+)[ \t]*\r?\n[ \t]*displayName:[ \t]*(?<jobName>.+?)[ \t]*$/gmu,
    )) {
      result.set(match.groups?.jobId ?? "", match.groups?.jobName ?? "");
    }

    return result;
  };

  const getJobBlocks = (contents: string): Map<string, string> => {
    const result: Map<string, string> = new Map<string, string>();
    let jobId = "";
    let lines: string[] = [];
    for (const line of contents.split(/\r?\n/u)) {
      const match: RegExpExecArray | null =
        /^[ \t]*-[ \t]*job:[ \t]*(?<jobId>\S+)[ \t]*$/u.exec(line);
      if (match !== null) {
        if (jobId !== "") {
          result.set(jobId, lines.join("\n"));
        }

        jobId = match.groups?.jobId ?? "";
        lines = [];
      }

      lines.push(line);
    }

    if (jobId !== "") {
      result.set(jobId, lines.join("\n"));
    }

    return result;
  };

  const getSteps = (jobContents: string): PipelineStep[] => {
    const result: PipelineStep[] = [];
    let current: PipelineStep | null = null;
    let currentLines: string[] = [];
    let indent = -1;
    const flush = (): void => {
      if (current !== null) {
        current.contents = currentLines.join("\n");
        result.push(current);
      }
    };

    for (const line of jobContents.split(/\r?\n/u)) {
      const start: RegExpExecArray | null =
        /^(?<indent>[ ]*)-[ ]*(?<kind>[A-Za-z]+):(?<value>.*)$/u.exec(line);
      const kind: string = start?.groups?.kind ?? "";
      if (start !== null && stepKinds.includes(kind)) {
        flush();
        indent = (start.groups?.indent ?? "").length;
        current = {
          condition: "",
          contents: "",
          displayName: "",
          kind,
          value: (start.groups?.value ?? "").trim(),
        };
        currentLines = [line];
        continue;
      }

      if (current === null) {
        continue;
      }

      currentLines.push(line);
      const property: RegExpExecArray | null =
        /^(?<indent>[ ]*)(?<name>condition|displayName):(?<value>.*)$/u.exec(
          line,
        );
      if (
        property !== null &&
        (property.groups?.indent ?? "").length === indent + 2
      ) {
        const value: string = (property.groups?.value ?? "").trim();
        if (property.groups?.name === "condition") {
          current.condition = value;
        } else {
          current.displayName = value;
        }
      }
    }

    flush();
    return result;
  };

  const getStep = (
    steps: PipelineStep[],
    displayName: string,
  ): PipelineStep => {
    const result: PipelineStep | undefined = steps.find(
      (step: PipelineStep): boolean => step.displayName === displayName,
    );
    if (result === undefined) {
      throw new Error(`No step named '${displayName}' was located.`);
    }

    return result;
  };

  const getScripts = (): Record<string, string> => {
    const contents: string = fs.readFileSync(
      path.join(repositoryPath, "package.json"),
      "utf8",
    );
    const manifest: PackageManifest = JSON.parse(contents) as PackageManifest;
    return manifest.scripts;
  };

  const getScriptCommands = (
    scriptName: string,
    scripts: Record<string, string>,
    visited: Set<string>,
  ): string[] => {
    if (visited.has(scriptName)) {
      return [];
    }

    visited.add(scriptName);
    const command: string | undefined = scripts[scriptName];
    if (command === undefined) {
      return [];
    }

    const result: string[] = [command];
    for (const match of command.matchAll(/npm run (?<name>[\w.:-]+)/gu)) {
      result.push(
        ...getScriptCommands(match.groups?.name ?? "", scripts, visited),
      );
    }

    return result;
  };

  const readPackageLock = (): PackageLock =>
    JSON.parse(
      fs.readFileSync(path.join(repositoryPath, "package-lock.json"), "utf8"),
    ) as PackageLock;

  const examplePackage = "node_modules/example";

  const createPackageLock = (
    ...entries: [string, PackageLockEntry][]
  ): PackageLock => ({ packages: Object.fromEntries(entries) });

  /*
   * 'npm ci' restores every entry of the lockfile, so each one must name an
   * HTTPS URL on the approved 1ES public mirror and carry an integrity hash.
   * An entry without a resolved URL would instead be fetched from whichever
   * registry the configuration selects, which a pull request can alter.
   */
  const getPackageLockViolations = (packageLock: PackageLock): string[] => {
    const result: string[] = [];
    for (const [name, entry] of Object.entries(packageLock.packages)) {
      if (name === "") {
        continue;
      }

      const description = `'${name}'`;
      if (entry.resolved === undefined) {
        result.push(`${description} names no resolved URL.`);
        continue;
      }

      if (!URL.canParse(entry.resolved)) {
        result.push(
          `${description} names the malformed resolved URL '${entry.resolved}'.`,
        );
        continue;
      }

      const resolved: URL = new URL(entry.resolved);
      if (resolved.protocol !== "https:") {
        result.push(
          `${description} is not restored over HTTPS: '${entry.resolved}'.`,
        );
      }

      if (!approvedFeedHosts.includes(resolved.host)) {
        result.push(
          `${description} is restored from the unapproved host '${resolved.host}'.`,
        );
      }

      if (!resolved.pathname.startsWith(approvedFeedPath)) {
        result.push(
          `${description} is restored from outside the approved feed: '${entry.resolved}'.`,
        );
      }

      if (
        entry.integrity === undefined ||
        !integrityPattern.test(entry.integrity)
      ) {
        result.push(`${description} names no integrity hash.`);
      }
    }

    return result;
  };

  const countOccurrences = (contents: string, pattern: RegExp): number =>
    Array.from(contents.matchAll(pattern)).length;

  describe("pull request trust boundary", (): void => {
    pullRequestRootFiles.forEach((rootFile: string): void => {
      it(`should reach only the credential-free validation template from '${rootFile}'`, (): void => {
        // Act
        const actual: string[] = getReachableFiles(rootFile);

        // Assert
        assert.deepEqual(
          actual,
          [rootFile, validationTemplateFile].sort(compareStrings),
        );
      });

      it(`should not reach the privileged production template from '${rootFile}'`, (): void => {
        // Act
        const actual: string[] = getReachableFiles(rootFile);

        // Assert
        assert.equal(actual.includes(productionTemplateFile), false);
      });

      it(`should detect a '${selfRepositoryAlias}' qualified reference to the production template added to '${rootFile}'`, (): void => {
        // Arrange
        const tampered = `${readPipeline(rootFile)}\n      - template: ${productionTemplateFile}@${selfRepositoryAlias}\n`;
        const reader = (fileName: string): string =>
          fileName === rootFile ? tampered : readPipeline(fileName);

        // Act
        const actual: string[] = getReachableFiles(rootFile, reader);

        // Assert
        assert.equal(actual.includes(productionTemplateFile), true);
      });

      it(`should retain the 1ES pipeline template root within '${rootFile}'`, (): void => {
        // Arrange
        const contents: string = readPipeline(rootFile);

        // Assert
        assert.equal(
          contents.includes(`template: ${String(expectedRoots.get(rootFile))}`),
          true,
        );
      });

      it(`should retain the SDL settings within '${rootFile}'`, (): void => {
        // Arrange
        const contents: string = readPipeline(rootFile);

        // Assert
        assert.equal(contents.includes("sdl:"), true);
        assert.equal(contents.includes("credscan:"), true);
        assert.equal(contents.includes("sourceAnalysisPool:"), true);
        assert.equal(contents.includes("eslint:"), true);
      });

      forbiddenPatterns.forEach(
        (pattern: RegExp, description: string): void => {
          it(`should not reference ${description} anywhere reachable from '${rootFile}'`, (): void => {
            // Act
            const reachable: string[] = getReachableFiles(rootFile);

            // Assert
            for (const fileName of reachable) {
              assert.equal(
                pattern.test(readPipeline(fileName)),
                false,
                `'${fileName}' reachable from '${rootFile}' references ${description}.`,
              );
            }
          });
        },
      );

      it(`should pin every repository resource declared within '${rootFile}'`, (): void => {
        // Act
        const actual: RepositoryResource[] = getRepositoryResources(
          readPipeline(rootFile),
        );

        // Assert
        assert.deepEqual(actual, expectedResources.get(rootFile));
      });

      it(`should declare no additional repository resources within '${rootFile}'`, (): void => {
        // Act
        const reachable: string[] = getReachableFiles(rootFile);

        // Assert
        for (const fileName of reachable) {
          assert.deepEqual(
            getRepositoryResources(readPipeline(fileName)),
            expectedResources.get(fileName) ?? [],
            `'${fileName}' declares unexpected repository resources.`,
          );
        }
      });
    });
  });

  describe("template reference resolution", (): void => {
    it(`should resolve a '${selfRepositoryAlias}' qualified reference as local`, (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        `${productionTemplateFile}@${selfRepositoryAlias}`,
        "pr.yml",
        readPipeline("pr.yml"),
      );

      // Assert
      assert.equal(actual, productionTemplateFile);
    });

    it("should resolve an unqualified reference as local", (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        validationTemplateFile,
        "pr.yml",
        readPipeline("pr.yml"),
      );

      // Assert
      assert.equal(actual, validationTemplateFile);
    });

    it("should normalize relative and backslash separated references", (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        `.\\${productionTemplateFile}@${selfRepositoryAlias}`,
        "pr.yml",
        readPipeline("pr.yml"),
      );

      // Assert
      assert.equal(actual, productionTemplateFile);
    });

    it("should resolve a pinned remote alias as remote", (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        "v1/Office.Unofficial.PipelineTemplate.yml@OfficePipelineTemplates",
        "pr.yml",
        readPipeline("pr.yml"),
      );

      // Assert
      assert.equal(actual, null);
    });

    it("should reject an undeclared repository alias", (): void => {
      // Assert
      assert.throws((): void => {
        resolveTemplateReference(
          `${productionTemplateFile}@AttackerTemplates`,
          "pr.yml",
          readPipeline("pr.yml"),
        );
      }, /undeclared repository alias 'AttackerTemplates'/u);
    });

    const tamperedDeclarations: Map<string, [string, string]> = new Map<
      string,
      [string, string]
    >([
      [
        "repository name",
        [
          "name: 1ESPipelineTemplates/OfficePipelineTemplates",
          "name: AttackerTemplates/OfficePipelineTemplates",
        ],
      ],
      [
        "repository ref",
        ["ref: refs/tags/release", "ref: refs/heads/attacker"],
      ],
      ["repository type", ["type: git", "type: github"]],
      [
        "repository alias",
        [
          "- repository: OfficePipelineTemplates",
          "- repository: AttackerTemplates",
        ],
      ],
      [
        "service connection endpoint",
        [
          "ref: refs/tags/release",
          "ref: refs/tags/release\n      endpoint: AttackerConnection",
        ],
      ],
    ]);

    tamperedDeclarations.forEach(
      (
        [original, replacement]: [string, string],
        description: string,
      ): void => {
        it(`should fail when the ${description} within 'pr.yml' changes`, (): void => {
          // Arrange
          const tampered: string = readPipeline("pr.yml").replace(
            original,
            replacement,
          );

          // Assert
          assert.notEqual(tampered, readPipeline("pr.yml"));
          assert.throws((): void => {
            getLocalTemplateReferences(tampered, "pr.yml");
          }, /unpinned declaration/u);
        });
      },
    );

    it(`should walk a '${selfRepositoryAlias}' qualified reference`, (): void => {
      // Arrange
      const files: Map<string, string> = new Map<string, string>([
        [
          "pr.yml",
          `stages:\n      - template: ${validationTemplateFile}\n      - template: ${productionTemplateFile}@${selfRepositoryAlias}\n`,
        ],
        [validationTemplateFile, "stages: []\n"],
        [productionTemplateFile, "stages: []\n"],
      ]);
      const reader = (fileName: string): string => files.get(fileName) ?? "";

      // Act
      const actual: string[] = getReachableFiles("pr.yml", reader);

      // Assert
      assert.deepEqual(
        actual,
        ["pr.yml", validationTemplateFile, productionTemplateFile].sort(
          compareStrings,
        ),
      );
    });

    it("should fail when walking an undeclared repository alias", (): void => {
      // Arrange
      const files: Map<string, string> = new Map<string, string>([
        ["pr.yml", "stages:\n      - template: evil.yml@AttackerTemplates\n"],
      ]);
      const reader = (fileName: string): string => files.get(fileName) ?? "";

      // Assert
      assert.throws((): void => {
        getReachableFiles("pr.yml", reader);
      }, /undeclared repository alias 'AttackerTemplates'/u);
    });

    it("should resolve every template reference across the pipelines", (): void => {
      // Assert
      for (const fileName of getPipelineFiles()) {
        assert.doesNotThrow((): void => {
          getLocalTemplateReferences(readPipeline(fileName), fileName);
        }, `'${fileName}' references an undeclared repository alias.`);
      }
    });

    it("should pin every repository resource declared across the pipelines", (): void => {
      // Assert
      for (const fileName of getPipelineFiles()) {
        assert.deepEqual(
          getRepositoryResources(readPipeline(fileName)),
          expectedResources.get(fileName) ?? [],
          `'${fileName}' declares an unpinned repository resource.`,
        );
      }
    });
  });

  describe("pr-validation-template.yml", (): void => {
    it("should define the 'Build' stage", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Assert
      assert.equal(
        /^[ \t]*-[ \t]*stage:[ \t]*Build[ \t]*$/mu.test(contents),
        true,
      );
      assert.equal(
        /^[ \t]*displayName:[ \t]*Build[ \t]*$/mu.test(contents),
        true,
      );
    });

    it("should define the jobs required by the branch policies", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Act
      const actual: Map<string, string> = getJobs(contents);

      // Assert
      assert.deepEqual(
        Array.from(actual.entries()).sort(compareEntries),
        Array.from(expectedJobs.entries()).sort(compareEntries),
      );
    });

    it("should check out the repository without persisting credentials", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Act
      const checkouts: number = countOccurrences(
        contents,
        /^[ \t]*-[ \t]*checkout:[ \t]*self[ \t]*$/gmu,
      );
      const withoutCredentials: number = countOccurrences(
        contents,
        /^[ \t]*persistCredentials:[ \t]*false[ \t]*$/gmu,
      );

      // Assert
      assert.equal(checkouts > 0, true);
      assert.equal(checkouts, withoutCredentials);
    });

    it("should pin the Node.js version", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Act
      const nodeInstallations: number = countOccurrences(
        contents,
        /^[ \t]*-[ \t]*task:[ \t]*UseNode@1[ \t]*$/gmu,
      );
      const pinnedVersions: number = countOccurrences(
        contents,
        /^[ \t]*version:[ \t]*24\.13\.0[ \t]*$/gmu,
      );

      // Assert
      assert.equal(nodeInstallations > 0, true);
      assert.equal(nodeInstallations, pinnedVersions);
    });

    it("should order every job exactly as the trust boundary requires", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      assert.deepEqual(
        Array.from(blocks.keys()).sort(compareStrings),
        Array.from(expectedSteps.keys()).sort(compareStrings),
      );
      for (const [jobId, steps] of expectedSteps) {
        assert.deepEqual(
          getSteps(blocks.get(jobId) ?? "").map(
            (step: PipelineStep): string => step.displayName,
          ),
          steps,
          `'${jobId}' does not follow the required step order.`,
        );
      }
    });

    it("should restore dependencies with the pinned anonymous command", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const restore: PipelineStep = getStep(steps, restoreStepName);
        assert.equal(restore.kind, "script");
        assert.equal(
          restore.value,
          restoreCommand,
          `'${jobId}' does not restore with '${restoreCommand}'.`,
        );
      }
    });

    it("should repeat the pinned restore within every job requiring dependencies", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Act
      const restores: number = countOccurrences(contents, /npm ci\b/gu);
      const pinnedRestores: number = contents.split(restoreCommand).length - 1;

      // Assert
      assert.equal(restores, restoringJobIds.length);
      assert.equal(pinnedRestores, restoringJobIds.length);
    });

    it("should create no npm configuration and require no credential", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Assert
      assert.equal(contents.includes("npmrc"), false);
      assert.equal(contents.includes("npmAuthenticate"), false);
      assert.equal(contents.includes("Agent.TempDirectory"), false);
      assert.equal(contents.includes("Npm@1"), false);
    });

    it("should run only permitted scripts after restoring dependencies", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const restoreIndex: number = steps.findIndex(
          (step: PipelineStep): boolean => step.displayName === restoreStepName,
        );
        assert.notEqual(restoreIndex, -1);
        steps.forEach((step: PipelineStep, index: number): void => {
          if (index <= restoreIndex) {
            return;
          }

          assert.equal(
            step.value,
            permittedScripts.get(step.displayName),
            `'${jobId}' runs an unexpected step after the restore.`,
          );
        });
      }
    });

    it("should execute no repository script before dependencies are restored", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const restoreIndex: number = steps.findIndex(
          (step: PipelineStep): boolean => step.displayName === restoreStepName,
        );
        steps.forEach((step: PipelineStep, index: number): void => {
          if (index >= restoreIndex) {
            return;
          }

          assert.equal(
            /npm run|npm exec|npx |npm ci\b/u.test(step.contents),
            false,
            `'${jobId}' runs '${step.displayName}' before dependencies are restored.`,
          );
        });
      }
    });

    it("should not publish build artifacts", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Assert
      assert.equal(contents.includes("PublishBuildArtifacts"), false);
      assert.equal(contents.includes("PublishPipelineArtifact"), false);
      assert.equal(contents.includes("templateContext"), false);
    });
  });

  describe("package-lock.json", (): void => {
    it("should pin every package to the approved anonymous feed", (): void => {
      // Act
      const actual: string[] = getPackageLockViolations(readPackageLock());

      // Assert
      assert.deepEqual(actual, []);
    });

    it("should record a package for every dependency", (): void => {
      // Act
      const packageLock: PackageLock = readPackageLock();

      // Assert
      assert.equal(Object.keys(packageLock.packages).length > 1, true);
    });

    it("should reject the public npm registry", (): void => {
      // Arrange
      const resolved = "https://registry.npmjs.org/example/-/example-1.0.0.tgz";
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        { integrity: "sha512-AAAA", resolved },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' is restored from the unapproved host 'registry.npmjs.org'.`,
        `'${examplePackage}' is restored from outside the approved feed: '${resolved}'.`,
      ]);
    });

    it("should reject an unapproved Azure Artifacts host", (): void => {
      // Arrange
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        {
          integrity: "sha512-AAAA",
          resolved: `https://ms-feed-99.pkgs.visualstudio.com${approvedFeedPath}example/-/example-1.0.0.tgz`,
        },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' is restored from the unapproved host 'ms-feed-99.pkgs.visualstudio.com'.`,
      ]);
    });

    it("should reject an unapproved feed path", (): void => {
      // Arrange
      const resolved =
        "https://ms-feed-2.pkgs.visualstudio.com/attacker/_packaging/attacker/npm/registry/example/-/example-1.0.0.tgz";
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        { integrity: "sha512-AAAA", resolved },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' is restored from outside the approved feed: '${resolved}'.`,
      ]);
    });

    it("should reject an insecure transport", (): void => {
      // Arrange
      const resolved = `http://ms-feed-2.pkgs.visualstudio.com${approvedFeedPath}example/-/example-1.0.0.tgz`;
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        { integrity: "sha512-AAAA", resolved },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' is not restored over HTTPS: '${resolved}'.`,
      ]);
    });

    it("should reject a package without an integrity hash", (): void => {
      // Arrange
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        {
          resolved: `https://ms-feed-2.pkgs.visualstudio.com${approvedFeedPath}example/-/example-1.0.0.tgz`,
        },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' names no integrity hash.`,
      ]);
    });

    it("should reject a weakly formatted integrity hash", (): void => {
      // Arrange
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        {
          integrity: "md5-AAAA",
          resolved: `https://ms-feed-2.pkgs.visualstudio.com${approvedFeedPath}example/-/example-1.0.0.tgz`,
        },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' names no integrity hash.`,
      ]);
    });

    it("should reject a package without a resolved URL", (): void => {
      // Arrange
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        { integrity: "sha512-AAAA" },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [`'${examplePackage}' names no resolved URL.`]);
    });

    it("should reject a malformed resolved URL", (): void => {
      // Arrange
      const packageLock: PackageLock = createPackageLock([
        examplePackage,
        { integrity: "sha512-AAAA", resolved: "example-1.0.0.tgz" },
      ]);

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, [
        `'${examplePackage}' names the malformed resolved URL 'example-1.0.0.tgz'.`,
      ]);
    });

    it("should accept a package pinned to the approved feed", (): void => {
      // Arrange
      const packageLock: PackageLock = createPackageLock(
        ["", {}],
        [
          examplePackage,
          {
            integrity: "sha512-AAAA",
            resolved: `https://ms-feed-25.pkgs.visualstudio.com${approvedFeedPath}example/-/example-1.0.0.tgz`,
          },
        ],
      );

      // Act
      const actual: string[] = getPackageLockViolations(packageLock);

      // Assert
      assert.deepEqual(actual, []);
    });
  });

  describe("package.json", (): void => {
    permittedScripts.forEach((command: string, displayName: string): void => {
      it(`should not reinstall dependencies within '${command}'`, (): void => {
        // Arrange
        const scriptName: string = command.replace("npm run ", "");

        // Act
        const commands: string[] = getScriptCommands(
          scriptName,
          getScripts(),
          new Set<string>(),
        );

        // Assert
        assert.equal(commands.length > 0, true);
        for (const entry of commands) {
          assert.equal(
            /\bnpm (?<operation>ci|install|i)\b/u.test(entry),
            false,
            `'${displayName}' reinstalls dependencies via '${entry}'.`,
          );
        }
      });
    });
  });

  describe("prod.yml", (): void => {
    it("should continue to use the privileged production template", (): void => {
      // Arrange
      const contents: string = readPipeline("prod.yml");

      // Act
      const actual: string[] = getReachableFiles("prod.yml");

      // Assert
      assert.equal(
        contents.includes(`- template: ${productionTemplateFile}`),
        true,
      );
      assert.equal(actual.includes(productionTemplateFile), true);
    });
  });

  describe(".npmrc", (): void => {
    it("should disable install scripts", (): void => {
      // Arrange
      const contents: string = fs.readFileSync(
        path.join(repositoryPath, ".npmrc"),
        "utf8",
      );

      // Assert
      assert.equal(contents.includes("ignore-scripts=true"), true);
      assert.equal(contents.includes("always-auth"), false);
    });

    it("should embed no credential", (): void => {
      // Arrange
      const contents: string = fs.readFileSync(
        path.join(repositoryPath, ".npmrc"),
        "utf8",
      );

      // Assert
      assert.equal(
        /_auth|_password|username=|:_authToken/u.test(contents),
        false,
      );
    });

    /*
     * A configuration file, including one a pull request adds, selects the
     * registry that npm would otherwise substitute into the resolved URLs of
     * the lockfile. The restore therefore forbids that substitution outright
     * rather than overriding the registry, which would merely replace one
     * redirection with another.
     */
    it("should not redirect the pinned restore", (): void => {
      // Arrange
      const template: string = readPipeline(validationTemplateFile);

      // Assert
      assert.equal(template.includes("--replace-registry-host=never"), true);
      assert.equal(/--registry\b/u.test(template), false);
      assert.equal(template.includes("--userconfig"), false);
    });
  });
});
