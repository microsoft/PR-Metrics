/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */


import { createGitHubReposInvokerMocks, createSut } from "./gitHubReposInvokerTestSetup.js";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { stubEnv } from "../testUtilities/stubEnv.js";



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

  describe("isAccessTokenAvailable()", (): void => {
    it("should return null when the token exists on Azure DevOps", async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = createSut(gitInvoker, logger, octokitWrapper, runnerInvoker);

      // Act
      const result: string | null =
        await gitHubReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(result, null);
    });

    it("should return null when the token exists on GitHub", async (): Promise<void> => {
      // Arrange
      stubEnv(["PR_METRICS_ACCESS_TOKEN", "PAT"]);
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(gitInvoker, logger, octokitWrapper, runnerInvoker);

      // Act
      const result: string | null =
        await gitHubReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(result, null);

    });

    it("should return a string when the token does not exist", async (): Promise<void> => {
      // Arrange
      stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(gitInvoker, logger, octokitWrapper, runnerInvoker);

      // Act
      const result: string | null =
        await gitHubReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(
        result,
        "Could not access the Personal Access Token (PAT). Add 'PR_Metrics_Access_Token' as a secret environment variable with Read and Write access to Pull Requests (or access to 'repos' if using a Classic PAT, or write access to 'pull-requests' and 'statuses' if specified within the workflow YAML).",
      );
    });
  });
});
