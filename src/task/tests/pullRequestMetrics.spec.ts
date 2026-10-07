/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, mock, verify, when } from "ts-mockito";
import {
  localize,
  stubLocalization,
} from "./testUtilities/stubLocalization.js";
import CodeMetricsCalculator from "../src/metrics/codeMetricsCalculator.js";
import Logger from "../src/utilities/logger.js";
import PullRequestMetrics from "../src/pullRequestMetrics.js";
import RunnerInvoker from "../src/runners/runnerInvoker.js";
import { any } from "./testUtilities/mockito.js";

describe("pullRequestMetrics.ts", (): void => {
  let codeMetricsCalculator: CodeMetricsCalculator;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    codeMetricsCalculator = mock(CodeMetricsCalculator);
    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    stubLocalization(runnerInvoker);
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
      verify(codeMetricsCalculator.updateLabels()).never();
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
      verify(codeMetricsCalculator.updateLabels()).never();
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
      verify(codeMetricsCalculator.updateLabels()).once();
      verify(
        runnerInvoker.setStatusSucceeded(
          localize("pullRequestMetrics.succeeded"),
        ),
      ).once();
    });

    it("should fail and log when label synchronization rejects", async (): Promise<void> => {
      const error: Error = new Error("Labels failed");
      when(codeMetricsCalculator.updateLabels()).thenReject(error);
      const sut: PullRequestMetrics = new PullRequestMetrics(
        instance(codeMetricsCalculator),
        instance(logger),
        instance(runnerInvoker),
      );

      await sut.run("Folder");

      verify(logger.logErrorObject(error)).once();
      verify(logger.replay()).once();
      verify(runnerInvoker.setStatusFailed("Labels failed")).once();
      verify(runnerInvoker.setStatusSucceeded(any())).never();
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

    it("should handle non-Error thrown values", async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
        instance(codeMetricsCalculator),
        instance(logger),
        instance(runnerInvoker),
      );
      when(codeMetricsCalculator.shouldSkip).thenCall((): string | null => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- Testing non-Error throw.
        throw "String error";
      });

      // Act
      await pullRequestMetrics.run("Folder");

      // Assert
      verify(runnerInvoker.locInitialize("Folder")).once();
      verify(runnerInvoker.setStatusFailed("String error")).once();
    });
  });
});
