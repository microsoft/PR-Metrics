/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */


import { createCodeMetricsMocks, createSut } from "./codeMetricsTestSetup.js";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import CodeMetricsData from "../../src/metrics/codeMetricsData.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
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

  {
    interface TestCaseType {
      deletedFilesNotRequiringReview: string[];
      filesNotRequiringReview: string[];
      gitResponse: string;
      metrics: CodeMetricsData;
      sizeIndicator: string;
      testCoverageIndicator: boolean;
    }

    const testCases: TestCaseType[] = [
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "0\t0\tfile.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.ts",
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.ts\n1\t0\ttest.ts",
        metrics: new CodeMetricsData(1, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.ts\n2\t0\ttest.ts",
        metrics: new CodeMetricsData(1, 2, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "99\t0\tfile.ts",
        metrics: new CodeMetricsData(99, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "99\t0\tfile.ts\n197\t0\ttest.ts",
        metrics: new CodeMetricsData(99, 197, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "99\t0\tfile.ts\n198\t0\ttest.ts",
        metrics: new CodeMetricsData(99, 198, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "100\t0\tfile.ts",
        metrics: new CodeMetricsData(100, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "100\t0\tfile.ts\n199\t0\ttest.ts",
        metrics: new CodeMetricsData(100, 199, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "100\t0\tfile.ts\n200\t0\ttest.ts",
        metrics: new CodeMetricsData(100, 200, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "149\t0\tfile.ts",
        metrics: new CodeMetricsData(149, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "149\t0\tfile.ts\n297\t0\ttest.ts",
        metrics: new CodeMetricsData(149, 297, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "149\t0\tfile.ts\n298\t0\ttest.ts",
        metrics: new CodeMetricsData(149, 298, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "150\t0\tfile.ts",
        metrics: new CodeMetricsData(150, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "150\t0\tfile.ts\n299\t0\ttest.ts",
        metrics: new CodeMetricsData(150, 299, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "150\t0\tfile.ts\n300\t0\ttest.ts",
        metrics: new CodeMetricsData(150, 300, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "224\t0\tfile.ts",
        metrics: new CodeMetricsData(224, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "224\t0\tfile.ts\n447\t0\ttest.ts",
        metrics: new CodeMetricsData(224, 447, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "224\t0\tfile.ts\n448\t0\ttest.ts",
        metrics: new CodeMetricsData(224, 448, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "225\t0\tfile.ts",
        metrics: new CodeMetricsData(225, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "225\t0\tfile.ts\n449\t0\ttest.ts",
        metrics: new CodeMetricsData(225, 449, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "225\t0\tfile.ts\n450\t0\ttest.ts",
        metrics: new CodeMetricsData(225, 450, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "337\t0\tfile.ts",
        metrics: new CodeMetricsData(337, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "337\t0\tfile.ts\n673\t0\ttest.ts",
        metrics: new CodeMetricsData(337, 673, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "337\t0\tfile.ts\n674\t0\ttest.ts",
        metrics: new CodeMetricsData(337, 674, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "338\t0\tfile.ts",
        metrics: new CodeMetricsData(338, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "338\t0\tfile.ts\n675\t0\ttest.ts",
        metrics: new CodeMetricsData(338, 675, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "338\t0\tfile.ts\n676\t0\ttest.ts",
        metrics: new CodeMetricsData(338, 676, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "506\t0\tfile.ts",
        metrics: new CodeMetricsData(506, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "506\t0\tfile.ts\n1011\t0\ttest.ts",
        metrics: new CodeMetricsData(506, 1011, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "506\t0\tfile.ts\n1012\t0\ttest.ts",
        metrics: new CodeMetricsData(506, 1012, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "507\t0\tfile.ts",
        metrics: new CodeMetricsData(507, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "507\t0\tfile.ts\n1013\t0\ttest.ts",
        metrics: new CodeMetricsData(507, 1013, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "507\t0\tfile.ts\n1014\t0\ttest.ts",
        metrics: new CodeMetricsData(507, 1014, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "759\t0\tfile.ts",
        metrics: new CodeMetricsData(759, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "759\t0\tfile.ts\n1517\t0\ttest.ts",
        metrics: new CodeMetricsData(759, 1517, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "759\t0\tfile.ts\n1518\t0\ttest.ts",
        metrics: new CodeMetricsData(759, 1518, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "760\t0\tfile.ts",
        metrics: new CodeMetricsData(760, 0, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "760\t0\tfile.ts\n1519\t0\ttest.ts",
        metrics: new CodeMetricsData(760, 1519, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "760\t0\tfile.ts\n1520\t0\ttest.ts",
        metrics: new CodeMetricsData(760, 1520, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.cs",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\ttest.cs",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.tst",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.tts",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfilets",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.ts"],
        gitResponse: "1\t0\tignored.ts",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.cs"],
        gitResponse: "1\t0\tignored.cs",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.ts"],
        gitResponse: "1\t0\tfolder/ignored.ts",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.cs"],
        gitResponse: "1\t0\tfolder/ignored.cs",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.ts"],
        gitResponse: "0\t0\tignored.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.cs"],
        gitResponse: "0\t0\tignored.cs",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.ts"],
        gitResponse: "0\t0\tfolder/ignored.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.cs"],
        gitResponse: "0\t0\tfolder/ignored.cs",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.ts", "folder/ignored.ts"],
        gitResponse: "1\t0\tignored.ts\n0\t0\tfolder/ignored.ts",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["ignored.ts"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tignored.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["ignored.cs"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tignored.cs",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["folder/ignored.ts"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tfolder/ignored.ts",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["folder/ignored.cs"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tfolder/ignored.cs",
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["folder/ignored.ts"],
        filesNotRequiringReview: ["ignored.ts"],
        gitResponse: "1\t0\tignored.ts\n0\t1\tfolder/ignored.ts",
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
    ];

    testCases.forEach(
      ({
        deletedFilesNotRequiringReview,
        filesNotRequiringReview,
        gitResponse,
        metrics,
        sizeIndicator,
        testCoverageIndicator,
      }: TestCaseType): void => {
        it(`with non-default inputs and git diff '${gitResponse.replace(/\n/gu, "\\n")}', returns '${sizeIndicator}' size and '${String(testCoverageIndicator)}' test coverage`, async (): Promise<void> => {
          // Arrange
          when(inputs.baseSize).thenReturn(100);
          when(inputs.growthRate).thenReturn(1.5);
          when(inputs.testFactor).thenReturn(2.0);
          when(inputs.fileMatchingPatterns).thenReturn([
            "**/*",
            "other.ts",
            "!**/ignored.*",
          ]);
          when(inputs.codeFileExtensions).thenReturn(new Set<string>(["ts"]));
          when(gitInvoker.getDiffSummary()).thenResolve(gitResponse);

          // Act
          const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

          // Assert
          assert.deepEqual(
            await codeMetrics.getFilesNotRequiringReview(),
            filesNotRequiringReview,
          );
          assert.deepEqual(
            await codeMetrics.getDeletedFilesNotRequiringReview(),
            deletedFilesNotRequiringReview,
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
