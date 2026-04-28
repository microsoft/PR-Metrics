/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import {
  createAzureReposInvokerMocks,
  createSut,
} from "./azureReposInvokerTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import ErrorWithStatus from "../wrappers/errorWithStatus.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
import type { GitPullRequest } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type { IGitApi } from "azure-devops-node-api/GitApi.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import type TokenManager from "../../src/repos/tokenManager.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";
import { httpStatusCodes } from "../../src/utilities/httpStatusCodes.js";

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

  describe("setTitleAndDescription()", (): void => {
    {
      const testCases: number[] = [
        httpStatusCodes.unauthorized,
        httpStatusCodes.forbidden,
        httpStatusCodes.notFound,
      ];

      testCases.forEach((statusCode: number): void => {
        it(`should throw when the access token has insufficient access and the API call returns status code '${String(statusCode)}'`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus("Test");
          error.statusCode = statusCode;
          when(
            gitApi.updatePullRequest(any(), "RepoID", 10, "Project"),
          ).thenThrow(error);
          const azureReposInvoker: AzureReposInvoker = createSut(
            azureDevOpsApiWrapper,
            gitInvoker,
            logger,
            runnerInvoker,
            tokenManager,
          );

          // Act
          const func: () => Promise<void> = async () =>
            azureReposInvoker.setTitleAndDescription("Title", "Description");

          // Assert
          const expectedMessage: string =
            statusCode === httpStatusCodes.notFound
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
          verify(
            gitApi.updatePullRequest(any(), "RepoID", 10, "Project"),
          ).once();
        });
      });
    }

    it("should not call the API when the title and description are null", async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      await azureReposInvoker.setTitleAndDescription(null, null);

      // Assert
      verify(
        azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT"),
      ).never();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).never();
      verify(gitApi.updatePullRequest(any(), "RepoID", 10, "Project")).never();
    });

    it("should call the API when the title is valid", async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: "Title",
      };
      when(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).thenResolve({});
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      await azureReposInvoker.setTitleAndDescription("Title", null);

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).once();
    });

    it("should call the API when the description is valid", async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        description: "Description",
      };
      when(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).thenResolve({});
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      await azureReposInvoker.setTitleAndDescription(null, "Description");

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).once();
    });

    it("should call the API when both the title and description are valid", async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        description: "Description",
        title: "Title",
      };
      when(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).thenResolve({});
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      await azureReposInvoker.setTitleAndDescription("Title", "Description");

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).once();
    });

    it("should call the API when both the title and description are valid and called multiple times", async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        description: "Description",
        title: "Title",
      };
      when(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).thenResolve({});
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      await azureReposInvoker.setTitleAndDescription("Title", "Description");
      await azureReposInvoker.setTitleAndDescription("Title", "Description");

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.updatePullRequest(
          deepEqual(expectedDetails),
          "RepoID",
          10,
          "Project",
        ),
      ).twice();
    });
  });
});
