/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */


import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import {
  adjustingCodeFileExtensionsResource,
  createInputsMocks,
  createSut,
  settingCodeFileExtensionsResource,
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
    describe("codeFileExtensions", (): void => {
      invalidPatternStrings.forEach((codeFileExtensions: string | null): void => {
        it(`should set the default when the input '${String(codeFileExtensions?.replace(/\n/gu, "\\n"))}' is invalid`, (): void => {
          // Arrange
          when(
            runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
          ).thenReturn(codeFileExtensions);

          // Act
          const inputs: Inputs = createSut(logger, runnerInvoker);

          // Assert
          assert.deepEqual(
            inputs.codeFileExtensions,
            new Set<string>(InputsDefault.codeFileExtensions),
          );
          verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
        });
      });

      {
        const testCases: string[] = [
          "ada\njs\nts\nbb\ntxt",
          "abc\ndef\nhij",
          "ts",
        ];

        testCases.forEach((codeFileExtensions: string): void => {
          it(`should split '${codeFileExtensions.replace(/\n/gu, "\\n")}' at the newline character`, (): void => {
            // Arrange
            const expectedResult: Set<string> = new Set<string>(
              codeFileExtensions.split("\n"),
            );
            when(
              runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
            ).thenReturn(codeFileExtensions);

            // Act
            const inputs: Inputs = createSut(logger, runnerInvoker);

            // Assert
            assert.deepEqual(inputs.codeFileExtensions, expectedResult);
            verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
          });
        });
      }

      it("should handle repeated insertion of identical items", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ada\nada");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(inputs.codeFileExtensions, new Set<string>(["ada"]));
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should convert extensions to lower case", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ADA\ncS\nTxT");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "cs", "txt"]),
        );
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should remove . and * from extension names", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("*.ada\n.txt");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "txt"]),
        );
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should convert extensions to lower case", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ADA\ncS\nTxT");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "cs", "txt"]),
        );
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should remove trailing new lines", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ada\ncs\ntxt\n");

        // Act
        const inputs: Inputs = createSut(logger, runnerInvoker);

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "cs", "txt"]),
        );
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });
    });
  });
});
