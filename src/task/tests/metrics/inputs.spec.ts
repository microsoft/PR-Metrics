/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as Converter from "../../src/utilities/converter";
import * as InputsDefault from "../../src/metrics/inputsDefault";
import { anyString, deepEqual, instance, mock, verify, when } from "ts-mockito";
import { DecimalRadix } from "../../src/utilities/constants";
import Inputs from "../../src/metrics/inputs";
import Logger from "../../src/utilities/logger";
import RunnerInvoker from "../../src/runners/runnerInvoker";
import assert from "node:assert/strict";

describe("inputs.ts", (): void => {
  const adjustingAlwaysCloseComment: string =
    "Adjusting the always-close-comment mode input to 'false'.";
  const adjustingBaseSizeResource: string = `Adjusting the base size input to '${InputsDefault.baseSize}'.`;
  const adjustingGrowthRateResource: string = `Adjusting the growth rate input to '${InputsDefault.growthRate}'.`;
  const adjustingTestFactorResource: string = `Adjusting the test factor input to '${InputsDefault.testFactor}'.`;
  const adjustingFileMatchingPatternsResource: string = `Adjusting the file matching patterns input to '${JSON.stringify(InputsDefault.fileMatchingPatterns)}'.`;
  const adjustingCodeFileExtensionsResource: string = `Adjusting the code file extensions input to '${JSON.stringify(InputsDefault.codeFileExtensions)}'.`;
  const disablingTestFactorResource: string =
    "Disabling the test factor validation.";
  const settingAlwaysCloseComment: string =
    "Setting the always-close-comment mode input to 'true'.";
  const settingBaseSizeResource: string =
    "Setting the base size input to 'VALUE'.";
  const settingGrowthRateResource: string =
    "Setting the growth rate input to 'VALUE'.";
  const settingTestFactorResource: string =
    "Setting the test factor input to 'VALUE'.";
  const settingFileMatchingPatternsResource: string =
    "Setting the file matching patterns input to 'VALUE'.";
  const settingCodeFileExtensionsResource: string =
    "Setting the code file extensions input to 'VALUE'.";

  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    when(runnerInvoker.getInput(deepEqual(["Base", "Size"]))).thenReturn("");
    when(runnerInvoker.getInput(deepEqual(["Growth", "Rate"]))).thenReturn("");
    when(runnerInvoker.getInput(deepEqual(["Test", "Factor"]))).thenReturn("");
    when(
      runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
    ).thenReturn("");
    when(
      runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
    ).thenReturn("");
    when(
      runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
    ).thenReturn("");
    when(
      runnerInvoker.loc("metrics.inputs.adjustingAlwaysCloseComment"),
    ).thenReturn(adjustingAlwaysCloseComment);
    when(
      runnerInvoker.loc(
        "metrics.inputs.adjustingBaseSize",
        InputsDefault.baseSize.toLocaleString(),
      ),
    ).thenReturn(adjustingBaseSizeResource);
    when(
      runnerInvoker.loc(
        "metrics.inputs.adjustingGrowthRate",
        InputsDefault.growthRate.toLocaleString(),
      ),
    ).thenReturn(adjustingGrowthRateResource);
    when(
      runnerInvoker.loc(
        "metrics.inputs.adjustingTestFactor",
        InputsDefault.testFactor.toLocaleString(),
      ),
    ).thenReturn(adjustingTestFactorResource);
    when(
      runnerInvoker.loc(
        "metrics.inputs.adjustingFileMatchingPatterns",
        JSON.stringify(InputsDefault.fileMatchingPatterns),
      ),
    ).thenReturn(adjustingFileMatchingPatternsResource);
    when(
      runnerInvoker.loc(
        "metrics.inputs.adjustingCodeFileExtensions",
        JSON.stringify(InputsDefault.codeFileExtensions),
      ),
    ).thenReturn(adjustingCodeFileExtensionsResource);
    when(runnerInvoker.loc("metrics.inputs.disablingTestFactor")).thenReturn(
      disablingTestFactorResource,
    );
    when(
      runnerInvoker.loc("metrics.inputs.settingAlwaysCloseComment"),
    ).thenReturn(settingAlwaysCloseComment);
    when(
      runnerInvoker.loc("metrics.inputs.settingBaseSize", anyString()),
    ).thenReturn(settingBaseSizeResource);
    when(
      runnerInvoker.loc("metrics.inputs.settingGrowthRate", anyString()),
    ).thenReturn(settingGrowthRateResource);
    when(
      runnerInvoker.loc("metrics.inputs.settingTestFactor", anyString()),
    ).thenReturn(settingTestFactorResource);
    when(
      runnerInvoker.loc(
        "metrics.inputs.settingFileMatchingPatterns",
        anyString(),
      ),
    ).thenReturn(settingFileMatchingPatternsResource);
    when(
      runnerInvoker.loc(
        "metrics.inputs.settingCodeFileExtensions",
        anyString(),
      ),
    ).thenReturn(settingCodeFileExtensionsResource);
  });

  describe("initialize()", (): void => {
    describe("all inputs", (): void => {
      it("should set all default values when nothing is specified", (): void => {
        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

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
          inputs.codeFileExtensions,
          new Set<string>(InputsDefault.codeFileExtensions),
        );
        verify(logger.logDebug("* Inputs.initialize()")).times(6);
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.baseSize")).once();
        verify(logger.logDebug("* Inputs.growthRate")).once();
        verify(logger.logDebug("* Inputs.testFactor")).once();
        verify(logger.logDebug("* Inputs.alwaysCloseComment")).once();
        verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("js\nts");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.equal(inputs.baseSize, 5.0);
        assert.equal(inputs.growthRate, 4.4);
        assert.equal(inputs.testFactor, 2.7);
        assert.deepEqual(inputs.alwaysCloseComment, true);
        assert.deepEqual(inputs.fileMatchingPatterns, ["aa", "bb"]);
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["js", "ts"]),
        );
        verify(logger.logDebug("* Inputs.initialize()")).times(6);
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.baseSize")).once();
        verify(logger.logDebug("* Inputs.growthRate")).once();
        verify(logger.logDebug("* Inputs.testFactor")).once();
        verify(logger.logDebug("* Inputs.alwaysCloseComment")).once();
        verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).never();
        verify(logger.logInfo(adjustingBaseSizeResource)).never();
        verify(logger.logInfo(adjustingGrowthRateResource)).never();
        verify(logger.logInfo(adjustingTestFactorResource)).never();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).once();
        verify(logger.logInfo(settingBaseSizeResource)).once();
        verify(logger.logInfo(settingGrowthRateResource)).once();
        verify(logger.logInfo(settingTestFactorResource)).once();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });
    });

    describe("baseSize", (): void => {
      {
        const testCases: (string | undefined)[] = [
          undefined,
          "",
          " ",
          "abc",
          "===",
          "!2",
          "null",
          "undefined",
        ];

        testCases.forEach((baseSize: string | undefined): void => {
          it(`should set the default when the input '${Converter.toString(baseSize)}' is invalid`, (): void => {
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
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.baseSize")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.baseSize")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            assert.equal(inputs.baseSize, parseInt(baseSize, DecimalRadix));
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.baseSize")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).never();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).once();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }
    });

    describe("growthRate", (): void => {
      {
        const testCases: (string | undefined)[] = [
          undefined,
          "",
          " ",
          "abc",
          "===",
          "!2",
          "null",
          "undefined",
        ];

        testCases.forEach((growthRate: string | undefined): void => {
          it(`should set the default when the input '${Converter.toString(growthRate)}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Growth", "Rate"])),
            ).thenReturn(growthRate);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.growthRate, InputsDefault.growthRate);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.growthRate")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.growthRate, InputsDefault.growthRate);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.growthRate")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.growthRate, parseFloat(growthRate));
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.growthRate")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).never();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).once();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }
    });

    describe("testFactor", (): void => {
      {
        const testCases: (string | undefined)[] = [
          undefined,
          "",
          " ",
          "abc",
          "===",
          "!2",
          "null",
          "undefined",
        ];

        testCases.forEach((testFactor: string | undefined): void => {
          it(`should set the default when the input '${Converter.toString(testFactor)}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Test", "Factor"])),
            ).thenReturn(testFactor);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.testFactor, InputsDefault.testFactor);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.testFactor")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.testFactor, InputsDefault.testFactor);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.testFactor")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.testFactor, parseFloat(testFactor));
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.testFactor")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).never();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).once();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.testFactor, null);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.testFactor")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).never();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).once();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }
    });

    describe("alwaysCloseComment", (): void => {
      {
        const testCases: (string | undefined)[] = [
          undefined,
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

        testCases.forEach((alwaysCloseComment: string | undefined): void => {
          it(`should set the default when the input is '${Converter.toString(alwaysCloseComment)}'`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
            ).thenReturn(alwaysCloseComment);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(
              inputs.alwaysCloseComment,
              InputsDefault.alwaysCloseComment,
            );
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.alwaysCloseComment")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.equal(inputs.alwaysCloseComment, true);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.alwaysCloseComment")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).never();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).once();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }
    });

    describe("fileMatchingPatterns", (): void => {
      {
        const testCases: (string | undefined)[] = [
          undefined,
          "",
          " ",
          "     ",
          "\n",
        ];

        testCases.forEach((fileMatchingPatterns: string | undefined): void => {
          it(`should set the default when the input '${Converter.toString(fileMatchingPatterns?.replace(/\n/gu, "\\n"))}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(
                deepEqual(["File", "Matching", "Patterns"]),
              ),
            ).thenReturn(fileMatchingPatterns);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.deepEqual(
              inputs.fileMatchingPatterns,
              InputsDefault.fileMatchingPatterns,
            );
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }

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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.deepEqual(inputs.fileMatchingPatterns, [
              fileMatchingPatterns,
            ]);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).never();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.deepEqual(inputs.fileMatchingPatterns, expectedOutput);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).never();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }

      it("should replace all '\\' with '/'", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn("folder1\\file.js\nfolder2\\*.js");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(inputs.fileMatchingPatterns, [
          "folder1/file.js",
          "folder2/*.js",
        ]);
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
      });

      it("should remove trailing new lines", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
        ).thenReturn("file.js\n");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(inputs.fileMatchingPatterns, ["file.js"]);
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.fileMatchingPatterns")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
      });
    });

    describe("codeFileExtensions", (): void => {
      {
        const testCases: (string | undefined)[] = [
          undefined,
          "",
          " ",
          "     ",
          "\n",
        ];

        testCases.forEach((codeFileExtensions: string | undefined): void => {
          it(`should set the default when the input '${Converter.toString(codeFileExtensions?.replace(/\n/gu, "\\n"))}' is invalid`, (): void => {
            // Arrange
            when(
              runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
            ).thenReturn(codeFileExtensions);

            // Act
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.deepEqual(
              inputs.codeFileExtensions,
              new Set<string>(InputsDefault.codeFileExtensions),
            );
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never();
          });
        });
      }

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
            const inputs: Inputs = new Inputs(
              instance(logger),
              instance(runnerInvoker),
            );

            // Assert
            assert.deepEqual(inputs.codeFileExtensions, expectedResult);
            verify(logger.logDebug("* Inputs.initialize()")).once();
            verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
            verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
            verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
            verify(
              logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
            ).once();
            verify(
              logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
            ).once();
            verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
            verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
            verify(logger.logInfo(adjustingBaseSizeResource)).once();
            verify(logger.logInfo(adjustingGrowthRateResource)).once();
            verify(logger.logInfo(adjustingTestFactorResource)).once();
            verify(
              logger.logInfo(adjustingFileMatchingPatternsResource),
            ).once();
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
            verify(logger.logInfo(disablingTestFactorResource)).never();
            verify(logger.logInfo(settingAlwaysCloseComment)).never();
            verify(logger.logInfo(settingBaseSizeResource)).never();
            verify(logger.logInfo(settingGrowthRateResource)).never();
            verify(logger.logInfo(settingTestFactorResource)).never();
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
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
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(inputs.codeFileExtensions, new Set<string>(["ada"]));
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should convert extensions to lower case", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ADA\ncS\nTxT");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "cs", "txt"]),
        );
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should remove . and * from extension names", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("*.ada\n.txt");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "txt"]),
        );
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should convert extensions to lower case", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ADA\ncS\nTxT");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "cs", "txt"]),
        );
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });

      it("should remove trailing new lines", (): void => {
        // Arrange
        when(
          runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
        ).thenReturn("ada\ncs\ntxt\n");

        // Act
        const inputs: Inputs = new Inputs(
          instance(logger),
          instance(runnerInvoker),
        );

        // Assert
        assert.deepEqual(
          inputs.codeFileExtensions,
          new Set<string>(["ada", "cs", "txt"]),
        );
        verify(logger.logDebug("* Inputs.initialize()")).once();
        verify(logger.logDebug("* Inputs.initializeBaseSize()")).once();
        verify(logger.logDebug("* Inputs.initializeGrowthRate()")).once();
        verify(logger.logDebug("* Inputs.initializeTestFactor()")).once();
        verify(
          logger.logDebug("* Inputs.initializeAlwaysCloseComment()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeFileMatchingPatterns()"),
        ).once();
        verify(
          logger.logDebug("* Inputs.initializeCodeFileExtensions()"),
        ).once();
        verify(logger.logDebug("* Inputs.codeFileExtensions")).once();
        verify(logger.logInfo(adjustingAlwaysCloseComment)).once();
        verify(logger.logInfo(adjustingBaseSizeResource)).once();
        verify(logger.logInfo(adjustingGrowthRateResource)).once();
        verify(logger.logInfo(adjustingTestFactorResource)).once();
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once();
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never();
        verify(logger.logInfo(disablingTestFactorResource)).never();
        verify(logger.logInfo(settingAlwaysCloseComment)).never();
        verify(logger.logInfo(settingBaseSizeResource)).never();
        verify(logger.logInfo(settingGrowthRateResource)).never();
        verify(logger.logInfo(settingTestFactorResource)).never();
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never();
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once();
      });
    });
  });
});
