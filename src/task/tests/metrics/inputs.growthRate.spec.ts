/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingGrowthRateResource,
  createInputsMocks,
  createSut,
  settingGrowthRateResource,
} from "./inputsTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type Inputs from "../../src/metrics/inputs.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { invalidNumericStrings } from "../testUtilities/fixtures/invalidInputs.js";

describe("inputs.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ logger, runnerInvoker } = createInputsMocks());
  });

  describe("initialize()", (): void => {
    describe("growthRate", (): void => {
      {
        const testCases: (string | null)[] = [
          ...invalidNumericStrings,
          "Infinity",
        ];

        testCases.forEach((growthRate: string | null): void => {
          it(`should set the default when the input '${String(growthRate)}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Growth", "Rate"])),
            ).thenReturn(growthRate);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.growthRate, InputsDefault.growthRate);
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
          });
        });
      }

      {
        const testCases: string[] = [
          "0",
          "0.5",
          "1",
          "-2",
          "-1.2",
          "-5",
          "0.9999999999",
        ];

        testCases.forEach((growthRate: string): void => {
          it(`should set the default when the input '${growthRate}' is less than or equal to 1.0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Growth", "Rate"])),
            ).thenReturn(growthRate);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.growthRate, InputsDefault.growthRate);
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
          });
        });
      }

      {
        const testCases: string[] = [
          "5",
          "2.0",
          "1000",
          "1.001",
          "1.2",
          "1.0000000001",
          "1.09",
          "7",
        ];

        testCases.forEach((growthRate: string): void => {
          it(`should set the converted value when the input '${growthRate}' is greater than 1.0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Growth", "Rate"])),
            ).thenReturn(growthRate);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.growthRate, parseFloat(growthRate));
            verify(logger.logInfo(settingGrowthRateResource)).once();
          });
        });
      }
    });
  });
});
