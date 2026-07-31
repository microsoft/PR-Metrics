/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";

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
   * The network isolation policy (CFSClean) requires dependencies to be
   * restored through the approved Office Azure Artifacts feed. The credential
   * for that feed is confined to a temporary configuration outside the
   * checkout, which exists only for the duration of the restore.
   */
  const approvedRegistry =
    "https://pkgs.dev.azure.com/office/_packaging/Office/npm/registry/";
  const temporaryConfigurationDirectory = "$(Agent.TempDirectory)/npm-restore";
  const temporaryConfigurationFile = `${temporaryConfigurationDirectory}/.npmrc`;
  const restoreCommand = `npm ci --ignore-scripts --no-audit --userconfig ${temporaryConfigurationFile} --registry ${approvedRegistry}`;

  const checkoutStepName = "Checkout";
  const nodeStepName = "Install Node.js";
  const createConfigurationStepName = "npm – Create Temporary Configuration";
  const authenticateStepName = "npm – Authenticate Temporary Configuration";
  const restoreStepName = "npm – Restore Dependencies";
  const deleteConfigurationStepName = "npm – Delete Temporary Configuration";

  const restoreBoundary: string[] = [
    checkoutStepName,
    nodeStepName,
    createConfigurationStepName,
    authenticateStepName,
    restoreStepName,
    deleteConfigurationStepName,
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
   * The scripts that may run once the feed credential has been destroyed. Each
   * must be free of a nested install, as that would restore dependencies from
   * an unauthenticated registry under pull request control.
   */
  const permittedScripts: Map<string, string> = new Map<string, string>([
    ["npm – Lint", "npm run lint"],
    ["npm – Test", "npm run test:fast"],
  ]);

  const expectedResources: Map<string, string[]> = new Map<string, string[]>([
    ["pr.yml", ["OfficePipelineTemplates"]],
    ["pr-test.yml", ["1ESPipelineTemplates"]],
    [validationTemplateFile, []],
  ]);

  const expectedRemoteAliases: string[] = [
    "1ESPipelineTemplates",
    "OfficePipelineTemplates",
  ];

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
    [
      "an unapproved package feed",
      /pkgs\.dev\.azure\.com(?!\/office\/_packaging\/Office\/npm\/registry\/)/u,
    ],
    ["unscoped npm authentication", /always-auth/u],
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
    [
      "a credential written into the checkout",
      /\$\(Build\.SourcesDirectory\)[^\r\n]*npmrc/u,
    ],
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

  /*
   * Azure Pipelines resolves a reference of the form 'path@alias' against the
   * repository resource named by the alias, and the built-in 'self' alias names
   * this repository. Treating every qualified reference as remote would
   * therefore allow 'template.yml@self' to smuggle the privileged template back
   * into the pull request graph, so only aliases that the pipelines actually
   * declare are treated as remote and anything else is rejected outright.
   */
  const resolveTemplateReference = (
    reference: string,
    fileName: string,
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

    if (expectedRemoteAliases.includes(alias)) {
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

  const getRepositoryResources = (contents: string): string[] => {
    const result: string[] = [];
    for (const match of contents.matchAll(
      /^[ \t]*-[ \t]*repository:[ \t]*(?<name>\S+)[ \t]*$/gmu,
    )) {
      result.push(match.groups?.name ?? "");
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
      );

      // Assert
      assert.equal(actual, productionTemplateFile);
    });

    it("should resolve an unqualified reference as local", (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        validationTemplateFile,
        "pr.yml",
      );

      // Assert
      assert.equal(actual, validationTemplateFile);
    });

    it("should normalize relative and backslash separated references", (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        `.\\${productionTemplateFile}@${selfRepositoryAlias}`,
        "pr.yml",
      );

      // Assert
      assert.equal(actual, productionTemplateFile);
    });

    it("should resolve a declared remote alias as remote", (): void => {
      // Act
      const actual: string | null = resolveTemplateReference(
        "v1/Office.Unofficial.PipelineTemplate.yml@OfficePipelineTemplates",
        "pr.yml",
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
        );
      }, /undeclared repository alias 'AttackerTemplates'/u);
    });

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

    it("should declare every repository alias used across the pipelines", (): void => {
      // Act
      const declared: Set<string> = new Set<string>();
      for (const fileName of getPipelineFiles()) {
        for (const resource of getRepositoryResources(readPipeline(fileName))) {
          declared.add(resource);
        }
      }

      // Assert
      assert.deepEqual(
        Array.from(declared).sort(compareStrings),
        [...expectedRemoteAliases].sort(compareStrings),
      );
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

    it("should repeat the restore boundary within every job requiring dependencies", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Act
      const authentications: number = countOccurrences(
        contents,
        /^[ \t]*-[ \t]*task:[ \t]*npmAuthenticate@0[ \t]*$/gmu,
      );
      const restores: number = countOccurrences(contents, /npm ci\b/gu);
      const deletions: number = countOccurrences(
        contents,
        /^[ \t]*condition:[ \t]*always\(\)[ \t]*$/gmu,
      );

      // Assert
      assert.equal(authentications, restoringJobIds.length);
      assert.equal(restores, restoringJobIds.length);
      assert.equal(deletions, restoringJobIds.length);
    });

    it("should authenticate only the temporary configuration outside the checkout", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const authentication: PipelineStep = getStep(
          steps,
          authenticateStepName,
        );
        assert.equal(authentication.kind, "task");
        assert.equal(authentication.value, "npmAuthenticate@0");
        assert.equal(
          /^[ \t]*workingFile:[ \t]*\$\(Agent\.TempDirectory\)/mu.test(
            authentication.contents,
          ),
          true,
          `'${jobId}' does not authenticate a configuration under the agent temporary directory.`,
        );
        assert.equal(
          authentication.contents.includes(temporaryConfigurationFile),
          true,
        );
      }
    });

    it("should create the temporary configuration outside the checkout", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const creation: PipelineStep = getStep(
          steps,
          createConfigurationStepName,
        );
        assert.equal(
          creation.contents.includes(temporaryConfigurationFile),
          true,
          `'${jobId}' does not create the configuration under the agent temporary directory.`,
        );
        assert.equal(
          creation.contents.includes(`registry=${approvedRegistry}`),
          true,
        );
        assert.equal(
          creation.contents.includes("Build.SourcesDirectory"),
          false,
        );
      }
    });

    it("should restore dependencies with scripts disabled from the approved feed", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const restore: PipelineStep = getStep(steps, restoreStepName);
        assert.equal(
          restore.contents.includes(restoreCommand),
          true,
          `'${jobId}' does not restore with '${restoreCommand}'.`,
        );
      }
    });

    it("should delete the temporary configuration on every outcome", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const deletion: PipelineStep = getStep(
          steps,
          deleteConfigurationStepName,
        );
        assert.equal(
          deletion.condition,
          "always()",
          `'${jobId}' does not delete the temporary configuration on every outcome.`,
        );
        assert.equal(
          /Remove-Item[^\r\n]*\$\(Agent\.TempDirectory\)\/npm-restore/u.test(
            deletion.contents,
          ),
          true,
        );
      }
    });

    it("should execute no repository script before the temporary configuration is deleted", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const deletionIndex: number = steps.findIndex(
          (step: PipelineStep): boolean =>
            step.displayName === deleteConfigurationStepName,
        );
        assert.notEqual(deletionIndex, -1);
        steps.forEach((step: PipelineStep, index: number): void => {
          if (index >= deletionIndex) {
            return;
          }

          assert.equal(
            /npm run|npm exec|npx |npm ci(?! --ignore-scripts)/u.test(
              step.contents,
            ),
            false,
            `'${jobId}' runs '${step.displayName}' before the credential is destroyed.`,
          );
        });
      }
    });

    it("should run only permitted scripts after the temporary configuration is deleted", (): void => {
      // Arrange
      const blocks: Map<string, string> = getJobBlocks(
        readPipeline(validationTemplateFile),
      );

      // Assert
      for (const jobId of restoringJobIds) {
        const steps: PipelineStep[] = getSteps(blocks.get(jobId) ?? "");
        const deletionIndex: number = steps.findIndex(
          (step: PipelineStep): boolean =>
            step.displayName === deleteConfigurationStepName,
        );
        steps.forEach((step: PipelineStep, index: number): void => {
          if (index <= deletionIndex) {
            return;
          }

          assert.equal(
            step.value,
            permittedScripts.get(step.displayName),
            `'${jobId}' runs an unexpected step after the credential is destroyed.`,
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
     * A project configuration outranks the temporary user configuration, so the
     * public registry it selects must be overridden on the command line for the
     * restore to reach the approved feed.
     */
    it("should be overridden by the approved feed during the Azure DevOps restore", (): void => {
      // Arrange
      const contents: string = fs.readFileSync(
        path.join(repositoryPath, ".npmrc"),
        "utf8",
      );
      const template: string = readPipeline(validationTemplateFile);

      // Assert
      assert.equal(
        contents.includes("registry=https://registry.npmjs.org/"),
        true,
      );
      assert.equal(template.includes(`--registry ${approvedRegistry}`), true);
      assert.equal(template.includes("registry.npmjs.org"), false);
    });
  });
});
