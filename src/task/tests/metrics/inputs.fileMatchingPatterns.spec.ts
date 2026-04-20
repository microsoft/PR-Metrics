/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingFileMatchingPatternsResource,
  createInputsMocks,
  createSut,
  settingFileMatchingPatternsResource,
} from "./inputsTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type Inputs from "../../src/metrics/inputs.js";
import type Logger from "../../src/utilities/logger.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { invalidPatternStrings } from "../testUtilities/fixtures/invalidInputs.js";
import { maxPatternCount } from "../../src/utilities/constants.js";

describe("inputs.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ logger, runnerInvoker } = createInputsMocks());
  });

  describe("initialize()", (): void => {
    describe("fileMatchingPatterns", (): void => {
      invalidPatternStrings.forEach(
        (fileMatchingPatterns: string | null): void => {
          it(`should set the default when the input '${String(fileMatchingPatterns?.replace(/\n/gu, "\\n"))}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(
                deepEqual(["File", "Matching", "Patterns"]),
              ),
            ).thenReturn(fileMatchingPatterns);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(
              inputs.fileMatchingPatterns,
              InputsDefault.fileMatchingPatterns,
            );
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
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

        testCases.forEach((fileMatchingPatterns: string): void => {
          it(`should not split '${fileMatchingPatterns}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(
                deepEqual(["File", "Matching", "Patterns"]),
              ),
            ).thenReturn(fileMatchingPatterns);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(inputs.fileMatchingPatterns, [
              fileMatchingPatterns,
            ]);
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
          });
        });
      }

      {
        const testCases: string[] = [
          "*.ada\n*.js\n*.ts\n*.bb\n*.txt",
          "abc\ndef\nhij",
        ];

        testCases.forEach((fileMatchingPatterns: string): void => {
          it(`should split '${fileMatchingPatterns.replace(/\n/gu, "\\n")}' at the newline character`, (): void => {
            // Arrange
            const expectedOutput: string[] = fileMatchingPatterns.split("\n");
            when(
              runnerInvoker.getInput(
                deepEqual(["File", "Matching", "Patterns"]),
              ),
            ).thenReturn(fileMatchingPatterns);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(inputs.fileMatchingPatterns, expectedOutput);
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
          });
        });
      }

      it("should replace all '\\' with '/'", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn("folder1\\file.js\nfolder2\\*.js");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(inputs.fileMatchingPatterns, [
          "folder1/file.js",
          "folder2/*.js",
        ]);
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
      });

      it("should remove trailing new lines", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn("file.js\n");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(inputs.fileMatchingPatterns, ["file.js"]);
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
      });

      it("should trim whitespace and filter empty lines", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn("  pattern1  \n\n  pattern2  \n   \npattern3");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(inputs.fileMatchingPatterns, [
          "pattern1",
          "pattern2",
          "pattern3",
        ]);
      });

      it("should truncate patterns exceeding the maximum count", (): void => {
        // Arrange
        const excessCount: number = maxPatternCount + 50;
        const patterns: string[] = Array.from(
          { length: excessCount },
          (_value: string, index: number) => `pattern${String(index)}`,
        );
        const maxPatternCountString: string = maxPatternCount.toLocaleString();
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn(patterns.join("\n"));

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.equal(inputs.fileMatchingPatterns.length, maxPatternCount);
        assert.equal(inputs.fileMatchingPatterns[0], "pattern0");
        assert.equal(
          inputs.fileMatchingPatterns[maxPatternCount - 1],
          `pattern${String(maxPatternCount - 1)}`,
        );
        verify(
          logger.logWarning(
            `The matching pattern count '${excessCount.toLocaleString()}' exceeds the maximum '${maxPatternCountString}'. Using only the first '${maxPatternCountString}'.`,
          ),
        ).once();
      });
    });
  });
});
