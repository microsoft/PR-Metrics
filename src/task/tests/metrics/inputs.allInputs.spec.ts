/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingAlwaysCloseComment,
  adjustingBaseSizeResource,
  adjustingCodeFileExtensionsResource,
  adjustingFileMatchingPatternsResource,
  adjustingGrowthRateResource,
  adjustingTestFactorResource,
  adjustingTestMatchingPatternsResource,
  createInputsMocks,
  createSut,
  settingAlwaysCloseComment,
  settingBaseSizeResource,
  settingCodeFileExtensionsResource,
  settingFileMatchingPatternsResource,
  settingGrowthRateResource,
  settingTestFactorResource,
  settingTestMatchingPatternsResource,
} from "./inputsTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type Inputs from "../../src/metrics/inputs.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

describe("inputs.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ logger, runnerInvoker } = createInputsMocks());
  });

  describe("initialize()", (): void => {
    describe("all inputs", (): void => {
      it("should set all default values when nothing is specified", (): void => {
        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.equal(inputs.baseSize, InputsDefault.baseSize);
        assert.equal(inputs.growthRate, InputsDefault.growthRate);
        assert.equal(inputs.testFactor, InputsDefault.testFactor);
        assert.equal(
          inputs.alwaysCloseComment,
          InputsDefault.alwaysCloseComment,
        );
        assert.deepEqual(
          inputs.fileMatchingPatterns,
          InputsDefault.fileMatchingPatterns,
        );
        assert.deepEqual(
          inputs.testMatchingPatterns,
          InputsDefault.testMatchingPatterns,
        );
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(InputsDefault.codeFileExtensions),
        );
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingTestMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
      });

      it("should set all input values when all are specified", (): void => {
        // Arrange
        when(runnerInvoker.getInput(deepEqual(["Base", "Size"]))).thenReturn(
          "5.0",
        );
        when(runnerInvoker.getInput(deepEqual(["Growth", "Rate"]))).thenReturn(
          "4.4",
        );
        when(runnerInvoker.getInput(deepEqual(["Test", "Factor"]))).thenReturn(
          "2.7",
        );
        when(
          runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
        ).thenReturn("true");
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn("aa\nbb");
        when(
          runnerInvoker.getInput(deepEqual(["Test", "Matching", "Patterns"])),
        ).thenReturn("cc\ndd");
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("js\nts");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.equal(inputs.baseSize, 5.0);
        assert.equal(inputs.growthRate, 4.4);
        assert.equal(inputs.testFactor, 2.7);
        assert.deepEqual(inputs.alwaysCloseComment, true);
        assert.deepEqual(inputs.fileMatchingPatterns, ["aa", "bb"]);
        assert.deepEqual(inputs.testMatchingPatterns, ["cc", "dd"]);
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["js", "ts"]),
        );
        verify(logger.logInfo(settingAlwaysCloseComment)).once();
        verify(logger.logInfo(settingBaseSizeResource)).once();
        verify(logger.logInfo(settingGrowthRateResource)).once();
        verify(logger.logInfo(settingTestFactorResource)).once();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(settingTestMatchingPatternsResource)).once();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });
    });
  });
});
