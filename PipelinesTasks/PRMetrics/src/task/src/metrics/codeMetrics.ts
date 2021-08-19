// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CodeFileMetric } from './codeFileMetric'
import { FixedLengthArray } from '../utilities/fixedLengthArray'
import { singleton } from 'tsyringe'
import * as taskLib from 'azure-pipelines-task-lib/task'
import CodeMetricsData from './codeMetricsData'
import GitInvoker from '../git/gitInvoker'
import Inputs from './inputs'
import Logger from '../utilities/logger'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for computing metrics for software code in pull requests.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class CodeMetrics {
  private _gitInvoker: GitInvoker
  private _inputs: Inputs
  private _logger: Logger
  private _taskLibWrapper: TaskLibWrapper

  private _isInitialized: boolean = false
  private _filesNotRequiringReview: string[] = []
  private _deletedFilesNotRequiringReview: string[] = []
  private _size: string = ''
  private _sizeIndicator: string = ''
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)
  private _isSufficientlyTested: boolean | null = null

  /**
   * Initializes a new instance of the `CodeMetrics` class.
   * @param gitInvoker The Git invoker.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  constructor (gitInvoker: GitInvoker, inputs: Inputs, logger: Logger, taskLibWrapper: TaskLibWrapper) {
    this._gitInvoker = gitInvoker
    this._inputs = inputs
    this._logger = logger
    this._taskLibWrapper = taskLibWrapper
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
    if (!gitDiffSummary) {
      throw Error('The Git diff summary is empty.')
    }

    this._isInitialized = true
    this.initializeMetrics(gitDiffSummary)
    this.initializeIsSufficientlyTested()
    this.initializeSizeIndicator()
  }

  private initializeMetrics (gitDiffSummary: string) {
    this._logger.logDebug('* CodeMetrics.initializeMetrics()')

    const codeFileMetrics: CodeFileMetric[] = this.createFileMetricsMap(gitDiffSummary)

    const matches: CodeFileMetric[] = []
    const nonMatches: CodeFileMetric[] = []
    const nonMatchesToComment: CodeFileMetric[] = []

    // Check for glob matches.
    codeFileMetrics.forEach((codeFileMetric: CodeFileMetric): void => {
      const isValidFilePattern: boolean = taskLib.match([codeFileMetric.fileName], this._inputs.fileMatchingPatterns).length > 0
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
      if (/.*test.*/i.test(entry.fileName)) {
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
      if (elements.length !== 3) {
        throw RangeError(`The number of elements '${elements.length}' in '${line}' in input '${input}' did not match the expected 3.`)
      }

      // Condense file and folder names that were renamed e.g. "F{a => i}leT{b => e}st.d{c => l}l" or "FaleTbst.dcl => FileTest.dll".
      const fileName: string = elements[2]!
        .replace(/{.*? => ([^}]+?)}/g, '$1')
        .replace(/.*? => ([^}]+?)/g, '$1')

      result.push({
        fileName: fileName,
        linesAdded: this.parseChangedLines(elements[0]!, line, 'added'),
        linesDeleted: this.parseChangedLines(elements[1]!, line, 'deleted')
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
        testIndicator = this._taskLibWrapper.loc('metrics.codeMetrics.titleTestsSufficient')
      } else {
        testIndicator = this._taskLibWrapper.loc('metrics.codeMetrics.titleTestsInsufficient')
      }
    }

    this._sizeIndicator = this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', this._size, testIndicator)
  }

  private calculateSize (): string {
    this._logger.logDebug('* CodeMetrics.calculateSize()')

    const indicators: FixedLengthArray<((prefix: string) => string), 5> = [
      (_: string): string => this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeXS'),
      (_: string): string => this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeS'),
      (_: string): string => this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeM'),
      (_: string): string => this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeL'),
      (prefix: string): string => this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', prefix)
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

      if (index < indicators.length) {
        result = indicators[index]!('')
      } else {
        result = indicators[indicators.length - 1]!((index - indicators.length + 2).toLocaleString())
      }
    }

    return result
  }
}
