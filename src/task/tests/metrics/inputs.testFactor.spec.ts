/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingTestFactorResource,
  createInputsMocks,
  createSut,
  disablingTestFactorResource,
  settingTestFactorResource,
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
    describe("testFactor", (): void => {
      {
        const testCases: (string | null)[] = [
          ...invalidNumericStrings,
          "Infinity",
        ];

        testCases.forEach((testFactor: string | null): void => {
          it(`should set the default when the input '${String(testFactor)}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Test", "Factor"])),
            ).thenReturn(testFactor);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.testFactor, InputsDefault.testFactor);
            verify(logger.logInfo(adjustingTestFactorResource)).once();
          });
        });
      }

      {
        const testCases: string[] = [
          "-0.0000009",
          "-2",
          "-1.2",
          "-5",
          "-0.9999999999",
        ];

        testCases.forEach((testFactor: string): void => {
          it(`should set the default when the input '${testFactor}' is less than 0.0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Test", "Factor"])),
            ).thenReturn(testFactor);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.testFactor, InputsDefault.testFactor);
            verify(logger.logInfo(adjustingTestFactorResource)).once();
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
          "0.000000000000009",
          "0.09",
          "7",
        ];

        testCases.forEach((testFactor: string): void => {
          it(`should set the converted value when the input '${testFactor}' is greater than 0.0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Test", "Factor"])),
            ).thenReturn(testFactor);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.testFactor, parseFloat(testFactor));
            verify(
              logger.logInfo(
                settingTestFactorResource(
                  parseFloat(testFactor).toLocaleString(),
                ),
              ),
            ).once();
          });
        });
      }

      {
        const testCases: string[] = ["0", "0.0"];

        testCases.forEach((testFactor: string): void => {
          it(`should set null when the input '${testFactor}' is equal to 0.0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Test", "Factor"])),
            ).thenReturn(testFactor);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.testFactor, null);
            verify(logger.logInfo(disablingTestFactorResource)).once();
          });
        });
      }
    });
  });
});
