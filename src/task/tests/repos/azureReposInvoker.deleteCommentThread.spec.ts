/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */


import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { any, anyNumber } from "../testUtilities/mockito.js";
import { createAzureReposInvokerMocks, createSut } from "./azureReposInvokerTestSetup.js";
import { verify, when } from "ts-mockito";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import ErrorWithStatus from "../wrappers/errorWithStatus.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import type { IGitApi } from "azure-devops-node-api/GitApi.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { StatusCodes } from "http-status-codes";
import TokenManager from "../../src/repos/tokenManager.js";
import assert from "node:assert/strict";


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

  describe("deleteCommentThread()", (): void => {
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
          when(gitApi.deleteComment("RepoID", 10, 20, 1, "Project")).thenThrow(
            error,
          );
          const azureReposInvoker: AzureReposInvoker = createSut(azureDevOpsApiWrapper, gitInvoker, logger, runnerInvoker, tokenManager);

          // Act
          const func: () => Promise<void> = async () =>
            azureReposInvoker.deleteCommentThread(20);

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
          verify(gitApi.deleteComment("RepoID", 10, 20, 1, "Project")).once();
        });
      });
    }

    it("should call the API for a single comment", async (): Promise<void> => {
      // Arrange
      when(gitApi.deleteComment("RepoID", 10, 20, 1, "Project")).thenResolve();
      const azureReposInvoker: AzureReposInvoker = createSut(azureDevOpsApiWrapper, gitInvoker, logger, runnerInvoker, tokenManager);

      // Act
      await azureReposInvoker.deleteCommentThread(20);

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.deleteComment("RepoID", 10, 20, 1, "Project")).once();
    });

    it("should call the API when called multiple times", async (): Promise<void> => {
      // Arrange
      when(
        gitApi.deleteComment("RepoID", 10, anyNumber(), 1, "Project"),
      ).thenResolve();
      const azureReposInvoker: AzureReposInvoker = createSut(azureDevOpsApiWrapper, gitInvoker, logger, runnerInvoker, tokenManager);

      // Act
      await azureReposInvoker.deleteCommentThread(20);
      await azureReposInvoker.deleteCommentThread(30);

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.deleteComment("RepoID", 10, 20, 1, "Project")).once();
      verify(gitApi.deleteComment("RepoID", 10, 30, 1, "Project")).once();
    });
  });
});
