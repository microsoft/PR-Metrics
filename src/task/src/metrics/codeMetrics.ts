/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as minimatch from "minimatch";
import * as path from "path";
import { CodeFileMetricInterface } from "./codeFileMetricInterface";
import CodeMetricsData from "./codeMetricsData";
import { FixedLengthArrayInterface } from "../utilities/fixedLengthArrayInterface";
import GitInvoker from "../git/gitInvoker";
import Inputs from "./inputs";
import Logger from "../utilities/logger";
import RunnerInvoker from "../runners/runnerInvoker";
import { decimalRadix } from "../utilities/constants";
import { singleton } from "tsyringe";

/**
 * A class for computing metrics for software code in pull requests.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class CodeMetrics {
  private static readonly _minimatchOptions: minimatch.MinimatchOptions = {
    dot: true,
  };

  private readonly _gitInvoker: GitInvoker;
  private readonly _inputs: Inputs;
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;

  private _isInitialized = false;
  private readonly _filesNotRequiringReview: string[] = [];
  private readonly _deletedFilesNotRequiringReview: string[] = [];
  private _size = "";
  private _sizeIndicator = "";
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0);
  private _isSufficientlyTested: boolean | null = null;

  /**
   * Initializes a new instance of the `CodeMetrics` class.
   * @param gitInvoker The Git invoker.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(
    gitInvoker: GitInvoker,
    inputs: Inputs,
    logger: Logger,
    runnerInvoker: RunnerInvoker,
  ) {
    this._gitInvoker = gitInvoker;
    this._inputs = inputs;
    this._logger = logger;
    this._runnerInvoker = runnerInvoker;
  }

  private static parseChangedLines(
    element: string,
    line: string,
    category: string,
  ): number {
    // Parse the number of lines changed. For binary files, the lines will be '-'.
    let result: number;
    if (element === "-") {
      result = 0;
    } else {
      result = parseInt(element, decimalRadix);
      if (isNaN(result)) {
        throw new Error(
          `Could not parse ${category} lines '${element}' from line '${line}'.`,
        );
      }
    }

    return result;
  }

  /**
   * Gets the collection of files not requiring review to which to add a comment.
   * @returns A promise containing the collection of files not requiring review.
   */
  public async getFilesNotRequiringReview(): Promise<string[]> {
    this._logger.logDebug("* CodeMetrics.getFilesNotRequiringReview()");

    await this.initialize();
    return this._filesNotRequiringReview;
  }

  /**
   * Gets the collection of deleted files not requiring review to which to add a comment.
   * @returns A promise containing the collection of deleted files not requiring review.
   */
  public async getDeletedFilesNotRequiringReview(): Promise<string[]> {
    this._logger.logDebug("* CodeMetrics.getDeletedFilesNotRequiringReview()");

    await this.initialize();
    return this._deletedFilesNotRequiringReview;
  }

  /**
   * Gets the size of the pull request – XS, S, M, etc.
   * @returns A promise containing the size of the pull request.
   */
  public async getSize(): Promise<string> {
    this._logger.logDebug("* CodeMetrics.getSize()");

    await this.initialize();
    return this._size;
  }

  /**
   * Gets the size indicator comprising the size and test coverage indicator, which will form part of the title.
   * @returns A promise containing the size indicator.
   */
  public async getSizeIndicator(): Promise<string> {
    this._logger.logDebug("* CodeMetrics.getSizeIndicator()");

    await this.initialize();
    return this._sizeIndicator;
  }

  /**
   * Gets the collection of pull request code metrics.
   * @returns A promise containing the collection of pull request code metrics.
   */
  public async getMetrics(): Promise<CodeMetricsData> {
    this._logger.logDebug("* CodeMetrics.getMetrics()");

    await this.initialize();
    return this._metrics;
  }

  /**
   * Gets a value indicating whether the pull request is small or extra small.
   * @returns A promise indicating whether the pull request is small or extra small.
   */
  public async isSmall(): Promise<boolean> {
    this._logger.logDebug("* CodeMetrics.isSmall()");

    await this.initialize();
    return (
      this._metrics.productCode <
      this._inputs.baseSize * this._inputs.growthRate
    );
  }

  /**
   * Gets a value indicating whether the pull request has sufficient test coverage.
   * @returns A promise indicating whether the pull request has sufficient test coverage. If the test coverage is not being checked, the value will be `null`.
   */
  public async isSufficientlyTested(): Promise<boolean | null> {
    this._logger.logDebug("* CodeMetrics.isSufficientlyTested()");

    await this.initialize();
    return this._isSufficientlyTested;
  }

  private async initialize(): Promise<void> {
    this._logger.logDebug("* CodeMetrics.initialize()");

    if (this._isInitialized) {
      return;
    }

    const gitDiffSummary: string = (
      await this._gitInvoker.getDiffSummary()
    ).trim();
    if (gitDiffSummary === "") {
      throw new Error("The Git diff summary is empty.");
    }

    this._isInitialized = true;
    this.initializeMetrics(gitDiffSummary);
    this.initializeIsSufficientlyTested();
    this.initializeSizeIndicator();
  }

  private initializeMetrics(gitDiffSummary: string): void {
    this._logger.logDebug("* CodeMetrics.initializeMetrics()");

    const notNotPattern = "!!";
    const notPattern = "!";

    const codeFileMetrics: CodeFileMetricInterface[] =
      this.createFileMetricsMap(gitDiffSummary);

    const matches: CodeFileMetricInterface[] = [];
    const nonMatches: CodeFileMetricInterface[] = [];
    const nonMatchesToComment: CodeFileMetricInterface[] = [];

    // Check for glob matches.
    for (const codeFileMetric of codeFileMetrics) {
      /*
       * Iterate through the list of patterns. First, check for positive matches. Next, if one of the positive matches
       * is overridden by a negative match, remove it from consideration. Finally, check for double negative matches,
       * which override the negative matches.
       */
      const positiveFileMatchingPatterns: string[] = [];
      const negativeFileMatchingPatterns: string[] = [];
      const doubleNegativeFileMatchingPatterns: string[] = [];
      for (const fileMatchingPattern of this._inputs.fileMatchingPatterns) {
        if (fileMatchingPattern.startsWith(notNotPattern)) {
          doubleNegativeFileMatchingPatterns.push(
            fileMatchingPattern.substring(notNotPattern.length),
          );
        } else if (fileMatchingPattern.startsWith(notPattern)) {
          negativeFileMatchingPatterns.push(
            fileMatchingPattern.substring(notPattern.length),
          );
        } else {
          positiveFileMatchingPatterns.push(fileMatchingPattern);
        }
      }

      const isValidFilePattern: boolean = this.determineIfValidFilePattern(
        codeFileMetric,
        positiveFileMatchingPatterns,
        negativeFileMatchingPatterns,
        doubleNegativeFileMatchingPatterns,
      );
      const isValidFileExtension: boolean = this.matchFileExtension(
        codeFileMetric.fileName,
      );
      if (isValidFilePattern && isValidFileExtension) {
        matches.push(codeFileMetric);
      } else if (isValidFilePattern) {
        nonMatches.push(codeFileMetric);
      } else {
        nonMatchesToComment.push(codeFileMetric);
      }
    }

    this.constructMetrics(matches, nonMatches, nonMatchesToComment);
  }

  private determineIfValidFilePattern(
    codeFileMetric: CodeFileMetricInterface,
    positiveFileMatchingPatterns: string[],
    negativeFileMatchingPatterns: string[],
    doubleNegativeFileMatchingPatterns: string[],
  ): boolean {
    this._logger.logDebug("* CodeMetrics.determineIfValidFilePattern()");

    let result = false;

    for (const fileMatchingPattern of positiveFileMatchingPatterns) {
      if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
        result = true;
      }
    }

    if (result) {
      for (const fileMatchingPattern of negativeFileMatchingPatterns) {
        if (
          this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)
        ) {
          result = false;
        }
      }

      if (!result) {
        for (const fileMatchingPattern of doubleNegativeFileMatchingPatterns) {
          if (
            this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)
          ) {
            result = true;
          }
        }
      }
    }

    return result;
  }

  private performGlobCheck(
    fileName: string,
    fileMatchingPattern: string,
  ): boolean {
    this._logger.logDebug("* CodeMetrics.performGlobCheck()");

    return (
      minimatch.match(
        [fileName],
        fileMatchingPattern,
        CodeMetrics._minimatchOptions,
      ).length > 0
    );
  }

  private matchFileExtension(fileName: string): boolean {
    this._logger.logDebug("* CodeMetrics.matchFileExtension()");

    const fileExtensionIndex: number = fileName.lastIndexOf(".");
    const fileExtension: string = fileName
      .substring(fileExtensionIndex + 1)
      .toLowerCase();
    const result: boolean = this._inputs.codeFileExtensions.has(fileExtension);

    this._logger.logDebug(
      `File name '${fileName}' has extension '${fileExtension}', which is ${result ? "in" : "ex"}cluded.`,
    );
    return result;
  }

  private constructMetrics(
    matches: CodeFileMetricInterface[],
    nonMatches: CodeFileMetricInterface[],
    nonMatchesToComment: CodeFileMetricInterface[],
  ): void {
    this._logger.logDebug("* CodeMetrics.constructMetrics()");

    let productCode = 0;
    let testCode = 0;
    let ignoredCode = 0;

    for (const entry of matches) {
      if (
        /.*(?:(?:T|t)est|TEST).*/u.test(entry.fileName) ||
        /.*\.spec\..*/iu.test(path.basename(entry.fileName))
      ) {
        this._logger.logDebug(
          `Test File: ${entry.fileName} (${String(entry.linesAdded)} lines)`,
        );
        testCode += entry.linesAdded;
      } else {
        this._logger.logDebug(
          `Product File: ${entry.fileName} (${String(entry.linesAdded)} lines)`,
        );
        productCode += entry.linesAdded;
      }
    }

    for (const entry of nonMatches) {
      this._logger.logDebug(
        `Ignored File: ${entry.fileName} (${String(entry.linesAdded)} lines)`,
      );
      ignoredCode += entry.linesAdded;
    }

    for (const entry of nonMatchesToComment) {
      if (
        entry.linesAdded > 0 ||
        (entry.linesAdded === 0 && entry.linesDeleted === 0)
      ) {
        this._logger.logDebug(
          `Ignored File: ${entry.fileName} (${String(entry.linesAdded)} lines), comment to be added`,
        );
        ignoredCode += entry.linesAdded;
        this._filesNotRequiringReview.push(entry.fileName);
      } else {
        this._logger.logDebug(
          `Ignored File: ${entry.fileName} (deleted), comment to be added`,
        );
        this._deletedFilesNotRequiringReview.push(entry.fileName);
      }
    }

    this._metrics = new CodeMetricsData(productCode, testCode, ignoredCode);
  }

  private createFileMetricsMap(input: string): CodeFileMetricInterface[] {
    this._logger.logDebug("* CodeMetrics.createFileMetricsMap()");

    // Removing the ending that can be created by test mocks.
    const endingToRemove = "\r\nrc:0\r\nsuccess:true";
    let modifiedInput: string = input;
    if (modifiedInput.endsWith(endingToRemove)) {
      modifiedInput = modifiedInput.substring(
        0,
        input.length - endingToRemove.length,
      );
    }

    // Condense file and folder names that were renamed, e.g., F{a => i}leT{b => e}st.d{c => l}l".
    const lines: string[] = modifiedInput.split("\n");

    const result: CodeFileMetricInterface[] = [];
    for (const line of lines) {
      const elements: string[] = line.split("\t");
      if (
        typeof elements[0] === "undefined" ||
        typeof elements[1] === "undefined" ||
        typeof elements[2] === "undefined"
      ) {
        throw new RangeError(
          `The number of elements '${String(elements.length)}' in '${line}' in input '${modifiedInput}' did not match the expected 3.`,
        );
      }

      // Condense file and folder names that were renamed, e.g., "F{a => i}leT{b => e}st.d{c => l}l" or "FaleTbst.dcl => FileTest.dll".
      const fileName: string = elements[2]
        .replace(/\{.*? => (?<newName>[^}]+?)\}/gu, "$<newName>")
        .replace(/.*? => (?<newName>[^}]+?)/gu, "$<newName>");

      result.push({
        fileName,
        linesAdded: CodeMetrics.parseChangedLines(elements[0], line, "added"),
        linesDeleted: CodeMetrics.parseChangedLines(
          elements[1],
          line,
          "deleted",
        ),
      });
    }

    return result;
  }

  private initializeIsSufficientlyTested(): void {
    this._logger.logDebug("* CodeMetrics.initializeIsSufficientlyTested()");

    if (this._inputs.testFactor === null) {
      this._isSufficientlyTested = null;
    } else {
      this._isSufficientlyTested =
        this._metrics.testCode >=
        this._metrics.productCode * this._inputs.testFactor;
    }
  }

  private initializeSizeIndicator(): void {
    this._logger.logDebug("* CodeMetrics.initializeSizeIndicator()");

    this._size = this.calculateSize();
    let testIndicator = "";
    if (this._isSufficientlyTested !== null) {
      if (this._isSufficientlyTested) {
        testIndicator = this._runnerInvoker.loc(
          "metrics.codeMetrics.titleTestsSufficient",
        );
      } else {
        testIndicator = this._runnerInvoker.loc(
          "metrics.codeMetrics.titleTestsInsufficient",
        );
      }
    }

    this._sizeIndicator = this._runnerInvoker.loc(
      "metrics.codeMetrics.titleSizeIndicatorFormat",
      this._size,
      testIndicator,
    );
  }

  private calculateSize(): string {
    this._logger.logDebug("* CodeMetrics.calculateSize()");

    const indexXS = 0;
    const indexS = 1;
    const indexM = 2;
    const indexL = 3;
    const indexXL = 4;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Required to be a compile-time constant.
    const indicators: FixedLengthArrayInterface<(prefix: string) => string, 5> =
      [
        (): string =>
          this._runnerInvoker.loc("metrics.codeMetrics.titleSizeXS"),
        (): string => this._runnerInvoker.loc("metrics.codeMetrics.titleSizeS"),
        (): string => this._runnerInvoker.loc("metrics.codeMetrics.titleSizeM"),
        (): string => this._runnerInvoker.loc("metrics.codeMetrics.titleSizeL"),
        (prefix: string): string =>
          this._runnerInvoker.loc("metrics.codeMetrics.titleSizeXL", prefix),
      ];

    // Calculate the smaller size.
    if (this._metrics.productCode < this._inputs.baseSize) {
      return indicators[indexXS]("");
    }

    // Calculate the larger sizes.
    let index = indexS;
    let result: string = indicators[indexS]("");
    let currentSize: number = this._inputs.baseSize * this._inputs.growthRate;
    while (this._metrics.productCode >= currentSize) {
      currentSize *= this._inputs.growthRate;
      index += 1;

      if (index === indexM || index === indexL || index === indexXL) {
        result = indicators[index]("");
      } else {
        result = indicators[indexXL](
          (index - indicators.length + indexM).toLocaleString(),
        );
      }
    }

    return result;
  }
}
