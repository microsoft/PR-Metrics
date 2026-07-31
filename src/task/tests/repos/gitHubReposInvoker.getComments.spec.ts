/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import {
  commentsPageSize,
  maxCommentPages,
} from "../../src/utilities/constants.js";
import {
  createGitHubReposInvokerMocks,
  createSut,
} from "./gitHubReposInvokerTestSetup.js";
import { verify, when } from "ts-mockito";
import type CommentData from "../../src/repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type GetIssueCommentsResponse from "../../src/wrappers/octokitInterfaces/getIssueCommentsResponse.js";
import type GetReviewCommentsResponse from "../../src/wrappers/octokitInterfaces/getReviewCommentsResponse.js";
import type GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
import type GraphQlViewerResponseInterface from "../../src/wrappers/octokitInterfaces/graphQlViewerResponseInterface.js";
import type Logger from "../../src/utilities/logger.js";
import type OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { localize } from "../testUtilities/stubLocalization.js";
import { toThrowAsync } from "../testUtilities/assertExtensions.js";

describe("gitHubReposInvoker.ts", (): void => {
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let octokitWrapper: OctokitWrapper;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ gitInvoker, logger, octokitWrapper, runnerInvoker } =
      createGitHubReposInvokerMocks());
  });

  describe("getComments()", (): void => {
    it("should return the result when called with a pull request comment", async (): Promise<void> => {
      // Arrange
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.createIssueCommentsResponse(1, 1);
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].body = "PR Content";
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(response);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
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
      assert.equal(
        result.pullRequestComments[0].authorId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      assert.equal(result.fileComments.length, 0);
      assert.equal(
        result.authenticatedUserId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          1,
          commentsPageSize,
        ),
      ).once();
      verify(
        octokitWrapper.getReviewComments(
          "microsoft",
          "PR-Metrics",
          12345,
          1,
          commentsPageSize,
        ),
      ).once();
    });

    it("should return the result when called with a file comment", async (): Promise<void> => {
      // Arrange
      when(
        octokitWrapper.getReviewComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
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
      assert.equal(
        result.fileComments[0].authorId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          1,
          commentsPageSize,
        ),
      ).once();
      verify(
        octokitWrapper.getReviewComments(
          "microsoft",
          "PR-Metrics",
          12345,
          1,
          commentsPageSize,
        ),
      ).once();
    });

    it("should return the result when called with both a pull request and file comment", async (): Promise<void> => {
      // Arrange
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.createIssueCommentsResponse(1, 1);
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].body = "PR Content";
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(response);
      when(
        octokitWrapper.getReviewComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 1);
      assert.equal(result.pullRequestComments[0]?.id, 1);
      assert.equal(result.pullRequestComments[0].content, "PR Content");
      assert.equal(result.fileComments.length, 1);
      assert.equal(result.fileComments[0]?.id, 2);
      assert.equal(result.fileComments[0].content, "File Content");
      assert.equal(result.fileComments[0].fileName, "file.ts");
    });

    it("should skip pull request comments with no body", async (): Promise<void> => {
      // Arrange
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.createIssueCommentsResponse(1, 1);
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].body = undefined;
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(response);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 0);
      assert.equal(result.fileComments.length, 0);
    });

    it("should return the author details for a comment created by another principal", async (): Promise<void> => {
      // Arrange
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.createIssueCommentsResponse(1, 1);
      const [comment] = response.data;
      if (typeof comment === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      const { user } = comment;
      if (user === null) {
        throw new Error("response.data[0].user is null");
      }

      user.id = GitHubReposInvokerConstants.foreignUserId;
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(response);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.pullRequestComments[0]?.authorId,
        GitHubReposInvokerConstants.foreignUserId,
      );
      assert.equal(
        result.authenticatedUserId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
    });

    it("should return null author details when the comment has no associated user", async (): Promise<void> => {
      // Arrange
      const response: GetIssueCommentsResponse =
        GitHubReposInvokerConstants.createIssueCommentsResponse(1, 1);
      if (typeof response.data[0] === "undefined") {
        throw new Error("response.data[0] is undefined");
      }

      response.data[0].user = null;
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(response);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments[0]?.authorId, null);
    });

    it("should read a single page when fewer comments than the page size are present", async (): Promise<void> => {
      // Arrange
      const commentCount = 30;
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createIssueCommentsResponse(
          commentCount,
          1,
        ),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, commentCount);
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          1,
          commentsPageSize,
        ),
      ).once();
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          2,
          commentsPageSize,
        ),
      ).never();
    });

    it("should read a second page when the first page is full", async (): Promise<void> => {
      // Arrange
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          1,
          commentsPageSize,
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createIssueCommentsResponse(
          commentsPageSize,
          1,
        ),
      );
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          2,
          commentsPageSize,
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createIssueCommentsResponse(0, 0),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, commentsPageSize);
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          1,
          commentsPageSize,
        ),
      ).once();
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          2,
          commentsPageSize,
        ),
      ).once();
    });

    it("should read all pages when more comments than the page size are present", async (): Promise<void> => {
      // Arrange
      const secondPageCount = 1;
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          1,
          commentsPageSize,
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createIssueCommentsResponse(
          commentsPageSize,
          1,
        ),
      );
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          2,
          commentsPageSize,
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createIssueCommentsResponse(
          secondPageCount,
          commentsPageSize + 1,
        ),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.pullRequestComments.length,
        commentsPageSize + secondPageCount,
      );
      assert.equal(
        result.pullRequestComments[commentsPageSize]?.id,
        commentsPageSize + 1,
      );
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          3,
          commentsPageSize,
        ),
      ).never();
    });

    it("should throw when the pull request comment page limit is exceeded", async (): Promise<void> => {
      // Arrange
      when(
        octokitWrapper.getIssueComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createIssueCommentsResponse(
          commentsPageSize,
          1,
        ),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const func: () => Promise<CommentData> = async (): Promise<CommentData> =>
        gitHubReposInvoker.getComments();

      // Assert
      const error: Error = await toThrowAsync(
        func,
        localize(
          "repos.gitHubReposInvoker.tooManyComments",
          (commentsPageSize * maxCommentPages).toLocaleString(),
        ),
      );
      assert.ok(
        error.message.includes(
          `at least ${(commentsPageSize * maxCommentPages).toLocaleString()} comments`,
        ),
        error.message,
      );
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          maxCommentPages,
          commentsPageSize,
        ),
      ).once();
      verify(
        octokitWrapper.getIssueComments(
          "microsoft",
          "PR-Metrics",
          12345,
          maxCommentPages + 1,
          commentsPageSize,
        ),
      ).never();
    });

    it("should throw when the file comment page limit is exceeded", async (): Promise<void> => {
      // Arrange
      when(
        octokitWrapper.getReviewComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createReviewCommentsResponse(
          commentsPageSize,
          1,
        ),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const func: () => Promise<CommentData> = async (): Promise<CommentData> =>
        gitHubReposInvoker.getComments();

      // Assert
      await toThrowAsync(
        func,
        localize(
          "repos.gitHubReposInvoker.tooManyComments",
          (commentsPageSize * maxCommentPages).toLocaleString(),
        ),
      );
    });

    it("should read file comments across pages", async (): Promise<void> => {
      // Arrange
      const secondPageCount = 1;
      when(
        octokitWrapper.getReviewComments(
          anyString(),
          anyString(),
          anyNumber(),
          1,
          commentsPageSize,
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createReviewCommentsResponse(
          commentsPageSize,
          1,
        ),
      );
      when(
        octokitWrapper.getReviewComments(
          anyString(),
          anyString(),
          anyNumber(),
          2,
          commentsPageSize,
        ),
      ).thenResolve(
        GitHubReposInvokerConstants.createReviewCommentsResponse(
          secondPageCount,
          commentsPageSize + 1,
        ),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.fileComments.length,
        commentsPageSize + secondPageCount,
      );
      assert.equal(
        result.fileComments[commentsPageSize]?.fileName,
        `file${String(commentsPageSize + 1)}.ts`,
      );
    });

    it("should resolve the principal via the GraphQL APIs without invoking the REST APIs", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.authenticatedUserId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      verify(octokitWrapper.getAuthenticatedViewer()).once();
      verify(octokitWrapper.getAuthenticatedUser()).never();
    });

    it("should use the REST APIs when the GraphQL APIs cannot identify the principal", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.getAuthenticatedViewer()).thenReject(
        new Error("Resource not accessible by personal access token"),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.authenticatedUserId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      verify(octokitWrapper.getAuthenticatedViewer()).once();
      verify(octokitWrapper.getAuthenticatedUser()).once();
    });

    it("should use the REST APIs when the GraphQL viewer has no database ID", async (): Promise<void> => {
      // Arrange
      const viewerResponse: GraphQlViewerResponseInterface = structuredClone(
        GitHubReposInvokerConstants.graphQlViewerResponse,
      );
      viewerResponse.viewer.databaseId = null;
      when(octokitWrapper.getAuthenticatedViewer()).thenResolve(viewerResponse);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.authenticatedUserId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      verify(octokitWrapper.getAuthenticatedUser()).once();
    });

    it("should throw when the principal cannot be identified", async (): Promise<void> => {
      // Arrange
      const viewerResponse: GraphQlViewerResponseInterface = structuredClone(
        GitHubReposInvokerConstants.graphQlViewerResponse,
      );
      viewerResponse.viewer.databaseId = null;
      when(octokitWrapper.getAuthenticatedViewer()).thenResolve(viewerResponse);
      when(octokitWrapper.getAuthenticatedUser()).thenReject(
        new Error("Resource not accessible by integration"),
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const func: () => Promise<CommentData> = async (): Promise<CommentData> =>
        gitHubReposInvoker.getComments();

      // Assert
      await toThrowAsync(
        func,
        localize("repos.gitHubReposInvoker.unidentifiablePrincipal"),
      );
    });

    it("should resolve the authenticated principal only once", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.getComments();
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(
        result.authenticatedUserId,
        GitHubReposInvokerConstants.authenticatedUserId,
      );
      verify(octokitWrapper.getAuthenticatedViewer()).once();
      verify(octokitWrapper.getAuthenticatedUser()).never();
    });

    it("should return no comments when the pull request has none", async (): Promise<void> => {
      // Arrange
      const emptyReviewComments: GetReviewCommentsResponse =
        GitHubReposInvokerConstants.createReviewCommentsResponse(0, 0);
      when(
        octokitWrapper.getReviewComments(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve(emptyReviewComments);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments();

      // Assert
      assert.equal(result.pullRequestComments.length, 0);
      assert.equal(result.fileComments.length, 0);
    });
  });
});
