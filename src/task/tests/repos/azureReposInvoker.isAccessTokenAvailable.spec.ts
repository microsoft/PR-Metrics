/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  createAzureReposInvokerMocks,
  createSut,
} from "./azureReposInvokerTestSetup.js";
import type AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import type TokenManager from "../../src/repos/tokenManager.js";
import assert from "node:assert/strict";
import { localize } from "../testUtilities/stubLocalization.js";
import { stubEnv } from "../testUtilities/stubEnv.js";
import { when } from "ts-mockito";

describe("azureReposInvoker.ts", (): void => {
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;
  let tokenManager: TokenManager;

  beforeEach((): void => {
    ({
      azureDevOpsApiWrapper,
      gitInvoker,
      logger,
      runnerInvoker,
      tokenManager,
    } = createAzureReposInvokerMocks());
  });

  describe("isAccessTokenAvailable()", (): void => {
    it("should return null when the token exists", async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: string | null =
        await azureReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(result, null);
    });

    it("should return a string when the token manager fails", async (): Promise<void> => {
      // Arrange
      stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );
      when(tokenManager.getToken()).thenResolve("Failure");

      // Act
      const result: string | null =
        await azureReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(result, "Failure");
    });

    it("should return a string when the token does not exist", async (): Promise<void> => {
      // Arrange
      stubEnv(["PR_METRICS_ACCESS_TOKEN", undefined]);
      const azureReposInvoker: AzureReposInvoker = createSut(
        azureDevOpsApiWrapper,
        gitInvoker,
        logger,
        runnerInvoker,
        tokenManager,
      );

      // Act
      const result: string | null =
        await azureReposInvoker.isAccessTokenAvailable();

      // Assert
      assert.equal(
        result,
        localize("repos.azureReposInvoker.noAzureReposAccessToken"),
      );
    });
  });
});
