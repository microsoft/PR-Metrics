/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import { instance, mock, verify, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import CodeMetricsData from "../../src/metrics/codeMetricsData.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

describe("codeMetrics.ts", (): void => {
  let gitInvoker: GitInvoker;
  let inputs: Inputs;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    gitInvoker = mock(GitInvoker);

    inputs = mock(Inputs);
    when(inputs.baseSize).thenReturn(InputsDefault.baseSize);
    when(inputs.growthRate).thenReturn(InputsDefault.growthRate);
    when(inputs.testFactor).thenReturn(InputsDefault.testFactor);
    when(inputs.fileMatchingPatterns).thenReturn(
      InputsDefault.fileMatchingPatterns,
    );
    when(inputs.testMatchingPatterns).thenReturn(
      InputsDefault.testMatchingPatterns,
    );
    when(inputs.codeFileExtensions).thenReturn(
      new Set<string>(InputsDefault.codeFileExtensions),
    );

    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeXS")).thenReturn("XS");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeS")).thenReturn("S");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeM")).thenReturn("M");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeL")).thenReturn("L");
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeXL", "")).thenReturn(
      "XL",
    );
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeXL", "2")).thenReturn(
      "2XL",
    );
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeXL", "3")).thenReturn(
      "3XL",
    );
    when(runnerInvoker.loc("metrics.codeMetrics.titleSizeXL", "10")).thenReturn(
      "10XL",
    );
    when(
      runnerInvoker.loc("metrics.codeMetrics.titleTestsSufficient"),
    ).thenReturn("✔");
    when(
      runnerInvoker.loc("metrics.codeMetrics.titleTestsInsufficient"),
    ).thenReturn("⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "XS",
        "✔",
      ),
    ).thenReturn("XS✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "XS",
        "⚠️",
      ),
    ).thenReturn("XS⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "S",
        "✔",
      ),
    ).thenReturn("S✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "S",
        "⚠️",
      ),
    ).thenReturn("S⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "M",
        "✔",
      ),
    ).thenReturn("M✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "M",
        "⚠️",
      ),
    ).thenReturn("M⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "L",
        "✔",
      ),
    ).thenReturn("L✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "L",
        "⚠️",
      ),
    ).thenReturn("L⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "XL",
        "✔",
      ),
    ).thenReturn("XL✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "XL",
        "⚠️",
      ),
    ).thenReturn("XL⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "2XL",
        "✔",
      ),
    ).thenReturn("2XL✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "2XL",
        "⚠️",
      ),
    ).thenReturn("2XL⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "3XL",
        "✔",
      ),
    ).thenReturn("3XL✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "3XL",
        "⚠️",
      ),
    ).thenReturn("3XL⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "10XL",
        "✔",
      ),
    ).thenReturn("10XL✔");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "10XL",
        "⚠️",
      ),
    ).thenReturn("10XL⚠️");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "XS",
        "",
      ),
    ).thenReturn("XS");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "S",
        "",
      ),
    ).thenReturn("S");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        "M",
        "",
      ),
    ).thenReturn("M");
  });

  {
    interface TestCaseType {
      gitResponse: string;
      globChecks: number;
      metrics: CodeMetricsData;
      sizeIndicator: string;
      testCoverageIndicator: boolean;
    }

    const testCases: TestCaseType[] = [
      {
        gitResponse: "0\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1\t0\tfile.ts\n1\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(1, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "199\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(199, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "199\t0\tfile.ts\n198\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(199, 198, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "199\t0\tfile.ts\n199\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(199, 199, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "200\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(200, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "200\t0\tfile.ts\n199\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(200, 199, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "200\t0\tfile.ts\n200\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(200, 200, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "399\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(399, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "399\t0\tfile.ts\n398\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(399, 398, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "399\t0\tfile.ts\n399\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(399, 399, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "400\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(400, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "400\t0\tfile.ts\n399\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(400, 399, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "400\t0\tfile.ts\n400\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(400, 400, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "799\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(799, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "799\t0\tfile.ts\n798\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(799, 798, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "799\t0\tfile.ts\n799\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(799, 799, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "800\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(800, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "800\t0\tfile.ts\n799\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(800, 799, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "800\t0\tfile.ts\n800\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(800, 800, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1599\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(1599, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1599\t0\tfile.ts\n1598\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(1599, 1598, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1599\t0\tfile.ts\n1599\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(1599, 1599, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1600\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(1600, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1600\t0\tfile.ts\n1599\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(1600, 1599, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1600\t0\tfile.ts\n1600\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(1600, 1600, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "3199\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(3199, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3199\t0\tfile.ts\n3198\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(3199, 3198, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3199\t0\tfile.ts\n3199\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(3199, 3199, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "3200\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(3200, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3200\t0\tfile.ts\n3199\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(3200, 3199, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "3200\t0\tfile.ts\n3200\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(3200, 3200, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "6399\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(6399, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6399\t0\tfile.ts\n6398\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(6399, 6398, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6399\t0\tfile.ts\n6399\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(6399, 6399, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "6400\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(6400, 0, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6400\t0\tfile.ts\n6399\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(6400, 6399, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "6400\t0\tfile.ts\n6400\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(6400, 6400, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "819200\t0\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(819200, 0, 0),
        sizeIndicator: "10XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "819200\t0\tfile.ts\n819199\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(819200, 819199, 0),
        sizeIndicator: "10XL",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "819200\t0\tfile.ts\n819200\t0\ttest.ts",
        globChecks: 9,
        metrics: new CodeMetricsData(819200, 819200, 0),
        sizeIndicator: "10XL",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.TS",
        globChecks: 6,
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "0\t1\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ignored",
        globChecks: 2,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile",
        globChecks: 2,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ts.ignored",
        globChecks: 2,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfile.ignored.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1\t0\ttest.ignored",
        globChecks: 2,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttasb.cc => test.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tt{a => e}s{b => t}.t{c => s}",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tt{a => est.ts}",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\t{a => test.ts}",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/test.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/Test.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/TEST.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/DuplicateStorage.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        gitResponse: "1\t0\tfolder/file.spec.ts",
        globChecks: 5,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/file.Spec.ts",
        globChecks: 5,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder.spec.ts/file.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttest/file.ts",
        globChecks: 4,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttests/file.ts",
        globChecks: 4,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttests/file.spec.ts",
        globChecks: 4,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\ttests/file.SPEC.ts",
        globChecks: 4,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t0\tfolder/tests/file.ts",
        globChecks: 4,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t1\tfa/b => folder/test.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "1\t1\tf{a => older}/{b => test.ts}",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "0\t0\tfile.ts\n",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "-\t-\tfile.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        gitResponse: "0\t0\tfile.ts\r\nrc:0\r\nsuccess:true",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
    ];

    testCases.forEach(
      ({
        gitResponse,
        globChecks,
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
          const derivedCount: number =
            (gitResponse.replace(/\r\n/gu, "").match(/\n/gu) ?? []).length +
            1 -
            (gitResponse.endsWith("\n") ? 1 : 0);
          verify(
            logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
          ).once();
          verify(
            logger.logDebug(
              "* CodeMetrics.getDeletedFilesNotRequiringReview()",
            ),
          ).once();
          verify(logger.logDebug("* CodeMetrics.getSize()")).once();
          verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
          verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
          verify(
            logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
          ).times(derivedCount);
          verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(
            globChecks,
          );
          verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(
            derivedCount,
          );
          verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
          verify(
            logger.logDebug("* CodeMetrics.createFileMetricsMap()"),
          ).once();
          verify(
            logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
          ).once();
          verify(
            logger.logDebug("* CodeMetrics.initializeSizeIndicator()"),
          ).once();
          verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
        });
      },
    );
  }

  {
    interface TestCaseType {
      deletedFilesNotRequiringReview: string[];
      filesNotRequiringReview: string[];
      gitResponse: string;
      globChecks: number;
      metrics: CodeMetricsData;
      sizeIndicator: string;
      testCoverageIndicator: boolean;
    }

    const testCases: TestCaseType[] = [
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "0\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(1, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.ts\n1\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(1, 1, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.ts\n2\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(1, 2, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "99\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(99, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "99\t0\tfile.ts\n197\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(99, 197, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "99\t0\tfile.ts\n198\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(99, 198, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "100\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(100, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "100\t0\tfile.ts\n199\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(100, 199, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "100\t0\tfile.ts\n200\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(100, 200, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "149\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(149, 0, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "149\t0\tfile.ts\n297\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(149, 297, 0),
        sizeIndicator: "S",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "149\t0\tfile.ts\n298\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(149, 298, 0),
        sizeIndicator: "S",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "150\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(150, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "150\t0\tfile.ts\n299\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(150, 299, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "150\t0\tfile.ts\n300\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(150, 300, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "224\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(224, 0, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "224\t0\tfile.ts\n447\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(224, 447, 0),
        sizeIndicator: "M",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "224\t0\tfile.ts\n448\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(224, 448, 0),
        sizeIndicator: "M",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "225\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(225, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "225\t0\tfile.ts\n449\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(225, 449, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "225\t0\tfile.ts\n450\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(225, 450, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "337\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(337, 0, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "337\t0\tfile.ts\n673\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(337, 673, 0),
        sizeIndicator: "L",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "337\t0\tfile.ts\n674\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(337, 674, 0),
        sizeIndicator: "L",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "338\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(338, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "338\t0\tfile.ts\n675\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(338, 675, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "338\t0\tfile.ts\n676\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(338, 676, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "506\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(506, 0, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "506\t0\tfile.ts\n1011\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(506, 1011, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "506\t0\tfile.ts\n1012\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(506, 1012, 0),
        sizeIndicator: "XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "507\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(507, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "507\t0\tfile.ts\n1013\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(507, 1013, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "507\t0\tfile.ts\n1014\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(507, 1014, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "759\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(759, 0, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "759\t0\tfile.ts\n1517\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(759, 1517, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "759\t0\tfile.ts\n1518\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(759, 1518, 0),
        sizeIndicator: "2XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "760\t0\tfile.ts",
        globChecks: 7,
        metrics: new CodeMetricsData(760, 0, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "760\t0\tfile.ts\n1519\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(760, 1519, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: false,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "760\t0\tfile.ts\n1520\t0\ttest.ts",
        globChecks: 11,
        metrics: new CodeMetricsData(760, 1520, 0),
        sizeIndicator: "3XL",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\ttest.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.tst",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfile.tts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: [],
        gitResponse: "1\t0\tfilets",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.ts"],
        gitResponse: "1\t0\tignored.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.cs"],
        gitResponse: "1\t0\tignored.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.ts"],
        gitResponse: "1\t0\tfolder/ignored.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.cs"],
        gitResponse: "1\t0\tfolder/ignored.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.ts"],
        gitResponse: "0\t0\tignored.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.cs"],
        gitResponse: "0\t0\tignored.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.ts"],
        gitResponse: "0\t0\tfolder/ignored.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["folder/ignored.cs"],
        gitResponse: "0\t0\tfolder/ignored.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: [],
        filesNotRequiringReview: ["ignored.ts", "folder/ignored.ts"],
        gitResponse: "1\t0\tignored.ts\n0\t0\tfolder/ignored.ts",
        globChecks: 6,
        metrics: new CodeMetricsData(0, 0, 1),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["ignored.ts"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tignored.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["ignored.cs"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tignored.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["folder/ignored.ts"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tfolder/ignored.ts",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["folder/ignored.cs"],
        filesNotRequiringReview: [],
        gitResponse: "0\t1\tfolder/ignored.cs",
        globChecks: 3,
        metrics: new CodeMetricsData(0, 0, 0),
        sizeIndicator: "XS",
        testCoverageIndicator: true,
      },
      {
        deletedFilesNotRequiringReview: ["folder/ignored.ts"],
        filesNotRequiringReview: ["ignored.ts"],
        gitResponse: "1\t0\tignored.ts\n0\t1\tfolder/ignored.ts",
        globChecks: 6,
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
        globChecks,
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
          const codeMetrics: CodeMetrics = new CodeMetrics(
            instance(gitInvoker),
            instance(inputs),
            instance(logger),
            instance(runnerInvoker),
          );

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
          const derivedCount: number =
            (gitResponse.match(/\n/gu) ?? []).length + 1;
          verify(
            logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
          ).once();
          verify(
            logger.logDebug(
              "* CodeMetrics.getDeletedFilesNotRequiringReview()",
            ),
          ).once();
          verify(logger.logDebug("* CodeMetrics.getSize()")).once();
          verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
          verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
          verify(
            logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
          ).times(derivedCount);
          verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(
            globChecks,
          );
          verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(
            derivedCount,
          );
          verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(
            (gitResponse.match(/\n/gu) ?? []).length + 1,
          );
          verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
          verify(
            logger.logDebug("* CodeMetrics.createFileMetricsMap()"),
          ).once();
          verify(
            logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
          ).once();
          verify(
            logger.logDebug("* CodeMetrics.initializeSizeIndicator()"),
          ).once();
          verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
        });
      },
    );
  }

  {
    interface TestCaseType {
      gitResponse: string;
      globChecks: number;
    }

    const testCases: TestCaseType[] = [
      {
        gitResponse:
          "2\t2\tfile.ts\n1\t1\tignored1.ts\n1\t1\tacceptance.ts\n1\t1\tignored2.ts",
        globChecks: 14,
      },
      {
        gitResponse:
          "1\t1\tfile1.ts\n1\t1\tignored1.ts\n1\t1\tignored2.ts\n1\t1\tacceptance.ts\n1\t1\tfile2.ts",
        globChecks: 18,
      },
      {
        gitResponse:
          "1\t1\tfile1.ts\n1\t1\tignored1.ts\n1\t1\tfile2.ts\n1\t1\tacceptance.ts\n1\t1\tignored2.ts",
        globChecks: 18,
      },
    ];

    testCases.forEach(({ gitResponse, globChecks }: TestCaseType): void => {
      it(`with multiple ignore patterns and git diff '${gitResponse}' ignores the appropriate files`, async (): Promise<void> => {
        // Arrange
        when(inputs.baseSize).thenReturn(100);
        when(inputs.growthRate).thenReturn(1.5);
        when(inputs.testFactor).thenReturn(2.0);
        when(inputs.fileMatchingPatterns).thenReturn([
          "**/*",
          "!**/ignored1.ts",
          "!**/ignored2.ts",
        ]);
        when(inputs.testMatchingPatterns).thenReturn(["**/acceptance.ts"]);
        when(inputs.codeFileExtensions).thenReturn(new Set<string>(["ts"]));
        when(gitInvoker.getDiffSummary()).thenResolve(gitResponse);

        // Act
        const codeMetrics: CodeMetrics = new CodeMetrics(
          instance(gitInvoker),
          instance(inputs),
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), [
          "ignored1.ts",
          "ignored2.ts",
        ]);
        assert.deepEqual(
          await codeMetrics.getDeletedFilesNotRequiringReview(),
          [],
        );
        assert.equal(await codeMetrics.getSize(), "XS");
        assert.equal(await codeMetrics.getSizeIndicator(), "XS⚠️");
        assert.deepEqual(
          await codeMetrics.getMetrics(),
          new CodeMetricsData(2, 1, 2),
        );
        assert.equal(await codeMetrics.isSmall(), true);
        assert.equal(await codeMetrics.isSufficientlyTested(), false);
        const derivedCount: number =
          (gitResponse.match(/\n/gu) ?? []).length + 1;
        verify(
          logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
        ).once();
        verify(
          logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
        ).once();
        verify(logger.logDebug("* CodeMetrics.getSize()")).once();
        verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
        verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
        verify(
          logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
        ).times(derivedCount);
        verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(
          globChecks,
        );
        verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(
          derivedCount,
        );
        verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
        verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
        verify(
          logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
        ).once();
        verify(
          logger.logDebug("* CodeMetrics.initializeSizeIndicator()"),
        ).once();
        verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
      });
    });
  }

  it("with custom include pattern, includes the relevant files", async (): Promise<void> => {
    // Arrange
    when(inputs.baseSize).thenReturn(100);
    when(inputs.growthRate).thenReturn(1.5);
    when(inputs.testFactor).thenReturn(2.0);
    when(inputs.fileMatchingPatterns).thenReturn(["src/*.ts", "__test__/*.ts"]);
    when(inputs.codeFileExtensions).thenReturn(new Set<string>(["ts"]));
    when(gitInvoker.getDiffSummary()).thenResolve(
      "1\t1\tfile.ts\n1\t1\tsrc/file.ts\n1\t1\t__test__/file.test.ts",
    );

    // Act
    const codeMetrics: CodeMetrics = new CodeMetrics(
      instance(gitInvoker),
      instance(inputs),
      instance(logger),
      instance(runnerInvoker),
    );

    // Assert
    assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), [
      "file.ts",
    ]);
    assert.deepEqual(await codeMetrics.getDeletedFilesNotRequiringReview(), []);
    assert.equal(await codeMetrics.getSize(), "XS");
    assert.equal(await codeMetrics.getSizeIndicator(), "XS⚠️");
    assert.deepEqual(
      await codeMetrics.getMetrics(),
      new CodeMetricsData(1, 1, 1),
    );
    assert.equal(await codeMetrics.isSmall(), true);
    assert.equal(await codeMetrics.isSufficientlyTested(), false);
    verify(
      logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
    ).once();
    verify(
      logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.getSize()")).once();
    verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
    verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
    verify(
      logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
    ).times(3);
    verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(11);
    verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(3);
    verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
    verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    verify(
      logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.initializeSizeIndicator()")).once();
    verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
  });

  it("with double exclusion ignore patterns ignores the appropriate files", async (): Promise<void> => {
    // Arrange
    when(inputs.baseSize).thenReturn(100);
    when(inputs.growthRate).thenReturn(1.5);
    when(inputs.testFactor).thenReturn(2.0);
    when(inputs.fileMatchingPatterns).thenReturn([
      "**/*",
      "!**/ignored*.ts",
      "!!**/ignored2.ts",
    ]);
    when(inputs.codeFileExtensions).thenReturn(new Set<string>(["ts"]));
    when(gitInvoker.getDiffSummary()).thenResolve(
      "1\t1\tfile.ts\n1\t1\tignored1.ts\n1\t1\tignored2.ts\n1\t1\tignored3.ts",
    );

    // Act
    const codeMetrics: CodeMetrics = new CodeMetrics(
      instance(gitInvoker),
      instance(inputs),
      instance(logger),
      instance(runnerInvoker),
    );

    // Assert
    assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), [
      "ignored1.ts",
      "ignored3.ts",
    ]);
    assert.deepEqual(await codeMetrics.getDeletedFilesNotRequiringReview(), []);
    assert.equal(await codeMetrics.getSize(), "XS");
    assert.equal(await codeMetrics.getSizeIndicator(), "XS⚠️");
    assert.deepEqual(
      await codeMetrics.getMetrics(),
      new CodeMetricsData(2, 0, 2),
    );
    assert.equal(await codeMetrics.isSmall(), true);
    assert.equal(await codeMetrics.isSufficientlyTested(), false);
    verify(
      logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
    ).once();
    verify(
      logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.getSize()")).once();
    verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
    verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
    verify(
      logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
    ).times(4);
    verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(19);
    verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(4);
    verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
    verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    verify(
      logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.initializeSizeIndicator()")).once();
    verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
  });

  it("with all files matching test files, returns the appropriate results", async (): Promise<void> => {
    // Arrange
    when(inputs.testMatchingPatterns).thenReturn(["**", "*/**"]);
    when(gitInvoker.getDiffSummary()).thenResolve(
      "1\t0\tfile.ts\n1\t0\ttest.ts\n1\t0\tfolder/file.ts",
    );

    // Act
    const codeMetrics: CodeMetrics = new CodeMetrics(
      instance(gitInvoker),
      instance(inputs),
      instance(logger),
      instance(runnerInvoker),
    );

    // Assert
    assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), []);
    assert.deepEqual(await codeMetrics.getDeletedFilesNotRequiringReview(), []);
    assert.equal(await codeMetrics.getSize(), "XS");
    assert.equal(await codeMetrics.getSizeIndicator(), "XS✔");
    assert.deepEqual(
      await codeMetrics.getMetrics(),
      new CodeMetricsData(0, 3, 0),
    );
    assert.equal(await codeMetrics.isSmall(), true);
    assert.equal(await codeMetrics.isSufficientlyTested(), true);
    verify(
      logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
    ).once();
    verify(
      logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.getSize()")).once();
    verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
    verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
    verify(
      logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
    ).times(3);
    verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(9);
    verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).times(3);
    verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
    verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    verify(
      logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.initializeSizeIndicator()")).once();
    verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
  });

  it("should return the expected result with test coverage disabled", async (): Promise<void> => {
    // Arrange
    when(inputs.testFactor).thenReturn(null);
    when(gitInvoker.getDiffSummary()).thenResolve("1\t0\tfile.ts");

    // Act
    const codeMetrics: CodeMetrics = new CodeMetrics(
      instance(gitInvoker),
      instance(inputs),
      instance(logger),
      instance(runnerInvoker),
    );

    // Assert
    assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), []);
    assert.deepEqual(await codeMetrics.getDeletedFilesNotRequiringReview(), []);
    assert.equal(await codeMetrics.getSize(), "XS");
    assert.equal(await codeMetrics.getSizeIndicator(), "XS");
    assert.deepEqual(
      await codeMetrics.getMetrics(),
      new CodeMetricsData(1, 0, 0),
    );
    assert.equal(await codeMetrics.isSmall(), true);
    assert.equal(await codeMetrics.isSufficientlyTested(), null);
    verify(
      logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
    ).once();
    verify(
      logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.getSize()")).once();
    verify(logger.logDebug("* CodeMetrics.initialize()")).times(7);
    verify(logger.logDebug("* CodeMetrics.initializeMetrics()")).once();
    verify(
      logger.logDebug("* CodeMetrics.determineIfValidFilePattern()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.performGlobCheck()")).times(6);
    verify(logger.logDebug("* CodeMetrics.matchFileExtension()")).once();
    verify(logger.logDebug("* CodeMetrics.constructMetrics()")).once();
    verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    verify(
      logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()"),
    ).once();
    verify(logger.logDebug("* CodeMetrics.initializeSizeIndicator()")).once();
    verify(logger.logDebug("* CodeMetrics.calculateSize()")).once();
  });

  describe("getFilesNotRequiringReview()", (): void => {
    {
      const testCases: string[] = ["", "   ", "\t", "\n", "\t\n"];

      testCases.forEach((gitDiffSummary: string): void => {
        it(`should throw when the Git diff summary '${gitDiffSummary}' is empty`, async (): Promise<void> => {
          // Arrange
          when(gitInvoker.getDiffSummary()).thenResolve(gitDiffSummary);
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
            "The Git diff summary is empty.",
          );
          verify(
            logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
          ).once();
          verify(logger.logDebug("* CodeMetrics.initialize()")).once();
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
          verify(
            logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
          ).once();
          verify(logger.logDebug("* CodeMetrics.initialize()")).once();
          verify(
            logger.logDebug("* CodeMetrics.createFileMetricsMap()"),
          ).once();
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
      verify(
        logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
      ).once();
      verify(logger.logDebug("* CodeMetrics.initialize()")).once();
      verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
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
      verify(
        logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()"),
      ).once();
      verify(logger.logDebug("* CodeMetrics.initialize()")).once();
      verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    });
  });

  describe("getDeletedFilesNotRequiringReview()", (): void => {
    it("should throw when the Git diff summary '' is empty", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("");
      const codeMetrics: CodeMetrics = new CodeMetrics(
        instance(gitInvoker),
        instance(inputs),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "The Git diff summary is empty.",
      );
      verify(
        logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
      ).once();
      verify(logger.logDebug("* CodeMetrics.initialize()")).once();
    });

    it("should throw when the file name in the Git diff summary '0' cannot be parsed", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.getDiffSummary()).thenResolve("0");
      const codeMetrics: CodeMetrics = new CodeMetrics(
        instance(gitInvoker),
        instance(inputs),
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<string[]> = async () =>
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "The number of elements '1' in '0' in input '0' did not match the expected 3.",
      );
      verify(
        logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
      ).once();
      verify(logger.logDebug("* CodeMetrics.initialize()")).once();
      verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    });

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
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Could not parse added lines 'A' from line 'A\t0\tfile.ts'.",
      );
      verify(
        logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
      ).once();
      verify(logger.logDebug("* CodeMetrics.initialize()")).once();
      verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
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
        codeMetrics.getDeletedFilesNotRequiringReview();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Could not parse deleted lines 'A' from line '0\tA\tfile.ts'.",
      );
      verify(
        logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()"),
      ).once();
      verify(logger.logDebug("* CodeMetrics.initialize()")).once();
      verify(logger.logDebug("* CodeMetrics.createFileMetricsMap()")).once();
    });
  });
});
