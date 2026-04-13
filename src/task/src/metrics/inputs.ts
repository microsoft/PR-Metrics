/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "./inputsDefault.js";
import { decimalRadix, maxPatternCount } from "../utilities/constants.js";
import type Logger from "../utilities/logger.js";
import type RunnerInvoker from "../runners/runnerInvoker.js";

/**
 * A class representing inputs passed to the task.
 */
export default class Inputs {
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;

  private _isInitialized = false;
  private _baseSize = 0;
  private _growthRate = 0;
  private _testFactor: number | null = 0;
  private _alwaysCloseComment = false;
  private _fileMatchingPatterns: string[] = [];
  private _testMatchingPatterns: string[] = [];
  private _codeFileExtensions: Set<string> = new Set<string>();

  /**
   * Initializes a new instance of the `Inputs` class.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(logger: Logger, runnerInvoker: RunnerInvoker) {
    this._logger = logger;
    this._runnerInvoker = runnerInvoker;
  }

  /**
   * Gets the base size input, which is the maximum number of new lines in an extra small pull request.
   * @returns The base size input.
   */
  public get baseSize(): number {
    this._logger.logDebug("* Inputs.baseSize");

    this.initialize();
    return this._baseSize;
  }

  /**
   * Gets the growth rate input, which is applied to the base size for calculating the size of larger pull requests.
   * @returns The growth rate input.
   */
  public get growthRate(): number {
    this._logger.logDebug("* Inputs.growthRate");

    this.initialize();
    return this._growthRate;
  }

  /**
   * Gets the test factor input, which is the number of lines of test code expected for each line of product code.
   * @returns The test factor input. If the test coverage is not to be checked, this will be `null`.
   */
  public get testFactor(): number | null {
    this._logger.logDebug("* Inputs.testFactor");

    this.initialize();
    return this._testFactor;
  }

  /**
   * Gets the value indicating whether to always close the size and test comment, instead of leaving it open when
   * requiring attention.
   * @returns The value indicating whether to always close the comment.
   */
  public get alwaysCloseComment(): boolean {
    this._logger.logDebug("* Inputs.alwaysCloseComment");

    this.initialize();
    return this._alwaysCloseComment;
  }

  /**
   * Gets the file matching patterns input, which is the set of globs specifying the files and folders to include.
   * @returns The file matching patterns input.
   */
  public get fileMatchingPatterns(): string[] {
    this._logger.logDebug("* Inputs.fileMatchingPatterns");

    this.initialize();
    return this._fileMatchingPatterns;
  }

  /**
   * Gets the test matching patterns input, which is the set of globs specifying the files and folders to consider tests.
   * @returns The test matching patterns input.
   */
  public get testMatchingPatterns(): string[] {
    this._logger.logDebug("* Inputs.testMatchingPatterns");

    this.initialize();
    return this._testMatchingPatterns;
  }

  /**
   * Gets the code file extensions input, which is the set of extensions for files containing code so that non-code files can be excluded.
   * @returns The code file extensions input.
   */
  public get codeFileExtensions(): Set<string> {
    this._logger.logDebug("* Inputs.codeFileExtensions");

    this.initialize();
    return this._codeFileExtensions;
  }

  private initialize(): void {
    this._logger.logDebug("* Inputs.initialize()");

    if (this._isInitialized) {
      return;
    }

    const baseSize: string | null = this._runnerInvoker.getInput([
      "Base",
      "Size",
    ]);
    this.initializeBaseSize(baseSize);

    const growthRate: string | null = this._runnerInvoker.getInput([
      "Growth",
      "Rate",
    ]);
    this.initializeGrowthRate(growthRate);

    const testFactor: string | null = this._runnerInvoker.getInput([
      "Test",
      "Factor",
    ]);
    this.initializeTestFactor(testFactor);

    const alwaysCloseComment: string | null = this._runnerInvoker.getInput([
      "Always",
      "Close",
      "Comment",
    ]);
    this.initializeAlwaysCloseComment(alwaysCloseComment);

    const fileMatchingPatterns: string | null = this._runnerInvoker.getInput([
      "File",
      "Matching",
      "Patterns",
    ]);
    this.initializeFileMatchingPatterns(fileMatchingPatterns);

    const testMatchingPatterns: string | null = this._runnerInvoker.getInput([
      "Test",
      "Matching",
      "Patterns",
    ]);
    this.initializeTestMatchingPatterns(testMatchingPatterns);

    const codeFileExtensions: string | null = this._runnerInvoker.getInput([
      "Code",
      "File",
      "Extensions",
    ]);
    this.initializeCodeFileExtensions(codeFileExtensions);

    this._isInitialized = true;
  }

  private initializeBaseSize(baseSize: string | null): void {
    this._logger.logDebug("* Inputs.initializeBaseSize()");

    this.initializeNumeric(
      baseSize,
      (value: string): number => parseInt(value, decimalRadix),
      (value: number): boolean => value > 0,
      (value: number): void => {
        this._baseSize = value;
      },
      (valueString: string): void => {
        this._logger.logInfo(
          this._runnerInvoker.loc(
            "metrics.inputs.settingBaseSize",
            valueString,
          ),
        );
      },
      InputsDefault.baseSize,
      (valueString: string): void => {
        this._logger.logInfo(
          this._runnerInvoker.loc(
            "metrics.inputs.adjustingBaseSize",
            valueString,
          ),
        );
      },
    );
  }

  private initializeGrowthRate(growthRate: string | null): void {
    this._logger.logDebug("* Inputs.initializeGrowthRate()");

    this.initializeNumeric(
      growthRate,
      (value: string): number => parseFloat(value),
      (value: number): boolean => Number.isFinite(value) && value > 1.0,
      (value: number): void => {
        this._growthRate = value;
      },
      (valueString: string): void => {
        this._logger.logInfo(
          this._runnerInvoker.loc(
            "metrics.inputs.settingGrowthRate",
            valueString,
          ),
        );
      },
      InputsDefault.growthRate,
      (valueString: string): void => {
        this._logger.logInfo(
          this._runnerInvoker.loc(
            "metrics.inputs.adjustingGrowthRate",
            valueString,
          ),
        );
      },
    );
  }

  private initializeTestFactor(testFactor: string | null): void {
    this._logger.logDebug("* Inputs.initializeTestFactor()");

    const convertedValue: number =
      testFactor === null ? NaN : parseFloat(testFactor);
    if (
      !Number.isNaN(convertedValue) &&
      Number.isFinite(convertedValue) &&
      convertedValue >= 0.0
    ) {
      if (convertedValue === 0.0) {
        this._testFactor = null;
        this._logger.logInfo(
          this._runnerInvoker.loc("metrics.inputs.disablingTestFactor"),
        );
      } else {
        this._testFactor = convertedValue;
        const testFactorString: string = this._testFactor.toLocaleString();
        this._logger.logInfo(
          this._runnerInvoker.loc(
            "metrics.inputs.settingTestFactor",
            testFactorString,
          ),
        );
      }

      return;
    }

    const testFactorString: string = InputsDefault.testFactor.toLocaleString();
    this._logger.logInfo(
      this._runnerInvoker.loc(
        "metrics.inputs.adjustingTestFactor",
        testFactorString,
      ),
    );
    this._testFactor = InputsDefault.testFactor;
  }

  private initializeNumeric(
    inputValue: string | null,
    parser: (value: string) => number,
    validator: (value: number) => boolean,
    setter: (value: number) => void,
    settingMessage: (valueString: string) => void,
    defaultValue: number,
    adjustingMessage: (valueString: string) => void,
  ): void {
    this._logger.logDebug("* Inputs.initializeNumeric()");

    const convertedValue: number =
      inputValue === null ? NaN : parser(inputValue);
    if (!Number.isNaN(convertedValue) && validator(convertedValue)) {
      setter(convertedValue);
      settingMessage(convertedValue.toLocaleString());
      return;
    }

    adjustingMessage(defaultValue.toLocaleString());
    setter(defaultValue);
  }

  private initializeAlwaysCloseComment(
    alwaysCloseComment: string | null,
  ): void {
    this._logger.logDebug("* Inputs.initializeAlwaysCloseComment()");

    const convertedValue: boolean | null =
      alwaysCloseComment?.toLowerCase() === "true";
    if (convertedValue) {
      this._alwaysCloseComment = convertedValue;
      this._logger.logInfo(
        this._runnerInvoker.loc("metrics.inputs.settingAlwaysCloseComment"),
      );
      return;
    }

    this._logger.logInfo(
      this._runnerInvoker.loc("metrics.inputs.adjustingAlwaysCloseComment"),
    );
    this._alwaysCloseComment = InputsDefault.alwaysCloseComment;
  }

  private initializeFileMatchingPatterns(
    fileMatchingPatterns: string | null,
  ): void {
    this._logger.logDebug("* Inputs.initializeFileMatchingPatterns()");

    this._fileMatchingPatterns = this.initializeMatchingPatterns(
      fileMatchingPatterns,
      InputsDefault.fileMatchingPatterns,
      (patterns) =>
        this._runnerInvoker.loc(
          "metrics.inputs.settingFileMatchingPatterns",
          patterns,
        ),
      (patterns) =>
        this._runnerInvoker.loc(
          "metrics.inputs.adjustingFileMatchingPatterns",
          patterns,
        ),
    );
  }

  private initializeTestMatchingPatterns(
    testMatchingPatterns: string | null,
  ): void {
    this._logger.logDebug("* Inputs.initializeTestMatchingPatterns()");

    this._testMatchingPatterns = this.initializeMatchingPatterns(
      testMatchingPatterns,
      InputsDefault.testMatchingPatterns,
      (patterns) =>
        this._runnerInvoker.loc(
          "metrics.inputs.settingTestMatchingPatterns",
          patterns,
        ),
      (patterns) =>
        this._runnerInvoker.loc(
          "metrics.inputs.adjustingTestMatchingPatterns",
          patterns,
        ),
    );
  }

  private initializeMatchingPatterns(
    inputValue: string | null,
    defaultValue: string[],
    settingString: (patterns: string) => string,
    adjustingString: (patterns: string) => string,
  ): string[] {
    this._logger.logDebug("* Inputs.initializeMatchingPatterns()");

    if (inputValue !== null && inputValue.trim() !== "") {
      const patterns = inputValue
        .replace(/\\/gu, "/")
        .replace(/\n$/gu, "")
        .split("\n");
      if (patterns.length > maxPatternCount) {
        this._logger.logWarning(
          `The matching pattern count '${patterns.length.toLocaleString()}' exceeds the maximum '${maxPatternCount.toLocaleString()}'. Using only the first '${maxPatternCount.toLocaleString()}'.`,
        );
        patterns.length = maxPatternCount;
      }

      const patternsString: string = JSON.stringify(patterns);
      this._logger.logInfo(settingString(patternsString));
      return patterns;
    }

    const defaultPatternsString: string = JSON.stringify(defaultValue);
    this._logger.logInfo(adjustingString(defaultPatternsString));
    return defaultValue;
  }

  private initializeCodeFileExtensions(
    codeFileExtensions: string | null,
  ): void {
    this._logger.logDebug("* Inputs.initializeCodeFileExtensions()");

    if (codeFileExtensions !== null && codeFileExtensions.trim() !== "") {
      const wildcardStart = "*.";
      const periodStart = ".";

      const codeFileExtensionsArray: string[] = codeFileExtensions
        .replace(/\n$/gu, "")
        .split("\n");
      for (const value of codeFileExtensionsArray) {
        let modifiedValue = value;
        if (modifiedValue.startsWith(wildcardStart)) {
          modifiedValue = modifiedValue.substring(wildcardStart.length);
        } else if (modifiedValue.startsWith(periodStart)) {
          modifiedValue = modifiedValue.substring(periodStart.length);
        }

        this._codeFileExtensions.add(modifiedValue.toLowerCase());
      }
      this._logger.logInfo(
        this._runnerInvoker.loc(
          "metrics.inputs.settingCodeFileExtensions",
          JSON.stringify([...this._codeFileExtensions]),
        ),
      );
      return;
    }

    this._logger.logInfo(
      this._runnerInvoker.loc(
        "metrics.inputs.adjustingCodeFileExtensions",
        JSON.stringify(InputsDefault.codeFileExtensions),
      ),
    );
    this._codeFileExtensions = new Set<string>(
      InputsDefault.codeFileExtensions,
    );
  }
}
