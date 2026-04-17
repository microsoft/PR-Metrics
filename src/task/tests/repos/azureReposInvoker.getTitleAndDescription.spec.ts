/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { instance, verify, when } from "ts-mockito";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import ErrorWithStatus from "../wrappers/errorWithStatus.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import type { IGitApi } from "azure-devops-node-api/GitApi.js";
import Logger from "../../src/utilities/logger.js";
import type PullRequestDetailsInterface from "../../src/repos/interfaces/pullRequestDetailsInterface.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { StatusCodes } from "http-status-codes";
import TokenManager from "../../src/repos/tokenManager.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";
import { createAzureReposInvokerMocks } from "./azureReposInvokerTestSetup.js";
import { stubEnv } from "../testUtilities/stubEnv.js";

describe("azureReposInvoker.ts", (): void => {
  let gitApi: IGitApi;
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;
  let tokenManager: TokenManager;

  beforeEach((): void => {
    ({
      gitApi,
      azureDevOpsApiWrapper,
      gitInvoker,
      logger,
      runnerInvoker,
      tokenManager,
    } = createAzureReposInvokerMocks());
  });

  describe("getTitleAndDescription()", (): void => {
    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_TEAMPROJECT is set to the invalid value '${String(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (typeof variable === "undefined") {
            stubEnv(["SYSTEM_TEAMPROJECT", undefined]);
          } else {
            stubEnv(["SYSTEM_TEAMPROJECT", variable]);
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
            instance(azureDevOpsApiWrapper),
            instance(gitInvoker),
            instance(logger),
            instance(runnerInvoker),
            instance(tokenManager),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            azureReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'SYSTEM_TEAMPROJECT', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${String(variable)}'.`,
          );
        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when BUILD_REPOSITORY_ID is set to the invalid value '${String(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (typeof variable === "undefined") {
            stubEnv(["BUILD_REPOSITORY_ID", undefined]);
          } else {
            stubEnv(["BUILD_REPOSITORY_ID", variable]);
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
            instance(azureDevOpsApiWrapper),
            instance(gitInvoker),
            instance(logger),
            instance(runnerInvoker),
            instance(tokenManager),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            azureReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'BUILD_REPOSITORY_ID', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${String(variable)}'.`,
          );
        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when PR_METRICS_ACCESS_TOKEN is set to the invalid value '${String(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (typeof variable === "undefined") {
            stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
          } else {
            stubEnv(["PR_METRICS_ACCESS_TOKEN", variable]);
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
            instance(azureDevOpsApiWrapper),
            instance(gitInvoker),
            instance(logger),
            instance(runnerInvoker),
            instance(tokenManager),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            azureReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'PR_METRICS_ACCESS_TOKEN', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${String(variable)}'.`,
          );
        });
      });
    }

    {
      const testCases: (string | undefined)[] = [undefined, ""];

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_TEAMFOUNDATIONCOLLECTIONURI is set to the invalid value '${String(variable)}'`, async (): Promise<void> => {
          // Arrange
          if (typeof variable === "undefined") {
            stubEnv(["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI", undefined]);
          } else {
            stubEnv(["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI", variable]);
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
            instance(azureDevOpsApiWrapper),
            instance(gitInvoker),
            instance(logger),
            instance(runnerInvoker),
            instance(tokenManager),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            azureReposInvoker.getTitleAndDescription();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `'SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${String(variable)}'.`,
          );
          verify(
            azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT"),
          ).once();
        });
      });
    }

    {
      const testCases: StatusCodes[] = [
        StatusCodes.UNAUTHORIZED,
        StatusCodes.FORBIDDEN,
        StatusCodes.NOT_FOUND,
      ];

      testCases.forEach((statusCode: StatusCodes): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${String(statusCode)}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus("Test");
          error.statusCode = statusCode;
          when(gitApi.getPullRequestById(10, "Project")).thenThrow(error);
          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
            instance(azureDevOpsApiWrapper),
            instance(gitInvoker),
            instance(logger),
            instance(runnerInvoker),
            instance(tokenManager),
          );

          // Act
          const func: () => Promise<PullRequestDetailsInterface> = async () =>
            azureReposInvoker.getTitleAndDescription();

          // Assert
          const expectedMessage: string =
            statusCode === StatusCodes.NOT_FOUND
              ? "The resource could not be found. Verify the repository and pull request exist."
              : "Could not access the resources. Ensure the 'PR_Metrics_Access_Token' secret environment variable has access to 'Code' > 'Read & write' and 'Pull Request Threads' > 'Read & write'.";
          const result: ErrorWithStatus = await AssertExtensions.toThrowAsync(
            func,
            expectedMessage,
          );
          assert.equal(result.internalMessage, "Test");
          verify(
            azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT"),
          ).once();
          verify(
            azureDevOpsApiWrapper.getWebApiInstance(
              "https://dev.azure.com/organization",
              any(),
            ),
          ).once();
          verify(gitApi.getPullRequestById(10, "Project")).once();
        });
      });
    }

    it("should return the title and description when available", async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, "Project")).thenResolve({
        description: "Description",
        title: "Title",
      });
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
        instance(azureDevOpsApiWrapper),
        instance(gitInvoker),
        instance(logger),
        instance(runnerInvoker),
        instance(tokenManager),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await azureReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getPullRequestById(10, "Project")).once();
    });

    it("should return the title and description when available and called multiple times", async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, "Project")).thenResolve({
        description: "Description",
        title: "Title",
      });
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
        instance(azureDevOpsApiWrapper),
        instance(gitInvoker),
        instance(logger),
        instance(runnerInvoker),
        instance(tokenManager),
      );

      // Act
      await azureReposInvoker.getTitleAndDescription();
      const result: PullRequestDetailsInterface =
        await azureReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, "Description");
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getPullRequestById(10, "Project")).twice();
    });

    it("should return the title when the description is unavailable", async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, "Project")).thenResolve({
        title: "Title",
      });
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
        instance(azureDevOpsApiWrapper),
        instance(gitInvoker),
        instance(logger),
        instance(runnerInvoker),
        instance(tokenManager),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await azureReposInvoker.getTitleAndDescription();

      // Assert
      assert.equal(result.title, "Title");
      assert.equal(result.description, null);
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getPullRequestById(10, "Project")).once();
    });

    it("should throw when the title is unavailable", async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, "Project")).thenResolve({});
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
        instance(azureDevOpsApiWrapper),
        instance(gitInvoker),
        instance(logger),
        instance(runnerInvoker),
        instance(tokenManager),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () =>
        azureReposInvoker.getTitleAndDescription();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'title', accessed within 'AzureReposInvoker.getTitleAndDescription()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getPullRequestById(10, "Project")).once();
    });
  });
});
