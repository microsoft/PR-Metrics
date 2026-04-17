/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { instance, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { createCodeMetricsMocks } from "./codeMetricsTestSetup.js";

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

  describe("getFilesNotRequiringReview()", (): void => {
    {
      const testCases: string[] = ["", "   ", "\t", "\n", "\t\n"];

      testCases.forEach((gitDiffSummary: string): void => {
        it(`should return an empty array when the Git diff summary '${gitDiffSummary}' is empty`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(gitDiffSummary);
          const codeMetrics: CodeMetrics = new CodeMetrics(
            instance(gitInvoker),
            instance(inputs),
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: string[] =
            await codeMetrics.getFilesNotRequiringReview();

          // Assert
          assert.deepEqual(result, []);
        });
      });
    }

    {
      interface TestCaseType {
        elements: number;
        summary: string;
      }

      const testCases: TestCaseType[] = [
        {
          elements: 1,
          summary: "0",
        },
        {
          elements: 1,
          summary: "0\t",
        },
        {
          elements: 2,
          summary: "0\t0",
        },
        {
          elements: 2,
          summary: "0\t0\t",
        },
        {
          elements: 2,
          summary: "0\tfile.ts",
        },
        {
          elements: 2,
          summary: "0\tfile.ts\t",
        },
      ];

      testCases.forEach(({ elements, summary }: TestCaseType): void => {
        it(`should throw when the file name in the Git diff summary '${summary}' cannot be parsed`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(summary);
          const codeMetrics: CodeMetrics = new CodeMetrics(
            instance(gitInvoker),
            instance(inputs),
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const func: () => Promise<string[]> = async () =>
            codeMetrics.getFilesNotRequiringReview();

          // Assert
          await AssertExtensions.toThrowAsync(
            func,
            `The number of elements '${String(elements)}' in '${summary.trim()}' in input '${summary.trim()}' did not match the expected 3.`,
          );
        });
      });
    }

    it("should throw when the lines added in the Git diff summary cannot be converted", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("A\t0\tfile.ts");
      const codeMetrics: CodeMetrics = new CodeMetrics(
        instance(gitInvoker),
        instance(inputs),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Could not parse added lines 'A' from line 'A\t0\tfile.ts'.",
      );
    });

    it("should throw when the lines deleted in the Git diff summary cannot be converted", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("0\tA\tfile.ts");
      const codeMetrics: CodeMetrics = new CodeMetrics(
        instance(gitInvoker),
        instance(inputs),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Could not parse deleted lines 'A' from line '0\tA\tfile.ts'.",
      );
    });
  });
});
