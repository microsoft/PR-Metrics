/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingBaseSizeResource,
  createInputsMocks,
  settingBaseSizeResource,
} from "./inputsTestSetup.js";
import { deepEqual, instance, verify, when } from "ts-mockito";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { decimalRadix } from "../../src/utilities/constants.js";

describe("inputs.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ logger, runnerInvoker } = createInputsMocks());
  });

  describe("initialize()", (): void => {
    describe("baseSize", (): void => {
      {
        const testCases: (string | null)[] = [
          null,
          "",
          " ",
          "abc",
          "===",
          "!2",
          "null",
          "undefined",
        ];

        testCases.forEach((baseSize: string | null): void => {
          it(`should set the default when the input '${String(baseSize)}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Base", "Size"])),
            ).thenReturn(baseSize);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.baseSize, InputsDefault.baseSize);
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
          });
        });
      }

      {
        const testCases: string[] = ["0", "-1", "-1000", "-5"];

        testCases.forEach((baseSize: string): void => {
          it(`should set the default when the input '${baseSize}' is less than or equal to 0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Base", "Size"])),
            ).thenReturn(baseSize);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.baseSize, InputsDefault.baseSize);
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
          });
        });
      }

      {
        const testCases: string[] = ["1", "5", "1000", "5.5"];

        testCases.forEach((baseSize: string): void => {
          it(`should set the converted value when the input '${baseSize}' is greater than 0`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Base", "Size"])),
            ).thenReturn(baseSize);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.baseSize, parseInt(baseSize, decimalRadix));
            verify(logger.logInfo(settingBaseSizeResource)).once();
          });
        });
      }
    });
  });
});
