/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as Converter from "../../src/utilities/converter.js";
import { instance, mock, verify, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import Logger from "../../src/utilities/logger.js";
import PullRequest from "../../src/pullRequests/pullRequest.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

describe("pullRequest.ts", (): void => {
  let codeMetrics: CodeMetrics;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    codeMetrics = mock(CodeMetrics);
    when(codeMetrics.getSizeIndicator()).thenResolve("S✔");

    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "(XS|S|M|L|\\d*XL)",
        "(✔|⚠️)?",
      ),
    ).thenReturn("(XS|S|M|L|\\d*XL)(✔|⚠️)?");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeL")).thenReturn("L");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeM")).thenReturn("M");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeS")).thenReturn("S");
    when(
      runnerInvoker.loc("metrics.codeMetrics.titleSizeXL", "\\d*"),
    ).thenReturn("\\d*XL");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeXS")).thenReturn("XS");
    when(
      runnerInvoker.loc("metrics.codeMetrics.titleTestsInsufficient"),
    ).thenReturn("⚠️");
    when(
      runnerInvoker.loc("metrics.codeMetrics.titleTestsSufficient"),
    ).thenReturn("✔");
    when(
      runnerInvoker.loc("pullRequests.pullRequest.addDescription"),
    ).thenReturn("❌ **Add a description.**");
    when(
      runnerInvoker.loc("pullRequests.pullRequest.titleFormat", "S✔", ""),
    ).thenReturn("S✔ ◾ ");
    when(
      runnerInvoker.loc("pullRequests.pullRequest.titleFormat", "PREFIX", ""),
    ).thenReturn("PREFIX ◾ ");
    when(
      runnerInvoker.loc("pullRequests.pullRequest.titleFormat", "S✔", "Title"),
    ).thenReturn("S✔ ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "PREFIX",
        "Title",
      ),
    ).thenReturn("PREFIX ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "S✔",
        "PREFIX ◾ Title",
      ),
    ).thenReturn("S✔ ◾ PREFIX ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "S✔",
        "PREFIX✔ ◾ Title",
      ),
    ).thenReturn("S✔ ◾ PREFIX✔ ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "S✔",
        "PREFIX⚠️ ◾ Title",
      ),
    ).thenReturn("S✔ ◾ PREFIX⚠️ ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "S✔",
        "PS ◾ Title",
      ),
    ).thenReturn("S✔ ◾ PS ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "S✔",
        "PS✔ ◾ Title",
      ),
    ).thenReturn("S✔ ◾ PS✔ ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "S✔",
        "PS⚠️ ◾ Title",
      ),
    ).thenReturn("S✔ ◾ PS⚠️ ◾ Title");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequest.titleFormat",
        "(XS|S|M|L|\\d*XL)(✔|⚠️)?",
        "(?<originalTitle>.*)",
      ),
    ).thenReturn("(XS|S|M|L|\\d*XL)(✔|⚠️)? ◾ (?<originalTitle>.*)");
  });

  describe("isPullRequest", (): void => {
    it("should return true when the GitHub runner is being used and GITHUB_BASE_REF is defined", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_BASE_REF = "develop";
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = pullRequest.isPullRequest;

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* PullRequest.isPullRequest")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_BASE_REF;
    });

    it("should return false when the GitHub runner is being used and GITHUB_BASE_REF is the empty string", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_BASE_REF = "";
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = pullRequest.isPullRequest;

      // Assert
      assert.equal(result, false);
      verify(logger.logDebug("* PullRequest.isPullRequest")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_BASE_REF;
    });

    it("should return true when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is defined", (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = "refs/heads/develop";
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = pullRequest.isPullRequest;

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* PullRequest.isPullRequest")).once();

      // Finalization
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
    });

    it("should return false when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is not defined", (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH;
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = pullRequest.isPullRequest;

      // Assert
      assert.equal(result, false);
      verify(logger.logDebug("* PullRequest.isPullRequest")).once();
    });
  });

  describe("isSupportedProvider", (): void => {
    it("should return true when the GitHub runner is being used", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean | string = pullRequest.isSupportedProvider;

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* PullRequest.isSupportedProvider")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should throw an error when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is undefined", (): void => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => boolean | string = () =>
        pullRequest.isSupportedProvider;

      // Assert
      assert.throws(
        func,
        new TypeError(
          "'BUILD_REPOSITORY_PROVIDER', accessed within 'PullRequest.isSupportedProvider', is invalid, null, or undefined 'undefined'.",
        ),
      );
      verify(logger.logDebug("* PullRequest.isSupportedProvider")).once();
    });

    {
      const testCases: string[] = ["TfsGit", "GitHub", "GitHubEnterprise"];

      testCases.forEach((provider: string): void => {
        it(`should return true when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is set to '${provider}'`, (): void => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = provider;
          const pullRequest: PullRequest = new PullRequest(
            instance(codeMetrics),
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: boolean | string = pullRequest.isSupportedProvider;

          // Assert
          assert.equal(result, true);
          verify(logger.logDebug("* PullRequest.isSupportedProvider")).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should return the provider when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is not set to TfsGit or GitHub", (): void => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean | string = pullRequest.isSupportedProvider;

      // Assert
      assert.equal(result, "Other");
      verify(logger.logDebug("* PullRequest.isSupportedProvider")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("getUpdatedDescription()", (): void => {
    it("should return null when the current description is set", (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: string | null =
        pullRequest.getUpdatedDescription("Description");

      // Assert
      assert.equal(result, null);
      verify(logger.logDebug("* PullRequest.getUpdatedDescription()")).once();
    });

    {
      const testCases: (string | undefined)[] = [undefined, "", " "];

      testCases.forEach((currentDescription: string | undefined): void => {
        it(`should return the default description when the current description '${Converter.toString(currentDescription)}' is empty`, (): void => {
          // Arrange
          const pullRequest: PullRequest = new PullRequest(
            instance(codeMetrics),
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: string | null =
            pullRequest.getUpdatedDescription(currentDescription);

          // Assert
          assert.equal(result, "❌ **Add a description.**");
          verify(
            logger.logDebug("* PullRequest.getUpdatedDescription()"),
          ).once();
        });
      });
    }
  });

  describe("getUpdatedTitle()", (): void => {
    it("should return null when the current title is set to the expected title", async (): Promise<void> => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(
        instance(codeMetrics),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: string | null =
        await pullRequest.getUpdatedTitle("S✔ ◾ Title");

      // Assert
      assert.equal(result, null);
      verify(logger.logDebug("* PullRequest.getUpdatedTitle()")).once();
    });

    {
      const testCases: string[] = [
        "Title",
        "PREFIX ◾ Title",
        "PREFIX✔ ◾ Title",
        "PREFIX⚠️ ◾ Title",
        "PS ◾ Title",
        "PS✔ ◾ Title",
        "PS⚠️ ◾ Title",
      ];

      testCases.forEach((currentTitle: string): void => {
        it(`should prefix the current title '${currentTitle}' when no prefix exists`, async (): Promise<void> => {
          // Arrange
          const pullRequest: PullRequest = new PullRequest(
            instance(codeMetrics),
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: string | null =
            await pullRequest.getUpdatedTitle(currentTitle);

          // Assert
          assert.equal(result, `S✔ ◾ ${currentTitle}`);
          verify(logger.logDebug("* PullRequest.getUpdatedTitle()")).once();
        });
      });
    }

    {
      const testCases: string[] = [
        "XS✔ ◾ Title",
        "XS⚠️ ◾ Title",
        "XS ◾ Title",
        "S✔ ◾ Title",
        "S⚠️ ◾ Title",
        "S ◾ Title",
        "M✔ ◾ Title",
        "M⚠️ ◾ Title",
        "M ◾ Title",
        "L✔ ◾ Title",
        "L⚠️ ◾ Title",
        "L ◾ Title",
        "XL✔ ◾ Title",
        "XL⚠️ ◾ Title",
        "XL ◾ Title",
        "2XL✔ ◾ Title",
        "2XL⚠️ ◾ Title",
        "2XL ◾ Title",
        "20XL✔ ◾ Title",
        "20XL⚠️ ◾ Title",
        "20XL ◾ Title",
      ];

      testCases.forEach((currentTitle: string): void => {
        it(`should update the current title '${currentTitle}' correctly`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.getSizeIndicator()).thenResolve("PREFIX");
          const pullRequest: PullRequest = new PullRequest(
            instance(codeMetrics),
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: string | null =
            await pullRequest.getUpdatedTitle(currentTitle);

          // Assert
          assert.equal(result, "PREFIX ◾ Title");
          verify(logger.logDebug("* PullRequest.getUpdatedTitle()")).once();
        });
      });
    }
  });
});
