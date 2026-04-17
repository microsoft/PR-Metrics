/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { anyString, instance, when } from "ts-mockito";
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
  });

  it("with a size multiplier exceeding 1000, returns a size without thousands separators", async (): Promise<void> => {
    // ARRANGE
    when(inputs.baseSize).thenReturn(1);
    when(inputs.growthRate).thenReturn(1.001);
    when(inputs.testFactor).thenReturn(1.0);
    when(inputs.fileMatchingPatterns).thenReturn(["**/*"]);
    when(inputs.codeFileExtensions).thenReturn(new Set<string>(["ts"]));
    when(gitInvoker.getDiffSummary()).thenResolve("3\t0\tfile.ts");
    when(
      runnerInvoker.loc(
        "metrics.codeMetrics.titleSizeIndicatorFormat",
        anyString() as string,
        anyString() as string,
      ),
    ).thenReturn("");
    const codeMetrics: CodeMetrics = new CodeMetrics(
      instance(gitInvoker),
      instance(inputs),
      instance(logger),
      instance(runnerInvoker),
    );

    // ACT
    const size: string = await codeMetrics.getSize();

    // ASSERT
    assert.match(size, /^\d+XL$/u);
    const multiplier: number = Number.parseInt(size.replace("XL", ""), 10);
    assert.ok(multiplier >= 1000);
  });
});
