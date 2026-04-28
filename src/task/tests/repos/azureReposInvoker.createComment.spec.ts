/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import {
  CommentThreadStatus,
  type GitPullRequestCommentThread,
} from "azure-devops-node-api/interfaces/GitInterfaces.js";
import {
  createAzureReposInvokerMocks,
  createSut,
} from "./azureReposInvokerTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import ErrorWithStatus from "../wrappers/errorWithStatus.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
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

  describe("createComment()", (): void => {
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
          when(gitApi.createThread(any(), "RepoID", 10, "Project")).thenThrow(
            error,
          );
          const azureReposInvoker: AzureReposInvoker = createSut(
            azureDevOpsApiWrapper,
            gitInvoker,
            logger,
            runnerInvoker,
            tokenManager,
          );

          // Act
          const func: () => Promise<void> = async () =>
            azureReposInvoker.createComment(
              "Comment Content",
              "file.ts",
              CommentThreadStatus.Active,
            );

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
          verify(gitApi.createThread(any(), "RepoID", 10, "Project")).once();
        });
      });
    }

    it("should call the API for no file", async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: "Comment Content" }],
        status: CommentThreadStatus.Active,
      };
      when(
        gitApi.createThread(
          deepEqual(expectedComment),
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
      await azureReposInvoker.createComment(
        "Comment Content",
        null,
        CommentThreadStatus.Active,
      );

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.createThread(
          deepEqual(expectedComment),
          "RepoID",
          10,
          "Project",
        ),
      ).once();
    });

    it("should call the API for no file when called multiple times", async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: "Comment Content" }],
        status: CommentThreadStatus.Active,
      };
      when(
        gitApi.createThread(
          deepEqual(expectedComment),
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
      await azureReposInvoker.createComment(
        "Comment Content",
        null,
        CommentThreadStatus.Active,
      );
      await azureReposInvoker.createComment(
        "Comment Content",
        null,
        CommentThreadStatus.Active,
      );

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.createThread(
          deepEqual(expectedComment),
          "RepoID",
          10,
          "Project",
        ),
      ).twice();
    });

    it("should call the API for a file", async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: "Comment Content" }],
        status: CommentThreadStatus.Active,
        threadContext: {
          filePath: "/file.ts",
          rightFileEnd: {
            line: 1,
            offset: 2,
          },
          rightFileStart: {
            line: 1,
            offset: 1,
          },
        },
      };
      when(
        gitApi.createThread(
          deepEqual(expectedComment),
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
      await azureReposInvoker.createComment(
        "Comment Content",
        "file.ts",
        CommentThreadStatus.Active,
      );

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.createThread(
          deepEqual(expectedComment),
          "RepoID",
          10,
          "Project",
        ),
      ).once();
    });

    it("should call the API for a deleted file", async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: "Comment Content" }],
        status: CommentThreadStatus.Active,
        threadContext: {
          filePath: "/file.ts",
          leftFileEnd: {
            line: 1,
            offset: 2,
          },
          leftFileStart: {
            line: 1,
            offset: 1,
          },
        },
      };
      when(
        gitApi.createThread(
          deepEqual(expectedComment),
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
      await azureReposInvoker.createComment(
        "Comment Content",
        "file.ts",
        CommentThreadStatus.Active,
        true,
      );

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(
        gitApi.createThread(
          deepEqual(expectedComment),
          "RepoID",
          10,
          "Project",
        ),
      ).once();
    });
  });
});
