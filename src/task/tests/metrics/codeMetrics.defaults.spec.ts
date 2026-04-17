/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import CodeMetricsData from "../../src/metrics/codeMetricsData.js";
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

  {
    interface TestCaseType {
      gitResponse: string;
      metrics: CodeMetricsData;
      sizeIndicator: string;
      testCoverageIndicator: boolean;
    }

    const testCases: TestCaseType[] = [
      {
        gitResponse: "0\t0\tfile.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ts",
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1\t0\tfile.ts\n1\t0\ttest.ts",
        metrics: new CodeMetricsData(1, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "199\t0\tfile.ts",
        metrics: new CodeMetricsData(199, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "199\t0\tfile.ts\n198\t0\ttest.ts",
        metrics: new CodeMetricsData(199, 198, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "199\t0\tfile.ts\n199\t0\ttest.ts",
        metrics: new CodeMetricsData(199, 199, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "200\t0\tfile.ts",
        metrics: new CodeMetricsData(200, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "200\t0\tfile.ts\n199\t0\ttest.ts",
        metrics: new CodeMetricsData(200, 199, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "200\t0\tfile.ts\n200\t0\ttest.ts",
        metrics: new CodeMetricsData(200, 200, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "399\t0\tfile.ts",
        metrics: new CodeMetricsData(399, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "399\t0\tfile.ts\n398\t0\ttest.ts",
        metrics: new CodeMetricsData(399, 398, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "399\t0\tfile.ts\n399\t0\ttest.ts",
        metrics: new CodeMetricsData(399, 399, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "400\t0\tfile.ts",
        metrics: new CodeMetricsData(400, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "400\t0\tfile.ts\n399\t0\ttest.ts",
        metrics: new CodeMetricsData(400, 399, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "400\t0\tfile.ts\n400\t0\ttest.ts",
        metrics: new CodeMetricsData(400, 400, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "799\t0\tfile.ts",
        metrics: new CodeMetricsData(799, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "799\t0\tfile.ts\n798\t0\ttest.ts",
        metrics: new CodeMetricsData(799, 798, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "799\t0\tfile.ts\n799\t0\ttest.ts",
        metrics: new CodeMetricsData(799, 799, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "800\t0\tfile.ts",
        metrics: new CodeMetricsData(800, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "800\t0\tfile.ts\n799\t0\ttest.ts",
        metrics: new CodeMetricsData(800, 799, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "800\t0\tfile.ts\n800\t0\ttest.ts",
        metrics: new CodeMetricsData(800, 800, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1599\t0\tfile.ts",
        metrics: new CodeMetricsData(1599, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1599\t0\tfile.ts\n1598\t0\ttest.ts",
        metrics: new CodeMetricsData(1599, 1598, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1599\t0\tfile.ts\n1599\t0\ttest.ts",
        metrics: new CodeMetricsData(1599, 1599, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1600\t0\tfile.ts",
        metrics: new CodeMetricsData(1600, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1600\t0\tfile.ts\n1599\t0\ttest.ts",
        metrics: new CodeMetricsData(1600, 1599, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1600\t0\tfile.ts\n1600\t0\ttest.ts",
        metrics: new CodeMetricsData(1600, 1600, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "3199\t0\tfile.ts",
        metrics: new CodeMetricsData(3199, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3199\t0\tfile.ts\n3198\t0\ttest.ts",
        metrics: new CodeMetricsData(3199, 3198, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3199\t0\tfile.ts\n3199\t0\ttest.ts",
        metrics: new CodeMetricsData(3199, 3199, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "3200\t0\tfile.ts",
        metrics: new CodeMetricsData(3200, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3200\t0\tfile.ts\n3199\t0\ttest.ts",
        metrics: new CodeMetricsData(3200, 3199, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3200\t0\tfile.ts\n3200\t0\ttest.ts",
        metrics: new CodeMetricsData(3200, 3200, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "6399\t0\tfile.ts",
        metrics: new CodeMetricsData(6399, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6399\t0\tfile.ts\n6398\t0\ttest.ts",
        metrics: new CodeMetricsData(6399, 6398, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6399\t0\tfile.ts\n6399\t0\ttest.ts",
        metrics: new CodeMetricsData(6399, 6399, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "6400\t0\tfile.ts",
        metrics: new CodeMetricsData(6400, 0, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6400\t0\tfile.ts\n6399\t0\ttest.ts",
        metrics: new CodeMetricsData(6400, 6399, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6400\t0\tfile.ts\n6400\t0\ttest.ts",
        metrics: new CodeMetricsData(6400, 6400, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "819200\t0\tfile.ts",
        metrics: new CodeMetricsData(819200, 0, 0),
        sizeIndicator: "10XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "819200\t0\tfile.ts\n819199\t0\ttest.ts",
        metrics: new CodeMetricsData(819200, 819199, 0),
        sizeIndicator: "10XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "819200\t0\tfile.ts\n819200\t0\ttest.ts",
        metrics: new CodeMetricsData(819200, 819200, 0),
        sizeIndicator: "10XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.TS",
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "0\t1\tfile.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ignored",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ts.ignored",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ignored.ts",
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1\t0\ttest.ignored",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttasb.cc => test.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tt{a => e}s{b => t}.t{c => s}",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tt{a => est.ts}",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\t{a => test.ts}",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/test.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/Test.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/TEST.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/DuplicateStorage.ts",
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1\t0\tfolder/file.spec.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/file.Spec.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder.spec.ts/file.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttest/file.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttests/file.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttests/file.spec.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttests/file.SPEC.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/tests/file.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t1\tfa/b => folder/test.ts",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t1\tf{a => older}/{b => test.ts}",
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "0\t0\tfile.ts\n",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "-\t-\tfile.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "0\t0\tfile.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
    ];

    testCases.forEach(
      ({
        gitResponse,
        metrics,
        sizeIndicator,
        testCoverageIndicator,
      }: TestCaseType): void => {
        it(`with default inputs and git diff '${gitResponse.replace(/\n/gu, "\\n").replace(/\r/gu, "\\r")}', returns '${sizeIndicator}' size and '${String(testCoverageIndicator)}' test coverage`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(gitResponse);

          // Act
          const codeMetrics: CodeMetrics = new CodeMetrics(
            instance(gitInvoker),
            instance(inputs),
            instance(logger),
            instance(runnerInvoker),
          );

          // Assert
          assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), []);
          assert.deepEqual(
            await codeMetrics.getDeletedFilesNotRequiringReview(),
            [],
          );
          assert.equal(await codeMetrics.getSize(), sizeIndicator);
          assert.equal(
            await codeMetrics.getSizeIndicator(),
            `${sizeIndicator}${testCoverageIndicator ? "✔" : "⚠️"}`,
          );
          assert.deepEqual(await codeMetrics.getMetrics(), metrics);
          assert.equal(
            await codeMetrics.isSmall(),
            sizeIndicator === "XS" || sizeIndicator === "S",
          );
          assert.equal(
            await codeMetrics.isSufficientlyTested(),
            testCoverageIndicator,
          );
        });
      },
    );
  }
});
