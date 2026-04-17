/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import { createGitHubReposInvokerMocks, expectedUserAgent } from "./gitHubReposInvokerTestSetup.js";
import { instance, verify, when } from "ts-mockito";
import type ErrorWithStatusInterface from "../../src/repos/interfaces/errorWithStatusInterface.js";
import type GetPullResponse from "../../src/wrappers/octokitInterfaces/getPullResponse.js";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import type OctokitLogObjectInterface from "../wrappers/octokitLogObjectInterface.js";
import type { OctokitOptions } from "@octokit/core";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import type PullRequestDetailsInterface from "../../src/repos/interfaces/pullRequestDetailsInterface.js";
import type { RequestError } from "@octokit/request-error";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { StatusCodes } from "http-status-codes";
import assert from "node:assert/strict";
import { createRequestError } from "../testUtilities/createRequestError.js";
import { stubEnv } from "../testUtilities/stubEnv.js";

describe("gitHubReposInvoker.ts", (): void => {
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let octokitWrapper: OctokitWrapper;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({
      gitInvoker,
      logger,
      octokitWrapper,
      runnerInvoker,
    } = createGitHubReposInvokerMocks());
  });

  describe("getTitleAndDescription()", (): void => {
    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to the invalid value '${String(variable)}' and the task is running on Azure Pipelines`, async (): Promise<void> => {
          // Arrange
          if (typeof variable === "undefined") {
            stubEnv(["SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI", undefined]);
          } else {
            stubEnv(["SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI", variable]);
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
            instance(gitInvoker),
            instance(logger),
            instance(octokitWrapper),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            gitHubReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', accessed within 'GitHubReposInvoker.initializeForAzureDevOps()', is invalid, null, or undefined '${String(variable)}'.`,
          );
        });
      });
    }

    it("should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to an invalid URL and the task is running on Azure Pipelines", async (): Promise<void> => {
      // Arrange
      stubEnv(
        ["SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI", "https://github.com/microsoft"],
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () =>
        gitHubReposInvoker.getTitleAndDescription();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI 'https://github.com/microsoft' is in an unexpected format.",
      );
    });

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_API_URL is set to the invalid value '${String(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
          stubEnv(["PR_METRICS_ACCESS_TOKEN", "PAT"]);
          stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
          if (typeof variable === "undefined") {
            stubEnv(["GITHUB_API_URL", undefined]);
          } else {
            stubEnv(["GITHUB_API_URL", variable]);
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
            instance(gitInvoker),
            instance(logger),
            instance(octokitWrapper),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            gitHubReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'GITHUB_API_URL', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${String(variable)}'.`,
          );

        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_REPOSITORY_OWNER is set to the invalid value '${String(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
          stubEnv(["PR_METRICS_ACCESS_TOKEN", "PAT"]);
          stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
          stubEnv(["GITHUB_API_URL", "https://api.github.com"]);
          if (typeof variable === "undefined") {
            stubEnv(["GITHUB_REPOSITORY_OWNER", undefined]);
          } else {
            stubEnv(["GITHUB_REPOSITORY_OWNER", variable]);
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
            instance(gitInvoker),
            instance(logger),
            instance(octokitWrapper),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            gitHubReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'GITHUB_REPOSITORY_OWNER', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${String(variable)}'.`,
          );

        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_REPOSITORY is set to the invalid value '${String(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
          stubEnv(["PR_METRICS_ACCESS_TOKEN", "PAT"]);
          stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
          stubEnv(["GITHUB_API_URL", "https://api.github.com"]);
          stubEnv(["GITHUB_REPOSITORY_OWNER", "microsoft"]);
          if (typeof variable === "undefined") {
            stubEnv(["GITHUB_REPOSITORY", undefined]);
          } else {
            stubEnv(["GITHUB_REPOSITORY", variable]);
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
            instance(gitInvoker),
            instance(logger),
            instance(octokitWrapper),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            gitHubReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'GITHUB_REPOSITORY', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${String(variable)}'.`,
          );

        });
      });
    }

    it("should throw when GITHUB_REPOSITORY is in an incorrect format and the task is running on GitHub", async (): Promise<void> => {
      // Arrange
      stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
      stubEnv(["PR_METRICS_ACCESS_TOKEN", "PAT"]);
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_API_URL", "https://api.github.com"]);
      stubEnv(["GITHUB_REPOSITORY_OWNER", "microsoft"]);
      stubEnv(["GITHUB_REPOSITORY", "microsoft"]);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () =>
        gitHubReposInvoker.getTitleAndDescription();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "GITHUB_REPOSITORY 'microsoft' is in an unexpected format.",
      );

    });

    it("should succeed when the inputs are valid and the task is running on Azure Pipelines", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await gitHubReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(octokitWrapper.initialize(any())).once();
      verify(octokitWrapper.getPull("microsoft", "PR-Metrics", 12345)).once();
    });

    it("should succeed when the inputs are valid and the task is running on GitHub", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_API_URL", "https://api.github.com"]);
      stubEnv(["GITHUB_REPOSITORY_OWNER", "microsoft"]);
      stubEnv(["GITHUB_REPOSITORY", "microsoft/PR-Metrics"]);
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await gitHubReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(octokitWrapper.initialize(any())).once();
      verify(octokitWrapper.getPull("microsoft", "PR-Metrics", 12345)).once();

    });

    it("should succeed when the inputs are valid and the URL ends with '.git'", async (): Promise<void> => {
      // Arrange
      stubEnv([
        "SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI",
        "https://github.com/microsoft/PR-Metrics.git",
      ]);
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await gitHubReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(octokitWrapper.initialize(any())).once();
      verify(octokitWrapper.getPull("microsoft", "PR-Metrics", 12345)).once();
    });

    it("should succeed when the inputs are valid and GitHub Enterprise is in use", async (): Promise<void> => {
      // Arrange
      stubEnv([
        "SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI",
        "https://organization.githubenterprise.com/microsoft/PR-Metrics",
      ]);
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.equal(
            options.baseUrl,
            "https://organization.githubenterprise.com/api/v3",
          );
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await gitHubReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(octokitWrapper.initialize(any())).once();
      verify(octokitWrapper.getPull("microsoft", "PR-Metrics", 12345)).once();
    });

    it("should succeed when called twice with the inputs valid", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      await gitHubReposInvoker.getTitleAndDescription();
      const result: PullRequestDetailsInterface =
        await gitHubReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(octokitWrapper.initialize(any())).once();
      verify(octokitWrapper.getPull("microsoft", "PR-Metrics", 12345)).twice();
    });

    it("should succeed when the description is null", async (): Promise<void> => {
      // Arrange
      const currentMockPullResponse: GetPullResponse =
        GitHubReposInvokerConstants.getPullResponse;
      currentMockPullResponse.data.body = null;
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      when(
        octokitWrapper.getPull(anyString(), anyString(), anyNumber()),
      ).thenResolve(currentMockPullResponse);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await gitHubReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, null);
      verify(octokitWrapper.initialize(any())).once();
      verify(octokitWrapper.getPull("microsoft", "PR-Metrics", 12345)).once();
    });

    {
      const testCases: StatusCodes[] = [
        StatusCodes.UNAUTHORIZED,
        StatusCodes.FORBIDDEN,
        StatusCodes.NOT_FOUND,
      ];

      testCases.forEach((status: StatusCodes): void => {
        it(`should throw when the PAT has insufficient access and the API call returns status '${String(status)}'`, async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(any())).thenCall(
            (options: OctokitOptions): void => {
              assert.equal(options.auth, "PAT");
              assert.equal(options.userAgent, expectedUserAgent);
              assert.notEqual(options.log, null);
              assert.notEqual(options.log?.debug, null);
              assert.notEqual(options.log?.info, null);
              assert.notEqual(options.log?.warn, null);
              assert.notEqual(options.log?.error, null);
            },
          );
          const error: RequestError = createRequestError(status, "Test");
          when(
            octokitWrapper.getPull(anyString(), anyString(), anyNumber()),
          ).thenThrow(error);
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
            instance(gitInvoker),
            instance(logger),
            instance(octokitWrapper),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            gitHubReposInvoker.getTitleAndDescription();

          // Assert
          const expectedMessage: string =
            status === StatusCodes.NOT_FOUND
              ? "The resource could not be found. Verify the repository and pull request exist."
              : "Could not access the resources. Ensure the 'PR_Metrics_Access_Token' secret environment variable has Read and Write access to pull requests (or access to 'repos' if using a Classic PAT).";
          const result: ErrorWithStatusInterface =
            await AssertExtensions.toThrowAsync(func, expectedMessage);
          assert.equal(result.internalMessage, "Test");
          verify(octokitWrapper.initialize(any())).once();
        });
      });
    }

    it("should throw an error when an error occurs", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      when(
        octokitWrapper.getPull(anyString(), anyString(), anyNumber()),
      ).thenThrow(Error("Error"));
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () =>
        gitHubReposInvoker.getTitleAndDescription();

      // Assert
      await AssertExtensions.toThrowAsync(func, "Error");
      verify(octokitWrapper.initialize(any())).once();
    });

    it("should initialize log object correctly", async (): Promise<void> => {
      // Arrange
      let logObject: OctokitLogObjectInterface | undefined;
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          logObject = options.log;
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );
      await gitHubReposInvoker.getTitleAndDescription();

      // Act
      logObject?.debug("Debug Message");
      logObject?.info("Info Message");
      logObject?.warn("Warning Message");
      logObject?.error("Error Message");

      // Assert
      verify(logger.logDebug("Octokit – Debug Message")).once();
      verify(logger.logInfo("Octokit – Info Message")).once();
      verify(logger.logWarning("Octokit – Warning Message")).once();
      verify(logger.logError("Octokit – Error Message")).once();
    });
  });
});
