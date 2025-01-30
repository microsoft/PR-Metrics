/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, mock, verify, when } from "ts-mockito";
import CodeMetricsCalculator from "../src/metrics/codeMetricsCalculator.mjs";
import Logger from "../src/utilities/logger.mjs";
import PullRequestMetrics from "../src/pullRequestMetrics.mjs";
import RunnerInvoker from "../src/runners/runnerInvoker.mjs";

describe("pullRequestMetrics.ts", (): void => {
  let codeMetricsCalculator: CodeMetricsCalculator;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    codeMetricsCalculator = mock(CodeMetricsCalculator);
    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    when(runnerInvoker.loc("pullRequestMetrics.succeeded")).thenReturn(
      "PR Metrics succeeded",
    );
  });

  describe("run()", (): void => {
    it("should skip when receiving a skip flag", async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
        instance(codeMetricsCalculator),
        instance(logger),
        instance(runnerInvoker),
      );
      when(codeMetricsCalculator.shouldSkip).thenReturn("Skip");

      // Act
      await pullRequestMetrics.run("Folder");

      // Assert
      verify(runnerInvoker.locInitialize("Folder")).once();
      verify(runnerInvoker.setStatusSkipped("Skip")).once();
    });

    it("should fail when receiving a stop flag", async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
        instance(codeMetricsCalculator),
        instance(logger),
        instance(runnerInvoker),
      );
      when(codeMetricsCalculator.shouldStop()).thenResolve("Stop");

      // Act
      await pullRequestMetrics.run("Folder");

      // Assert
      verify(runnerInvoker.locInitialize("Folder")).once();
      verify(runnerInvoker.setStatusFailed("Stop")).once();
    });

    it("should succeed when no skip or stop flag is received", async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
        instance(codeMetricsCalculator),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      await pullRequestMetrics.run("Folder");

      // Assert
      verify(runnerInvoker.locInitialize("Folder")).once();
      verify(codeMetricsCalculator.updateDetails()).once();
      verify(codeMetricsCalculator.updateComments()).once();
      verify(runnerInvoker.setStatusSucceeded("PR Metrics succeeded")).once();
    });

    it("should catch and log errors", async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
        instance(codeMetricsCalculator),
        instance(logger),
        instance(runnerInvoker),
      );
      const error: Error = new Error("Error Message");
      when(codeMetricsCalculator.shouldSkip).thenThrow(error);

      // Act
      await pullRequestMetrics.run("Folder");

      // Assert
      verify(runnerInvoker.locInitialize("Folder")).once();
      verify(logger.logErrorObject(error)).once();
      verify(logger.replay()).once();
      verify(runnerInvoker.setStatusFailed("Error Message")).once();
    });
  });
});
