/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import assert from "node:assert/strict";

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

  const expectedJobs: Map<string, string> = new Map<string, string>([
    ["Prerequisites", "Prerequisites"],
    ["PRMetrics_Ubuntu", "PR Metrics – Ubuntu"],
    ["PRMetrics_Windows", "PR Metrics – Windows"],
    ["Validation", "Validation"],
  ]);

  const expectedResources: Map<string, string[]> = new Map<string, string[]>([
    ["pr.yml", ["OfficePipelineTemplates"]],
    ["pr-test.yml", ["1ESPipelineTemplates"]],
    [validationTemplateFile, []],
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
    [
      "an authenticated npm feed",
      /npmAuthenticate|always-auth|pkgs\.dev\.azure\.com/u,
    ],
    ["an Azure CLI task", /AzureCLI/u],
    [
      "a service connection",
      /azureSubscription|connectionType|ConnectedServiceName|azureRM/u,
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
  ]);

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

  const getLocalTemplateReferences = (contents: string): string[] => {
    const result: string[] = [];
    for (const match of contents.matchAll(
      /^[ \t]*-?[ \t]*template:[ \t]*(?<reference>\S+)[ \t]*$/gmu,
    )) {
      const reference: string = match.groups?.reference ?? "";

      // References including '@' resolve against a remote repository resource.
      if (!reference.includes("@")) {
        result.push(reference);
      }
    }

    return result;
  };

  const getReachableFiles = (rootFileName: string): string[] => {
    const reachable: Set<string> = new Set<string>();
    const pending: string[] = [rootFileName];
    while (pending.length > 0) {
      const current: string = pending.shift() ?? "";
      if (!reachable.has(current)) {
        reachable.add(current);
        for (const reference of getLocalTemplateReferences(
          readPipeline(current),
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

  const getRepositoryResources = (contents: string): string[] => {
    const result: string[] = [];
    for (const match of contents.matchAll(
      /^[ \t]*-[ \t]*repository:[ \t]*(?<name>\S+)[ \t]*$/gmu,
    )) {
      result.push(match.groups?.name ?? "");
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

    it("should install dependencies with scripts disabled", (): void => {
      // Arrange
      const contents: string = readPipeline(validationTemplateFile);

      // Act
      const installations: number = countOccurrences(
        contents,
        /^[ \t]*customCommand:[ \t]*ci\b.*$/gmu,
      );
      const withoutScripts: number = countOccurrences(
        contents,
        /^[ \t]*customCommand:[ \t]*ci --ignore-scripts[ \t]*$/gmu,
      );

      // Assert
      assert.equal(installations > 0, true);
      assert.equal(installations, withoutScripts);
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
    it("should disable install scripts and use the public registry", (): void => {
      // Arrange
      const contents: string = fs.readFileSync(
        path.join(repositoryPath, ".npmrc"),
        "utf8",
      );

      // Assert
      assert.equal(contents.includes("ignore-scripts=true"), true);
      assert.equal(
        contents.includes("registry=https://registry.npmjs.org/"),
        true,
      );
      assert.equal(contents.includes("always-auth"), false);
    });
  });
});
