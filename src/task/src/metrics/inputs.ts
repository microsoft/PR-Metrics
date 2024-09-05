/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "./inputsDefault";
import Logger from "../utilities/logger";
import RunnerInvoker from "../runners/runnerInvoker";
import { decimalRadix } from "../utilities/constants";
import { singleton } from "tsyringe";

/**
 * A class representing inputs passed to the task.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class Inputs {
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;

  private _isInitialized = false;
  private _baseSize = 0;
  private _growthRate = 0;
  private _testFactor: number | null = 0;
  private _alwaysCloseComment = false;
  private _fileMatchingPatterns: string[] = [];
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

    const baseSize: string | undefined = this._runnerInvoker.getInput([
      "Base",
      "Size",
    ]);
    this.initializeBaseSize(baseSize);

    const growthRate: string | undefined = this._runnerInvoker.getInput([
      "Growth",
      "Rate",
    ]);
    this.initializeGrowthRate(growthRate);

    const testFactor: string | undefined = this._runnerInvoker.getInput([
      "Test",
      "Factor",
    ]);
    this.initializeTestFactor(testFactor);

    const alwaysCloseComment: string | undefined = this._runnerInvoker.getInput(
      ["Always", "Close", "Comment"],
    );
    this.initializeAlwaysCloseComment(alwaysCloseComment);

    const fileMatchingPatterns: string | undefined =
      this._runnerInvoker.getInput(["File", "Matching", "Patterns"]);
    this.initializeFileMatchingPatterns(fileMatchingPatterns);

    const codeFileExtensions: string | undefined = this._runnerInvoker.getInput(
      ["Code", "File", "Extensions"],
    );
    this.initializeCodeFileExtensions(codeFileExtensions);

    this._isInitialized = true;
  }

  private initializeBaseSize(baseSize: string | undefined): void {
    this._logger.logDebug("* Inputs.initializeBaseSize()");

    const convertedValue: number =
      typeof baseSize === "undefined" ? NaN : parseInt(baseSize, decimalRadix);
    if (!isNaN(convertedValue) && convertedValue > 0) {
      this._baseSize = convertedValue;
      const baseSizeString: string = this._baseSize.toLocaleString();
      this._logger.logInfo(
        this._runnerInvoker.loc(
          "metrics.inputs.settingBaseSize",
          baseSizeString,
        ),
      );
      return;
    }

    const baseSizeString: string = InputsDefault.baseSize.toLocaleString();
    this._logger.logInfo(
      this._runnerInvoker.loc(
        "metrics.inputs.adjustingBaseSize",
        baseSizeString,
      ),
    );
    this._baseSize = InputsDefault.baseSize;
  }

  private initializeGrowthRate(growthRate: string | undefined): void {
    this._logger.logDebug("* Inputs.initializeGrowthRate()");

    const convertedValue: number =
      typeof growthRate === "undefined" ? NaN : parseFloat(growthRate);
    if (!isNaN(convertedValue) && convertedValue > 1.0) {
      this._growthRate = convertedValue;
      const growthRateString: string = this._growthRate.toLocaleString();
      this._logger.logInfo(
        this._runnerInvoker.loc(
          "metrics.inputs.settingGrowthRate",
          growthRateString,
        ),
      );
      return;
    }

    const growthRateString: string = InputsDefault.growthRate.toLocaleString();
    this._logger.logInfo(
      this._runnerInvoker.loc(
        "metrics.inputs.adjustingGrowthRate",
        growthRateString,
      ),
    );
    this._growthRate = InputsDefault.growthRate;
  }

  private initializeTestFactor(testFactor: string | undefined): void {
    this._logger.logDebug("* Inputs.initializeTestFactor()");

    const convertedValue: number =
      typeof testFactor === "undefined" ? NaN : parseFloat(testFactor);
    if (!isNaN(convertedValue) && convertedValue >= 0.0) {
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

  private initializeAlwaysCloseComment(
    alwaysCloseComment: string | undefined,
  ): void {
    this._logger.logDebug("* Inputs.initializeAlwaysCloseComment()");

    const convertedValue: boolean | undefined =
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
    fileMatchingPatterns: string | undefined,
  ): void {
    this._logger.logDebug("* Inputs.initializeFileMatchingPatterns()");

    if (
      typeof fileMatchingPatterns !== "undefined" &&
      fileMatchingPatterns.trim() !== ""
    ) {
      this._fileMatchingPatterns = fileMatchingPatterns
        .replace(/\\/gu, "/")
        .replace(/\n$/gu, "")
        .split("\n");
      const fileMatchPatternsString: string = JSON.stringify(
        this._fileMatchingPatterns,
      );
      this._logger.logInfo(
        this._runnerInvoker.loc(
          "metrics.inputs.settingFileMatchingPatterns",
          fileMatchPatternsString,
        ),
      );
      return;
    }

    const fileMatchPatternsString: string = JSON.stringify(
      InputsDefault.fileMatchingPatterns,
    );
    this._logger.logInfo(
      this._runnerInvoker.loc(
        "metrics.inputs.adjustingFileMatchingPatterns",
        fileMatchPatternsString,
      ),
    );
    this._fileMatchingPatterns = InputsDefault.fileMatchingPatterns;
  }

  private initializeCodeFileExtensions(
    codeFileExtensions: string | undefined,
  ): void {
    this._logger.logDebug("* Inputs.initializeCodeFileExtensions()");

    if (
      typeof codeFileExtensions !== "undefined" &&
      codeFileExtensions.trim() !== ""
    ) {
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
          JSON.stringify(Array.from(this._codeFileExtensions)),
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
