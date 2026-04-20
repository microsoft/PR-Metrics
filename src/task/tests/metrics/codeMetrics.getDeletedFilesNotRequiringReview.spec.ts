/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */


import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { createCodeMetricsMocks, createSut } from "./codeMetricsTestSetup.js";
import type CodeMetrics from "../../src/metrics/codeMetrics.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
import type Inputs from "../../src/metrics/inputs.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { when } from "ts-mockito";


describe("codeMetrics.ts", (): void => {
  let gitInvoker: GitInvoker;
  let inputs: Inputs;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({
      gitInvoker,
      inputs,
      logger,
      runnerInvoker,
    } = createCodeMetricsMocks());
  });

  describe("getDeletedFilesNotRequiringReview()", (): void => {
    it("should return an empty array when the Git diff summary '' is empty", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("");
      const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

      // Act
      const result: string[] =
        await codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      assert.deepEqual(result, []);
    });

    it("should throw when the file name in the Git diff summary '0' cannot be parsed", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("0");
      const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "The number of elements '1' in '0' in input '0' did not match the expected 3.",
      );
    });

    it("should throw when the lines added in the Git diff summary cannot be converted", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("A\t0\tfile.ts");
      const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Could not parse added lines 'A' from line 'A\t0\tfile.ts'.",
      );
    });

    it("should throw when the lines deleted in the Git diff summary cannot be converted", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("0\tA\tfile.ts");
      const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Could not parse deleted lines 'A' from line '0\tA\tfile.ts'.",
      );
    });
  });
});
