/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { createGitHubReposInvokerMocks, expectedUserAgent } from "./gitHubReposInvokerTestSetup.js";
import { instance, verify, when } from "ts-mockito";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import type { OctokitOptions } from "@octokit/core";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { any } from "../testUtilities/mockito.js";
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
    });
  });
});
