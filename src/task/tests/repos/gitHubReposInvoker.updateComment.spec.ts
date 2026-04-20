/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  createGitHubReposInvokerMocks,
  createSut,
  expectedUserAgent,
} from "./gitHubReposInvokerTestSetup.js";
import { verify, when } from "ts-mockito";
import type GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
import type Logger from "../../src/utilities/logger.js";
import type { OctokitOptions } from "@octokit/core";
import type OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";

describe("gitHubReposInvoker.ts", (): void => {
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let octokitWrapper: OctokitWrapper;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ gitInvoker, logger, octokitWrapper, runnerInvoker } =
      createGitHubReposInvokerMocks());
  });

  describe("updateComment()", (): void => {
    it("should succeed when the content is null", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.updateComment(54321, null);

      // Assert
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
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
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
    });
  });
});
