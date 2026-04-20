/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingTestMatchingPatternsResource,
  createInputsMocks,
  createSut,
  settingTestMatchingPatternsResource,
} from "./inputsTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type Inputs from "../../src/metrics/inputs.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { invalidPatternStrings } from "../testUtilities/fixtures/invalidInputs.js";

describe("inputs.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ logger, runnerInvoker } = createInputsMocks());
  });

  describe("initialize()", (): void => {
    describe("testMatchingPatterns", (): void => {
      invalidPatternStrings.forEach(
        (testMatchingPatterns: string | null): void => {
          it(`should set the default when the input '${String(testMatchingPatterns?.replace(/\n/gu, "\\n"))}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(
                deepEqual(["Test", "Matching", "Patterns"]),
              ),
            ).thenReturn(testMatchingPatterns);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(
              inputs.testMatchingPatterns,
              InputsDefault.testMatchingPatterns,
            );
            verify(
              logger.logInfo(adjustingTestMatchingPatternsResource),
            ).once();
          });
        },
      );

      {
        const testCases: string[] = [
          "abc",
          "abc def hik",
          "*.ada *.js *ts *.bb *txt",
        ];

        testCases.forEach((testMatchingPatterns: string): void => {
          it(`should not split '${testMatchingPatterns}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(
                deepEqual(["Test", "Matching", "Patterns"]),
              ),
            ).thenReturn(testMatchingPatterns);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(inputs.testMatchingPatterns, [
              testMatchingPatterns,
            ]);
            verify(
              logger.logInfo(adjustingTestMatchingPatternsResource),
            ).never();
            verify(logger.logInfo(settingTestMatchingPatternsResource)).once();
          });
        });
      }

      {
        const testCases: string[] = [
          "*.ada\n*.js\n*.ts\n*.bb\n*.txt",
          "abc\ndef\nhij",
        ];

        testCases.forEach((testMatchingPatterns: string): void => {
          it(`should split '${testMatchingPatterns.replace(/\n/gu, "\\n")}' at the newline character`, (): void => {
            // Arrange
            const expectedOutput: string[] = testMatchingPatterns.split("\n");
            when(
              runnerInvoker.getInput(
                deepEqual(["Test", "Matching", "Patterns"]),
              ),
            ).thenReturn(testMatchingPatterns);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(inputs.testMatchingPatterns, expectedOutput);
            verify(
              logger.logInfo(adjustingTestMatchingPatternsResource),
            ).never();
            verify(logger.logInfo(settingTestMatchingPatternsResource)).once();
          });
        });
      }

      it("should replace all '\\' with '/'", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Test", "Matching", "Patterns"])),
        ).thenReturn("folder1\\file.js\nfolder2\\*.js");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(inputs.testMatchingPatterns, [
          "folder1/file.js",
          "folder2/*.js",
        ]);
        verify(logger.logInfo(settingTestMatchingPatternsResource)).once();
      });

      it("should remove trailing new lines", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Test", "Matching", "Patterns"])),
        ).thenReturn("file.js\n");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(inputs.testMatchingPatterns, ["file.js"]);
        verify(logger.logInfo(settingTestMatchingPatternsResource)).once();
      });
    });
  });
});
