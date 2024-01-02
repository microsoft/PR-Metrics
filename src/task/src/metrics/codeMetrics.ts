// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as minimatch from 'minimatch'
import * as path from 'path'
import { singleton } from 'tsyringe'
import GitInvoker from '../git/gitInvoker'
import RunnerInvoker from '../runners/runnerInvoker'
import { FixedLengthArray } from '../utilities/fixedLengthArray'
import Logger from '../utilities/logger'
import { CodeFileMetric } from './codeFileMetric'
import CodeMetricsData from './codeMetricsData'
import Inputs from './inputs'

/**
 * A class for computing metrics for software code in pull requests.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class CodeMetrics {
  private readonly _gitInvoker: GitInvoker
  private readonly _inputs: Inputs
  private readonly _logger: Logger
  private readonly _runnerInvoker: RunnerInvoker

  private static readonly _minimatchOptions: minimatch.MinimatchOptions = {
    dot: true
  }

  private _isInitialized: boolean = false
  private readonly _filesNotRequiringReview: string[] = []
  private readonly _deletedFilesNotRequiringReview: string[] = []
  private _size: string = ''
  private _sizeIndicator: string = ''
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)
  private _isSufficientlyTested: boolean | null = null

  /**
   * Initializes a new instance of the `CodeMetrics` class.
   * @param gitInvoker The Git invoker.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  constructor (gitInvoker: GitInvoker, inputs: Inputs, logger: Logger, runnerInvoker: RunnerInvoker) {
    this._gitInvoker = gitInvoker
    this._inputs = inputs
    this._logger = logger
    this._runnerInvoker = runnerInvoker
  }

  /**
   * Gets the collection of files not requiring review to which to add a comment.
   * @returns A promise containing the collection of files not requiring review.
   */
  public async getFilesNotRequiringReview (): Promise<string[]> {
    this._logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')

    await this.initialize()
    return this._filesNotRequiringReview
  }

  /**
   * Gets the collection of deleted files not requiring review to which to add a comment.
   * @returns A promise containing the collection of deleted files not requiring review.
   */
  public async getDeletedFilesNotRequiringReview (): Promise<string[]> {
    this._logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')

    await this.initialize()
    return this._deletedFilesNotRequiringReview
  }

  /**
   * Gets the size of the pull request – XS, S, M, etc.
   * @returns A promise containing the size of the pull request.
   */
  public async getSize (): Promise<string> {
    this._logger.logDebug('* CodeMetrics.getSize()')

    await this.initialize()
    return this._size
  }

  /**
   * Gets the size indicator comprising the size and test coverage indicator, which will form part of the title.
   * @returns A promise containing the size indicator.
   */
  public async getSizeIndicator (): Promise<string> {
    this._logger.logDebug('* CodeMetrics.getSizeIndicator()')

    await this.initialize()
    return this._sizeIndicator
  }

  /**
   * Gets the collection of pull request code metrics.
   * @returns A promise containing the collection of pull request code metrics.
   */
  public async getMetrics (): Promise<CodeMetricsData> {
    this._logger.logDebug('* CodeMetrics.getMetrics()')

    await this.initialize()
    return this._metrics
  }

  /**
   * Gets a value indicating whether the pull request is small or extra small.
   * @returns A promise indicating whether the pull request is small or extra small.
   */
  public async isSmall (): Promise<boolean> {
    this._logger.logDebug('* CodeMetrics.isSmall()')

    await this.initialize()
    return this._metrics.productCode < (this._inputs.baseSize * this._inputs.growthRate)
  }

  /**
   * Gets a value indicating whether the pull request has sufficient test coverage.
   * @returns A promise indicating whether the pull request has sufficient test coverage. If the test coverage is not being checked, the value will be `null`.
   */
  public async isSufficientlyTested (): Promise<boolean | null> {
    this._logger.logDebug('* CodeMetrics.isSufficientlyTested()')

    await this.initialize()
    return this._isSufficientlyTested
  }

  private async initialize (): Promise<void> {
    this._logger.logDebug('* CodeMetrics.initialize()')

    if (this._isInitialized) {
      return
    }

    const gitDiffSummary: string = (await this._gitInvoker.getDiffSummary()).trim()
    if (gitDiffSummary === '') {
      throw Error('The Git diff summary is empty.')
    }

    this._isInitialized = true
    this.initializeMetrics(gitDiffSummary)
    this.initializeIsSufficientlyTested()
    this.initializeSizeIndicator()
  }

  private initializeMetrics (gitDiffSummary: string): void {
    this._logger.logDebug('* CodeMetrics.initializeMetrics()')

    const codeFileMetrics: CodeFileMetric[] = this.createFileMetricsMap(gitDiffSummary)

    const matches: CodeFileMetric[] = []
    const nonMatches: CodeFileMetric[] = []
    const nonMatchesToComment: CodeFileMetric[] = []

    // Check for glob matches.
    codeFileMetrics.forEach((codeFileMetric: CodeFileMetric): void => {
      let isValidFilePattern: boolean = false

      // Iterate through the list of patterns. First, check for positive matches. Next, if one of the positive matches
      // is overridden by a negative match, remove it from consideration. Finally, check for double negative matches,
      // which override the negative matches.
      const positiveFileMatchingPatterns: string[] = []
      const negativeFileMatchingPatterns: string[] = []
      const doubleNegativeFileMatchingPatterns: string[] = []
      this._inputs.fileMatchingPatterns.forEach((fileMatchingPattern: string): void => {
        if (fileMatchingPattern.startsWith('!!')) {
          doubleNegativeFileMatchingPatterns.push(fileMatchingPattern.substring(2))
        } else if (fileMatchingPattern.startsWith('!')) {
          negativeFileMatchingPatterns.push(fileMatchingPattern.substring(1))
        } else {
          positiveFileMatchingPatterns.push(fileMatchingPattern)
        }
      })

      positiveFileMatchingPatterns.forEach((fileMatchingPattern: string): void => {
        if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
          isValidFilePattern = true
        }
      })

      if (isValidFilePattern) {
        negativeFileMatchingPatterns.forEach((fileMatchingPattern: string): void => {
          if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
            isValidFilePattern = false
          }
        })

        if (!isValidFilePattern) {
          doubleNegativeFileMatchingPatterns.forEach((fileMatchingPattern: string): void => {
            if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
              isValidFilePattern = true
            }
          })
        }
      }

      const isValidFileExtension: boolean = this.matchFileExtension(codeFileMetric.fileName)
      if (isValidFilePattern && isValidFileExtension) {
        matches.push(codeFileMetric)
      } else if (!isValidFilePattern) {
        nonMatchesToComment.push(codeFileMetric)
      } else {
        nonMatches.push(codeFileMetric)
      }
    })

    this.constructMetrics(matches, nonMatches, nonMatchesToComment)
  }

  private performGlobCheck (fileName: string, fileMatchingPattern: string): boolean {
    this._logger.logDebug('* CodeMetrics.performGlobCheck()')

    return minimatch.match([fileName], fileMatchingPattern, CodeMetrics._minimatchOptions).length > 0
  }

  private matchFileExtension (fileName: string): boolean {
    this._logger.logDebug('* CodeMetrics.matchFileExtension()')

    const fileExtensionIndex: number = fileName.lastIndexOf('.')
    const fileExtension: string = fileName.substring(fileExtensionIndex + 1).toLowerCase()
    const result: boolean = this._inputs.codeFileExtensions.has(fileExtension)

    this._logger.logDebug(`File name '${fileName}' has extension '${fileExtension}', which is ${result ? 'in' : 'ex'}cluded.`)
    return result
  }

  private constructMetrics (matches: CodeFileMetric[], nonMatches: CodeFileMetric[], nonMatchesToComment: CodeFileMetric[]): void {
    this._logger.logDebug('* CodeMetrics.constructMetrics()')

    let productCode: number = 0
    let testCode: number = 0
    let ignoredCode: number = 0

    matches.forEach((entry: CodeFileMetric): void => {
      if (/.*((T|t)est|TEST).*/.test(entry.fileName) || /.*\.spec\..*/i.test(path.basename(entry.fileName))) {
        this._logger.logDebug(`Test File: ${entry.fileName} (${entry.linesAdded} lines)`)
        testCode += entry.linesAdded
      } else {
        this._logger.logDebug(`Product File: ${entry.fileName} (${entry.linesAdded} lines)`)
        productCode += entry.linesAdded
      }
    })

    nonMatches.forEach((entry: CodeFileMetric): void => {
      this._logger.logDebug(`Ignored File: ${entry.fileName} (${entry.linesAdded} lines)`)
      ignoredCode += entry.linesAdded
    })

    nonMatchesToComment.forEach((entry: CodeFileMetric): void => {
      if (entry.linesAdded > 0 || (entry.linesAdded === 0 && entry.linesDeleted === 0)) {
        this._logger.logDebug(`Ignored File: ${entry.fileName} (${entry.linesAdded} lines), comment to be added`)
        ignoredCode += entry.linesAdded
        this._filesNotRequiringReview.push(entry.fileName)
      } else {
        this._logger.logDebug(`Ignored File: ${entry.fileName} (deleted), comment to be added`)
        this._deletedFilesNotRequiringReview.push(entry.fileName)
      }
    })

    this._metrics = new CodeMetricsData(productCode, testCode, ignoredCode)
  }

  private createFileMetricsMap (input: string): CodeFileMetric[] {
    this._logger.logDebug('* CodeMetrics.createFileMetricsMap()')

    // Removing the ending that can be created by test mocks.
    const endingToRemove: string = '\r\nrc:0\r\nsuccess:true'
    if (input.endsWith(endingToRemove)) {
      input = input.substring(0, input.length - endingToRemove.length)
    }

    // Condense file and folder names that were renamed e.g. F{a => i}leT{b => e}st.d{c => l}l".
    const lines: string[] = input.split('\n')

    const result: CodeFileMetric[] = []
    lines.forEach((line: string): void => {
      const elements: string[] = line.split('\t')
      if (elements[0] === undefined || elements[1] === undefined || elements[2] === undefined) {
        throw RangeError(`The number of elements '${elements.length}' in '${line}' in input '${input}' did not match the expected 3.`)
      }

      // Condense file and folder names that were renamed e.g. "F{a => i}leT{b => e}st.d{c => l}l" or "FaleTbst.dcl => FileTest.dll".
      const fileName: string = elements[2]
        .replace(/{.*? => ([^}]+?)}/g, '$1')
        .replace(/.*? => ([^}]+?)/g, '$1')

      result.push({
        fileName,
        linesAdded: this.parseChangedLines(elements[0], line, 'added'),
        linesDeleted: this.parseChangedLines(elements[1], line, 'deleted')
      })
    })

    return result
  }

  private parseChangedLines (element: string, line: string, category: string): number {
    // Parse the number of lines changed. For binary files, the lines will be '-'.
    let result: number
    if (element === '-') {
      result = 0
    } else {
      result = parseInt(element)
      if (isNaN(result)) {
        throw Error(`Could not parse ${category} lines '${element}' from line '${line}'.`)
      }
    }

    return result
  }

  private initializeIsSufficientlyTested (): void {
    this._logger.logDebug('* CodeMetrics.initializeIsSufficientlyTested()')

    if (this._inputs.testFactor === null) {
      this._isSufficientlyTested = null
    } else {
      this._isSufficientlyTested = this._metrics.testCode >= (this._metrics.productCode * this._inputs.testFactor)
    }
  }

  private initializeSizeIndicator (): void {
    this._logger.logDebug('* CodeMetrics.initializeSizeIndicator()')

    this._size = this.calculateSize()
    let testIndicator: string = ''
    if (this._isSufficientlyTested !== null) {
      if (this._isSufficientlyTested) {
        testIndicator = this._runnerInvoker.loc('metrics.codeMetrics.titleTestsSufficient')
      } else {
        testIndicator = this._runnerInvoker.loc('metrics.codeMetrics.titleTestsInsufficient')
      }
    }

    this._sizeIndicator = this._runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', this._size, testIndicator)
  }

  private calculateSize (): string {
    this._logger.logDebug('* CodeMetrics.calculateSize()')

    const indicators: FixedLengthArray<((prefix: string) => string), 5> = [
      (_: string): string => this._runnerInvoker.loc('metrics.codeMetrics.titleSizeXS'),
      (_: string): string => this._runnerInvoker.loc('metrics.codeMetrics.titleSizeS'),
      (_: string): string => this._runnerInvoker.loc('metrics.codeMetrics.titleSizeM'),
      (_: string): string => this._runnerInvoker.loc('metrics.codeMetrics.titleSizeL'),
      (prefix: string): string => this._runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', prefix)
    ]

    // Calculate the smaller size.
    if (this._metrics.productCode < this._inputs.baseSize) {
      return indicators[0]('')
    }

    // Calculate the larger sizes.
    let index: number = 1
    let result: string = indicators[1]('')
    let currentSize: number = this._inputs.baseSize * this._inputs.growthRate
    while (this._metrics.productCode >= currentSize) {
      currentSize *= this._inputs.growthRate
      index++

      if (index === 2 || index === 3 || index === 4) {
        result = indicators[index]('')
      } else {
        result = indicators[4]((index - indicators.length + 2).toLocaleString())
      }
    }

    return result
  }
}
