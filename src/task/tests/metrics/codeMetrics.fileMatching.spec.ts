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
      gitResponse: string;
    }

    const testCases: TestCaseType[] = [
      {
        gitResponse:
          "2\t2\tfile.ts\n1\t1\tignored1.ts\n1\t1\tacceptance.ts\n1\t1\tignored2.ts",
      },
      {
        gitResponse:
          "1\t1\tfile1.ts\n1\t1\tignored1.ts\n1\t1\tignored2.ts\n1\t1\tacceptance.ts\n1\t1\tfile2.ts",
      },
      {
        gitResponse:
          "1\t1\tfile1.ts\n1\t1\tignored1.ts\n1\t1\tfile2.ts\n1\t1\tacceptance.ts\n1\t1\tignored2.ts",
      },
    ];

    testCases.forEach(({ gitResponse }: TestCaseType): void => {
      it(`with multiple ignore patterns and git diff '${gitResponse.replace(/\n/gu, "\\n").replace(/\r/gu, "\\r")}' ignores the appropriate files`, async (): Promise<void> => {
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
        const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

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
    const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

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
  });

  it("with only negative patterns, treats all files as non-matching", async (): Promise<void> => {
    // Arrange
    when(inputs.baseSize).thenReturn(100);
    when(inputs.growthRate).thenReturn(1.5);
    when(inputs.testFactor).thenReturn(2.0);
    when(inputs.fileMatchingPatterns).thenReturn(["!**/ignored.ts"]);
    when(inputs.codeFileExtensions).thenReturn(new Set<string>(["ts"]));
    when(gitInvoker.getDiffSummary()).thenResolve(
      "1\t1\tfile.ts\n1\t1\tignored.ts",
    );

    // Act
    const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

    // Assert
    assert.deepEqual(await codeMetrics.getFilesNotRequiringReview(), [
      "file.ts",
      "ignored.ts",
    ]);
    assert.deepEqual(await codeMetrics.getDeletedFilesNotRequiringReview(), []);
    assert.equal(await codeMetrics.getSize(), "XS");
    assert.equal(await codeMetrics.getSizeIndicator(), "XS✔");
    assert.deepEqual(
      await codeMetrics.getMetrics(),
      new CodeMetricsData(0, 0, 2),
    );
    assert.equal(await codeMetrics.isSmall(), true);
    assert.equal(await codeMetrics.isSufficientlyTested(), true);
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
    const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

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
  });

  it("with all files matching test files, returns the appropriate results", async (): Promise<void> => {
    // Arrange
    when(inputs.testMatchingPatterns).thenReturn(["**", "*/**"]);
    when(gitInvoker.getDiffSummary()).thenResolve(
      "1\t0\tfile.ts\n1\t0\ttest.ts\n1\t0\tfolder/file.ts",
    );

    // Act
    const codeMetrics: CodeMetrics = createSut(gitInvoker, inputs, logger, runnerInvoker);

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
  });
});
