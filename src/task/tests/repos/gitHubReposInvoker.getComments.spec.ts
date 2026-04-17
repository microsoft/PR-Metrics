/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import { createGitHubReposInvokerMocks, expectedUserAgent } from "./gitHubReposInvokerTestSetup.js";
import { instance, verify, when } from "ts-mockito";
import type CommentData from "../../src/repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type GetIssueCommentsResponse from "../../src/wrappers/octokitInterfaces/getIssueCommentsResponse.js";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import type { OctokitOptions } from "@octokit/core";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

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
    });
  });
});
