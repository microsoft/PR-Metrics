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
import { verify, when } from "ts-mockito";
import type AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import type CommentData from "../../src/repos/interfaces/commentData.js";
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

  describe("getComments()", (): void => {
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
          when(gitApi.getThreads("RepoID", 10, "Project")).thenThrow(error);
          const azureReposInvoker: AzureReposInvoker = createSut(
            azureDevOpsApiWrapper,
            gitInvoker,
            logger,
            runnerInvoker,
            tokenManager,
          );

          // Act
          const func: () => Promise<CommentData> = async () =>
            azureReposInvoker.getComments();

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
          verify(gitApi.getThreads("RepoID", 10, "Project")).once();
        });
      });
    }

    it("should return the result when called with a pull request comment whose thread context is undefined", async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve([
        { comments: [{ content: "Content" }], id: 1, status: 1 },
      ]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: CommentData = await azureReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "Content");
      assert.equal(
        result.pullRequestComments[0].status,
        CommentThreadStatus.Active,
      );
      assert.equal(result.fileComments.length, 0);
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).once();
    });

    it("should return the result when called with a pull request comment whose thread context is null", async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve([
        {
          comments: [{ content: "Content" }],
          id: 1,
          status: 1,
          threadContext: null as unknown as undefined,
        },
      ]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: CommentData = await azureReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "Content");
      assert.equal(
        result.pullRequestComments[0].status,
        CommentThreadStatus.Active,
      );
      assert.equal(result.fileComments.length, 0);
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).once();
    });

    it("should return the result when called with a file comment", async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve([
        {
          comments: [{ content: "Content" }],
          id: 1,
          status: 1,
          threadContext: { filePath: "/file.ts" },
        },
      ]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: CommentData = await azureReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 0);
      assert.equal(result.fileComments.length, 1);
      assert.equal(result.fileComments[0]?.id, 1);
      assert.equal(result.fileComments[0].content, "Content");
      assert.equal(result.fileComments[0].status, CommentThreadStatus.Active);
      assert.equal(result.fileComments[0].fileName, "file.ts");
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).once();
    });

    it("should return the result when called with both a pull request and file comment", async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve([
        { comments: [{ content: "PR Content" }], id: 1, status: 1 },
        {
          comments: [{ content: "File Content" }],
          id: 2,
          status: 1,
          threadContext: { filePath: "/file.ts" },
        },
      ]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: CommentData = await azureReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "PR Content");
      assert.equal(
        result.pullRequestComments[0].status,
        CommentThreadStatus.Active,
      );
      assert.equal(result.fileComments.length, 1);
      assert.equal(result.fileComments[0]?.id, 2);
      assert.equal(result.fileComments[0].content, "File Content");
      assert.equal(result.fileComments[0].status, CommentThreadStatus.Active);
      assert.equal(result.fileComments[0].fileName, "file.ts");
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).once();
    });

    it("should return the result when called multiple times", async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve([
        { comments: [{ content: "Content" }], id: 1, status: 1 },
      ]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      await azureReposInvoker.getComments();
      const result: CommentData = await azureReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "Content");
      assert.equal(
        result.pullRequestComments[0].status,
        CommentThreadStatus.Active,
      );
      assert.equal(result.fileComments.length, 0);
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).twice();
    });

    it("should throw when provided with a payload with no ID", async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve([
        { comments: [{ content: "Content" }], status: 1 },
      ]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const func: () => Promise<CommentData> = async () =>
        azureReposInvoker.getComments();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'commentThread[0].id', accessed within 'AzureReposInvoker.convertPullRequestComments()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).once();
    });

    it("should continue if the payload has no status", async (): Promise<void> => {
      // Arrange
      const getThreadsResult: GitPullRequestCommentThread[] = [
        { comments: [{ content: "PR Content" }], id: 1 },
        {
          comments: [{ content: "File Content" }],
          id: 2,
          threadContext: { filePath: "/file.ts" },
        },
      ];
      when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve(
        getThreadsResult,
      );
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: CommentData = await azureReposInvoker.getComments();

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
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).once();
      verify(
        azureDevOpsApiWrapper.getWebApiInstance(
          "https://dev.azure.com/organization",
          any(),
        ),
      ).once();
      verify(gitApi.getThreads("RepoID", 10, "Project")).once();
    });

    {
      const testCases: GitPullRequestCommentThread[] = [
        { id: 1, status: 1 },
        { comments: [], id: 1, status: 1 },
        { comments: [{}], id: 1, status: 1 },
        { comments: [{ content: "" }], id: 1, status: 1 },
        {
          comments: [{ content: "Content" }],
          id: 1,
          status: 1,
          threadContext: {},
        },
        {
          comments: [{ content: "Content" }],
          id: 1,
          status: 1,
          threadContext: { filePath: "" },
        },
        {
          comments: [{ content: "Content" }],
          id: 1,
          status: 1,
          threadContext: { filePath: "/" },
        },
      ];

      testCases.forEach((commentThread: GitPullRequestCommentThread): void => {
        it(`should skip the comment with the malformed payload '${JSON.stringify(commentThread)}'`, async (): Promise<void> => {
          // Arrange
          const getThreadsResult: GitPullRequestCommentThread[] = [
            commentThread,
            { comments: [{ content: "PR Content" }], id: 2, status: 1 },
            {
              comments: [{ content: "File Content" }],
              id: 3,
              status: 1,
              threadContext: { filePath: "/file.ts" },
            },
          ];
          when(gitApi.getThreads("RepoID", 10, "Project")).thenResolve(
            getThreadsResult,
          );
          const azureReposInvoker: AzureReposInvoker = createSut(
            azureDevOpsApiWrapper,
            gitInvoker,
            logger,
            runnerInvoker,
            tokenManager,
          );

          // Act
          const result: CommentData = await azureReposInvoker.getComments();

          // Assert
          assert.equal(result.pullRequestComments.length, 1);
          assert.equal(result.pullRequestComments[0]?.id, 2);
          assert.equal(result.pullRequestComments[0].content, "PR Content");
          assert.equal(
            result.pullRequestComments[0].status,
            CommentThreadStatus.Active,
          );
          assert.equal(result.fileComments.length, 1);
          assert.equal(result.fileComments[0]?.id, 3);
          assert.equal(result.fileComments[0].content, "File Content");
          assert.equal(
            result.fileComments[0].status,
            CommentThreadStatus.Active,
          );
          assert.equal(result.fileComments[0].fileName, "file.ts");
          verify(
            azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT"),
          ).once();
          verify(
            azureDevOpsApiWrapper.getWebApiInstance(
              "https://dev.azure.com/organization",
              any(),
            ),
          ).once();
          verify(gitApi.getThreads("RepoID", 10, "Project")).once();
        });
      });
    }
  });
});
