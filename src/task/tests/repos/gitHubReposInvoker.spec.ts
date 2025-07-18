/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import * as Converter from "../../src/utilities/converter.js";
import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import { instance, mock, verify, when } from "ts-mockito";
import CommentData from "../../src/repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import ErrorWithStatusInterface from "../../src/repos/interfaces/errorWithStatusInterface.js";
import GetIssueCommentsResponse from "../../src/wrappers/octokitInterfaces/getIssueCommentsResponse.js";
import GetPullResponse from "../../src/wrappers/octokitInterfaces/getPullResponse.js";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import HttpError from "../testUtilities/httpError.js";
import Logger from "../../src/utilities/logger.js";
import OctokitLogObjectInterface from "../wrappers/octokitLogObjectInterface.js";
import { OctokitOptions } from "@octokit/core";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import PullRequestDetailsInterface from "../../src/repos/interfaces/pullRequestDetailsInterface.js";
import { RequestError } from "octokit";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { StatusCodes } from "http-status-codes";
import assert from "node:assert/strict";
import { createRequestError } from "../testUtilities/createRequestError.js";

describe("gitHubReposInvoker.ts", (): void => {
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let octokitWrapper: OctokitWrapper;
  let runnerInvoker: RunnerInvoker;

  const expectedUserAgent = "PRMetrics/v1.7.4";

  beforeEach((): void => {
    process.env.PR_METRICS_ACCESS_TOKEN = "PAT";
    process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI =
      "https://github.com/microsoft/PR-Metrics";

    gitInvoker = mock(GitInvoker);
    when(gitInvoker.pullRequestId).thenReturn(12345);

    logger = mock(Logger);

    octokitWrapper = mock(OctokitWrapper);
    when(
      octokitWrapper.getPull(anyString(), anyString(), anyNumber()),
    ).thenResolve(GitHubReposInvokerConstants.getPullResponse);
    when(
      octokitWrapper.updatePull(
        anyString(),
        anyString(),
        anyNumber(),
        anyString(),
        anyString(),
      ),
    ).thenResolve(GitHubReposInvokerConstants.getPullResponse);
    when(
      octokitWrapper.listCommits(
        anyString(),
        anyString(),
        anyNumber(),
        anyNumber(),
      ),
    ).thenResolve(GitHubReposInvokerConstants.listCommitsResponse);

    runnerInvoker = mock(RunnerInvoker);
    when(
      runnerInvoker.loc(
        "repos.gitHubReposInvoker.insufficientGitHubAccessTokenPermissions",
      ),
    ).thenReturn(
      "Could not access the resources. Ensure the 'PR_Metrics_Access_Token' secret environment variable has Read and Write access to pull requests (or access to 'repos' if using a Classic PAT).",
    );
    when(
      runnerInvoker.loc("repos.gitHubReposInvoker.noGitHubAccessToken"),
    ).thenReturn(
      "Could not access the Personal Access Token (PAT). Add 'PR_Metrics_Access_Token' as a secret environment variable with Read and Write access to Pull Requests (or access to 'repos' if using a Classic PAT, or write access to 'pull-requests' and 'statuses' if specified within the workflow YAML).",
    );
  });

  afterEach((): void => {
    delete process.env.PR_METRICS_ACCESS_TOKEN;
    delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI;
  });

  describe("isAccessTokenAvailable()", (): void => {
    it("should return null when the token exists on Azure DevOps", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: string | null =
        await gitHubReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(result, null);
      verify(
        logger.logDebug("* GitHubReposInvoker.isAccessTokenAvailable()"),
      ).once();
    });

    it("should return null when the token exists on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.PR_METRICS_ACCESS_TOKEN = "PAT";
      process.env.GITHUB_ACTION = "PR-Metrics";
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: string | null =
        await gitHubReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(result, null);
      verify(
        logger.logDebug("* GitHubReposInvoker.isAccessTokenAvailable()"),
      ).once();

      // Finalization
      delete process.env.PR_METRICS_ACCESS_TOKEN;
      delete process.env.GITHUB_ACTION;
    });

    it("should return a string when the token does not exist", async (): Promise<void> => {
      // Arrange
      delete process.env.PR_METRICS_ACCESS_TOKEN;
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: string | null =
        await gitHubReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(
        result,
        "Could not access the Personal Access Token (PAT). Add 'PR_Metrics_Access_Token' as a secret environment variable with Read and Write access to Pull Requests (or access to 'repos' if using a Classic PAT, or write access to 'pull-requests' and 'statuses' if specified within the workflow YAML).",
      );
      verify(
        logger.logDebug("* GitHubReposInvoker.isAccessTokenAvailable()"),
      ).once();
    });
  });

  describe("getTitleAndDescription()", (): void => {
    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to the invalid value '${Converter.toString(variable)}' and the task is running on Azure Pipelines`, async (): Promise<void> => {
          // Arrange
          if (typeof variable === "undefined") {
            delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI;
          } else {
            process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = variable;
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
            `'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', accessed within 'GitHubReposInvoker.initializeForAzureDevOps()', is invalid, null, or undefined '${Converter.toString(variable)}'.`,
          );
          verify(
            logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
          ).once();
        });
      });
    }

    it("should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to an invalid URL and the task is running on Azure Pipelines", async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI =
        "https://github.com/microsoft";
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
    });

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_API_URL is set to the invalid value '${Converter.toString(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          delete process.env.PR_METRICS_ACCESS_TOKEN;
          process.env.PR_METRICS_ACCESS_TOKEN = "PAT";
          process.env.GITHUB_ACTION = "PR-Metrics";
          if (typeof variable === "undefined") {
            delete process.env.GITHUB_API_URL;
          } else {
            process.env.GITHUB_API_URL = variable;
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
            `'GITHUB_API_URL', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${Converter.toString(variable)}'.`,
          );
          verify(
            logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.initializeForGitHub()"),
          ).once();

          // Finalization
          delete process.env.PR_METRICS_ACCESS_TOKEN;
          delete process.env.GITHUB_ACTION;
          delete process.env.GITHUB_API_URL;
        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_REPOSITORY_OWNER is set to the invalid value '${Converter.toString(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          delete process.env.PR_METRICS_ACCESS_TOKEN;
          process.env.PR_METRICS_ACCESS_TOKEN = "PAT";
          process.env.GITHUB_ACTION = "PR-Metrics";
          process.env.GITHUB_API_URL = "https://api.github.com";
          if (typeof variable === "undefined") {
            delete process.env.GITHUB_REPOSITORY_OWNER;
          } else {
            process.env.GITHUB_REPOSITORY_OWNER = variable;
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
            `'GITHUB_REPOSITORY_OWNER', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${Converter.toString(variable)}'.`,
          );
          verify(
            logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.initializeForGitHub()"),
          ).once();

          // Finalization
          delete process.env.PR_METRICS_ACCESS_TOKEN;
          delete process.env.GITHUB_ACTION;
          delete process.env.GITHUB_API_URL;
          delete process.env.GITHUB_REPOSITORY_OWNER;
        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_REPOSITORY is set to the invalid value '${Converter.toString(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          delete process.env.PR_METRICS_ACCESS_TOKEN;
          process.env.PR_METRICS_ACCESS_TOKEN = "PAT";
          process.env.GITHUB_ACTION = "PR-Metrics";
          process.env.GITHUB_API_URL = "https://api.github.com";
          process.env.GITHUB_REPOSITORY_OWNER = "microsoft";
          if (typeof variable === "undefined") {
            delete process.env.GITHUB_REPOSITORY;
          } else {
            process.env.GITHUB_REPOSITORY = variable;
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
            `'GITHUB_REPOSITORY', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${Converter.toString(variable)}'.`,
          );
          verify(
            logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.initializeForGitHub()"),
          ).once();

          // Finalization
          delete process.env.PR_METRICS_ACCESS_TOKEN;
          delete process.env.GITHUB_ACTION;
          delete process.env.GITHUB_API_URL;
          delete process.env.GITHUB_REPOSITORY_OWNER;
          delete process.env.GITHUB_REPOSITORY;
        });
      });
    }

    it("should throw when GITHUB_REPOSITORY is in an incorrect format and the task is running on GitHub", async (): Promise<void> => {
      // Arrange
      delete process.env.PR_METRICS_ACCESS_TOKEN;
      process.env.PR_METRICS_ACCESS_TOKEN = "PAT";
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_API_URL = "https://api.github.com";
      process.env.GITHUB_REPOSITORY_OWNER = "microsoft";
      process.env.GITHUB_REPOSITORY = "microsoft";
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForGitHub()"),
      ).once();

      // Finalization
      delete process.env.PR_METRICS_ACCESS_TOKEN;
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_API_URL;
      delete process.env.GITHUB_REPOSITORY_OWNER;
      delete process.env.GITHUB_REPOSITORY;
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getPullResponse),
        ),
      ).once();
    });

    it("should succeed when the inputs are valid and the task is running on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_API_URL = "https://api.github.com";
      process.env.GITHUB_REPOSITORY_OWNER = "microsoft";
      process.env.GITHUB_REPOSITORY = "microsoft/PR-Metrics";
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForGitHub()"),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getPullResponse),
        ),
      ).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_API_URL;
      delete process.env.GITHUB_REPOSITORY_OWNER;
      delete process.env.GITHUB_REPOSITORY;
    });

    it("should succeed when the inputs are valid and the URL ends with '.git'", async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI =
        "https://github.com/microsoft/PR-Metrics.git";
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getPullResponse),
        ),
      ).once();
    });

    it("should succeed when the inputs are valid and GitHub Enterprise is in use", async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI =
        "https://organization.githubenterprise.com/microsoft/PR-Metrics";
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug(
          "Using Base URL 'https://organization.githubenterprise.com/api/v3'.",
        ),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getPullResponse),
        ),
      ).once();
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).twice();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).twice();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getPullResponse),
        ),
      ).twice();
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug(JSON.stringify(currentMockPullResponse))).once();
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
          const result: ErrorWithStatusInterface =
            await AssertExtensions.toThrowAsync(
              func,
              "Could not access the resources. Ensure the 'PR_Metrics_Access_Token' secret environment variable has Read and Write access to pull requests (or access to 'repos' if using a Classic PAT).",
            );
          assert.equal(result.internalMessage, "Test");
          verify(octokitWrapper.initialize(any())).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
          ).once();
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
      verify(
        logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
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

  describe("getComments()", (): void => {
    it("should return the result when called with a pull request comment", async (): Promise<void> => {
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
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.getIssueCommentsResponse;
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].body = "PR Content";
      when(
        octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber()),
      ).thenResolve(response);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "PR Content");
      assert.equal(
        result.pullRequestComments[0].status,
        CommentThreadStatus.Unknown,
      );
      assert.equal(result.fileComments.length, 0);
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.getIssueComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(
        octokitWrapper.getReviewComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getComments()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.convertPullRequestComments()"),
      ).once();
      verify(logger.logDebug(JSON.stringify(response))).once();
    });

    it("should return the result when called with a file comment", async (): Promise<void> => {
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
        octokitWrapper.getReviewComments(anyString(), anyString(), anyNumber()),
      ).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 0);
      assert.equal(result.fileComments.length, 1);
      assert.equal(result.fileComments[0]?.id, 2);
      assert.equal(result.fileComments[0].content, "File Content");
      assert.equal(result.fileComments[0].status, CommentThreadStatus.Unknown);
      assert.equal(result.fileComments[0].fileName, "file.ts");
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.getIssueComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(
        octokitWrapper.getReviewComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getComments()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.convertPullRequestComments()"),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getReviewCommentsResponse),
        ),
      ).once();
    });

    it("should return the result when called with both a pull request and file comment", async (): Promise<void> => {
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
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.getIssueCommentsResponse;
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].body = "PR Content";
      when(
        octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber()),
      ).thenResolve(response);
      when(
        octokitWrapper.getReviewComments(anyString(), anyString(), anyNumber()),
      ).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "PR Content");
      assert.equal(
        result.pullRequestComments[0].status,
        CommentThreadStatus.Unknown,
      );
      assert.equal(result.fileComments.length, 1);
      assert.equal(result.fileComments[0]?.id, 2);
      assert.equal(result.fileComments[0].content, "File Content");
      assert.equal(result.fileComments[0].status, CommentThreadStatus.Unknown);
      assert.equal(result.fileComments[0].fileName, "file.ts");
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.getIssueComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(
        octokitWrapper.getReviewComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getComments()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.convertPullRequestComments()"),
      ).once();
      verify(logger.logDebug(JSON.stringify(response))).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getReviewCommentsResponse),
        ),
      ).once();
    });

    it("should skip pull request comments with no body", async (): Promise<void> => {
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
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.getIssueCommentsResponse;
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].body = undefined;
      when(
        octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber()),
      ).thenResolve(response);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 0);
      assert.equal(result.fileComments.length, 0);
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.getIssueComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(
        octokitWrapper.getReviewComments("microsoft", "PR-Metrics", 12345),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getComments()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.convertPullRequestComments()"),
      ).once();
      verify(logger.logDebug(JSON.stringify(response))).once();
    });
  });

  describe("setTitleAndDescription()", (): void => {
    it("should succeed when the title and description are both null", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, null);

      // Assert
      verify(
        logger.logDebug("* GitHubReposInvoker.setTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).never();
    });

    it("should succeed when the title and description are both set", async (): Promise<void> => {
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
      await gitHubReposInvoker.setTitleAndDescription("Title", "Description");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.updatePull(
          "microsoft",
          "PR-Metrics",
          12345,
          "Title",
          "Description",
        ),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.setTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(
        logger.logDebug(
          JSON.stringify(GitHubReposInvokerConstants.getPullResponse),
        ),
      ).once();
    });

    it("should succeed when the title is set", async (): Promise<void> => {
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
      await gitHubReposInvoker.setTitleAndDescription("Title", null);

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.updatePull(
          "microsoft",
          "PR-Metrics",
          12345,
          "Title",
          null,
        ),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.setTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("null")).once();
    });

    it("should succeed when the description is set", async (): Promise<void> => {
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
      await gitHubReposInvoker.setTitleAndDescription(null, "Description");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.updatePull(
          "microsoft",
          "PR-Metrics",
          12345,
          null,
          "Description",
        ),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.setTitleAndDescription()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("null")).once();
    });
  });

  describe("createComment()", (): void => {
    it("should succeed when a file name is specified", async (): Promise<void> => {
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
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
      verify(logger.logDebug("null")).once();
    });

    it("should throw when the commit list is empty", async (): Promise<void> => {
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
        octokitWrapper.listCommits(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve({
        data: [],
        headers: {},
        status: StatusCodes.OK,
        url: "",
      });
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<void> = async () =>
        gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'result.data[-1].sha', accessed within 'GitHubReposInvoker.getCommitId()', is invalid, null, or undefined 'undefined'.",
      );
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
    });

    it("should succeed when there are multiple pages of commits", async (): Promise<void> => {
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
        octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 1),
      ).thenResolve({
        data: [],
        headers: {
          link: '<https://api.github.com/repositories/309438703/pulls/172/commits?page=2>; rel="next", <https://api.github.com/repositories/309438703/pulls/172/commits?page=24>; rel="last"',
        },
        status: StatusCodes.OK,
        url: "",
      });
      when(
        octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 24),
      ).thenResolve(GitHubReposInvokerConstants.listCommitsResponse);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
      verify(logger.logDebug("null")).once();
    });

    it("should throw when the link header does not match the expected format", async (): Promise<void> => {
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
        octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 1),
      ).thenResolve({
        data: [],
        headers: {
          link: "non-matching",
        },
        status: StatusCodes.OK,
        url: "",
      });
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<void> = async () =>
        gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "The regular expression did not match 'non-matching'.",
      );
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
    });

    it("should succeed when a file name is specified and the method is called twice", async (): Promise<void> => {
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
      await gitHubReposInvoker.createComment("Content", "file.ts");
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).twice();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).twice();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).twice();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
      verify(logger.logDebug("null")).twice();
    });

    it("should succeed when createReviewComment() returns undefined", async (): Promise<void> => {
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
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).thenResolve(null);
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
      verify(logger.logDebug("null")).once();
    });

    it("should succeed when a HTTP 422 error occurs due to having a too large path diff", async (): Promise<void> => {
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
      const error: RequestError = createRequestError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        'Validation Failed: {"resource":"PullRequestReviewComment","code":"custom","field":"pull_request_review_thread.path","message":"pull_request_review_thread.path diff too large"}, {"resource":"PullRequestReviewComment","code":"missing_field","field":"pull_request_review_thread.diff_hunk"}',
      );
      when(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).thenCall((): void => {
        throw error;
      });
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
      verify(
        logger.logInfo(
          "GitHub createReviewComment() threw a 422 error related to a large diff. Ignoring as this is expected.",
        ),
      ).once();
      verify(logger.logErrorObject(error)).once();
    });

    {
      const testCases: HttpError[] = [
        new HttpError(
          StatusCodes.BAD_REQUEST,
          'Validation Failed: {"resource":"PullRequestReviewComment","code":"custom","field":"pull_request_review_thread.path","message":"pull_request_review_thread.path diff too large"}, {"resource":"PullRequestReviewComment","code":"missing_field","field":"pull_request_review_thread.diff_hunk"}',
        ),
        new HttpError(StatusCodes.UNPROCESSABLE_ENTITY, "Unprocessable Entity"),
      ];

      testCases.forEach((error: HttpError): void => {
        it("should throw when an error occurs that is not a HTTP 422 or is not due to having a too large path diff", async (): Promise<void> => {
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
            octokitWrapper.createReviewComment(
              "microsoft",
              "PR-Metrics",
              12345,
              "Content",
              "file.ts",
              "sha54321",
            ),
          ).thenCall((): void => {
            throw error;
          });
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
            instance(gitInvoker),
            instance(logger),
            instance(octokitWrapper),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<void> = async () =>
            gitHubReposInvoker.createComment("Content", "file.ts");

          // Assert
          await AssertExtensions.toThrowAsync(func, error.message);
          verify(octokitWrapper.initialize(any())).once();
          verify(
            octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
          ).once();
          verify(
            octokitWrapper.createReviewComment(
              "microsoft",
              "PR-Metrics",
              12345,
              "Content",
              "file.ts",
              "sha54321",
            ),
          ).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.createComment()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
          verify(
            logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
          ).once();
          verify(logger.logDebug("* GitHubReposInvoker.getCommitId()")).once();
        });
      });
    }

    it("should succeed when no file name is specified", async (): Promise<void> => {
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
      await gitHubReposInvoker.createComment("Content", null);

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.createIssueComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
        ),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.createComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("null")).once();
    });
  });

  describe("updateComment()", (): void => {
    it("should succeed when the content is null", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
        instance(gitInvoker),
        instance(logger),
        instance(octokitWrapper),
        instance(runnerInvoker),
      );

      // Act
      await gitHubReposInvoker.updateComment(54321, null);

      // Assert
      verify(logger.logDebug("* GitHubReposInvoker.updateComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).never();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).never();
    });

    it("should succeed when the content is set", async (): Promise<void> => {
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
      await gitHubReposInvoker.updateComment(54321, "Content");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.updateIssueComment(
          "microsoft",
          "PR-Metrics",
          12345,
          54321,
          "Content",
        ),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.updateComment()")).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("null")).once();
    });
  });

  describe("deleteCommentThread()", (): void => {
    it("should succeed", async (): Promise<void> => {
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
      await gitHubReposInvoker.deleteCommentThread(54321);

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.deleteReviewComment("microsoft", "PR-Metrics", 54321),
      ).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.deleteCommentThread()"),
      ).once();
      verify(logger.logDebug("* GitHubReposInvoker.initialize()")).once();
      verify(
        logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()"),
      ).once();
      verify(logger.logDebug("null")).once();
    });
  });
});
