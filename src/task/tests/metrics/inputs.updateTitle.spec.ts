/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingUpdateTitle,
  createInputsMocks,
  createSut,
  disablingUpdateTitle,
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
    describe("updateTitle", (): void => {
      {
        const testCases: (string | null)[] = [
          null,
          "",
          " ",
          "abc",
          "true",
          "True",
          "TRUE",
          "tRUE",
          "null",
          "undefined",
        ];

        testCases.forEach((updateTitle: string | null): void => {
          it(`should set the default when the input is '${String(updateTitle)}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Update", "Title"])),
            ).thenReturn(updateTitle);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.updateTitle, InputsDefault.updateTitle);
            verify(logger.logInfo(adjustingUpdateTitle)).once();
          });
        });
      }

      {
        const testCases: string[] = ["false", "False", "FALSE", "fALSE"];

        testCases.forEach((updateTitle: string): void => {
          it(`should set to false when the input is '${updateTitle}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Update", "Title"])),
            ).thenReturn(updateTitle);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.updateTitle, false);
            verify(logger.logInfo(disablingUpdateTitle)).once();
          });
        });
      }
    });
  });
});
