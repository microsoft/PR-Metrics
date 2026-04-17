/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */


import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingAlwaysCloseComment,
  createInputsMocks,
  createSut,
  settingAlwaysCloseComment,
} from "./inputsTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";


describe("inputs.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ logger, runnerInvoker } = createInputsMocks());
  });

  describe("initialize()", (): void => {
    describe("alwaysCloseComment", (): void => {
      {
        const testCases: (string | null)[] = [
          null,
          "",
          " ",
          "abc",
          "false",
          "False",
          "FALSE",
          "fALSE",
          "null",
          "undefined",
        ];

        testCases.forEach((alwaysCloseComment: string | null): void => {
          it(`should set the default when the input is '${String(alwaysCloseComment)}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
            ).thenReturn(alwaysCloseComment);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(
              inputs.alwaysCloseComment,
              InputsDefault.alwaysCloseComment,
            );
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
          });
        });
      }

      {
        const testCases: string[] = ["true", "True", "TRUE", "tRUE"];

        testCases.forEach((alwaysCloseComment: string): void => {
          it(`should set to true when the input is '${alwaysCloseComment}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
            ).thenReturn(alwaysCloseComment);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.equal(inputs.alwaysCloseComment, true);
            verify(logger.logInfo(settingAlwaysCloseComment)).once();
          });
        });
      }
    });
  });
});
