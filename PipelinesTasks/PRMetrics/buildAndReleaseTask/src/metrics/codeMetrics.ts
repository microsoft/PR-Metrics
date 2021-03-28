// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FixedLengthArray } from '../utilities/fixedLengthArray'
import { ICodeFileMetric } from './iCodeFileMetric'
import { singleton } from 'tsyringe'
import * as taskLib from 'azure-pipelines-task-lib/task'
import CodeMetricsData from './codeMetricsData'
import GitInvoker from '../git/gitInvoker'
import Inputs from './inputs'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for computing metrics for software code in pull requests.
 */
@singleton()
export default class CodeMetrics {
  private _gitInvoker: GitInvoker
  private _inputs: Inputs
  private _taskLibWrapper: TaskLibWrapper;

  private _isInitialized: boolean = false
  private _ignoredFiles: string[] = []
  private _size: string = ''
  private _sizeIndicator: string = ''
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)
  private _isSufficientlyTested: boolean | null = null

  /**
   * Initializes a new instance of the `CodeMetrics` class.
   * @param gitInvoker The Git invoker.
   * @param inputs The inputs passed to the task.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  constructor (gitInvoker: GitInvoker, inputs: Inputs, taskLibWrapper: TaskLibWrapper) {
    this._gitInvoker = gitInvoker
    this._inputs = inputs
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the collection of ignored files.
   * @returns The collection of ignored files.
   */
  public get ignoredFiles (): string[] {
    this._taskLibWrapper.debug('* CodeMetrics.ignoredFiles')

    this.initialize()
    return this._ignoredFiles
  }

  /**
   * Gets the size.
   * @returns The size.
   */
  public get size (): string {
    this._taskLibWrapper.debug('* CodeMetrics.size')

    this.initialize()
    return this._size
  }

  /**
   * Gets the size indicator, which will form part of the title.
   * @returns The size indicator.
   */
  public get sizeIndicator (): string {
    this._taskLibWrapper.debug('* CodeMetrics.sizeIndicator')

    this.initialize()
    return this._sizeIndicator
  }

  /**
   * Gets the collection of pull request metrics.
   * @returns The collection of pull request metrics.
   */
  public get metrics (): CodeMetricsData {
    this._taskLibWrapper.debug('* CodeMetrics.metrics')

    this.initialize()
    return this._metrics
  }

  /**
   * Gets a value indicating whether the pull request is small or extra small.
   * @returns A value indicating whether the pull request is small or extra small.
   */
  public get isSmall (): boolean {
    this._taskLibWrapper.debug('* CodeMetrics.isSmall')

    this.initialize()
    return this._metrics.productCode < (this._inputs.baseSize * this._inputs.growthRate)
  }

  /**
   * Gets a value indicating whether the pull request has sufficient test coverage.
   * @returns A value indicating whether the pull request has sufficient test coverage. If the test coverage is not being checked, the value will be `null`.
   */
  public get isSufficientlyTested (): boolean | null {
    this._taskLibWrapper.debug('* CodeMetrics.isSufficientlyTested')

    this.initialize()
    return this._isSufficientlyTested
  }

  private initialize (): void {
    this._taskLibWrapper.debug('* CodeMetrics.initialize()')

    if (this._isInitialized) {
      return
    }

    const gitDiffSummary: string = this._gitInvoker.getDiffSummary().trim()
    if (!gitDiffSummary) {
      throw Error('The Git diff summary is empty.')
    }

    this._isInitialized = true
    this.initializeMetrics(gitDiffSummary)
    this.initializeIsSufficientlyTested()
    this.initializeSizeIndicator()
  }

  private initializeMetrics (gitDiffSummary: string) {
    this._taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')

    const codeFileMetrics: ICodeFileMetric[] = this.createFileMetricsMap(gitDiffSummary)

    const matches: ICodeFileMetric[] = []
    const nonMatchesWithComment: ICodeFileMetric[] = []
    const nonMatchesWithoutComment: ICodeFileMetric[] = []

    // Check for glob matches.
    codeFileMetrics.forEach((codeFileMetric: ICodeFileMetric): void => {
      const isValidFilePattern: boolean = taskLib.match([codeFileMetric.fileName], this._inputs.fileMatchingPatterns).length > 0
      const isValidFileExtension: boolean = this.matchFileExtension(codeFileMetric.fileName)

      if (isValidFilePattern && isValidFileExtension) {
        matches.push(codeFileMetric)
      } else if (!isValidFilePattern) {
        nonMatchesWithComment.push(codeFileMetric)
      } else {
        nonMatchesWithoutComment.push(codeFileMetric)
      }
    })

    this.constructMetrics(matches, nonMatchesWithComment, nonMatchesWithoutComment)
  }

  private matchFileExtension (fileName: string): boolean {
    this._taskLibWrapper.debug('* CodeMetrics.matchFileExtension()')

    const fileExtensionIndex: number = fileName.lastIndexOf('.')
    const fileExtension: string = fileName.substring(fileExtensionIndex + 1).toLowerCase()
    return this._inputs.codeFileExtensions.has(fileExtension)
  }

  private constructMetrics (matches: ICodeFileMetric[], nonMatchesWithComment: ICodeFileMetric[], nonMatchesWithoutComment: ICodeFileMetric[]): void {
    this._taskLibWrapper.debug('* CodeMetrics.constructMetrics()')

    let productCode: number = 0
    let testCode: number = 0
    let ignoredCode: number = 0

    matches.forEach((entry: ICodeFileMetric): void => {
      if (/.*test.*/i.test(entry.fileName)) {
        testCode += entry.linesAdded
      } else {
        productCode += entry.linesAdded
      }
    })

    nonMatchesWithComment.forEach((entry: ICodeFileMetric): void => {
      ignoredCode += entry.linesAdded
      this._ignoredFiles.push(entry.fileName)
    })

    nonMatchesWithoutComment.forEach((entry: ICodeFileMetric): void => {
      ignoredCode += entry.linesAdded
    })

    this._metrics = new CodeMetricsData(productCode, testCode, ignoredCode)
  }

  private createFileMetricsMap (input: string): ICodeFileMetric[] {
    this._taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')

    // Condense file and folder names that were renamed e.g. F{a => i}leT{b => e}st.d{c => l}l".
    const lines: string[] = input.split('\n')

    const result: ICodeFileMetric[] = []
    lines.forEach((line: string): void => {
      const elements: string[] = line.split('\t')
      if (elements.length !== 3) {
        throw RangeError(`The number of elements '${elements.length}' in '${line}' did not match the expected 3.`)
      }

      // Condense file and folder names that were renamed e.g. "F{a => i}leT{b => e}st.d{c => l}l" or "FaleTbst.dcl => FileTest.dll".
      const fileName: string = elements[2]!
        .replace(/{.*? => ([^}]+?)}/g, '$1')
        .replace(/.*? => ([^}]+?)/g, '$1')

      const linesAddedNumber: number = parseInt(elements[0]!)
      if (isNaN(linesAddedNumber)) {
        throw Error(`Could not parse '${elements[0]}' from line '${line}'.`)
      }

      result.push({
        fileName: fileName,
        linesAdded: linesAddedNumber
      })
    })

    return result
  }

  private initializeIsSufficientlyTested (): void {
    this._taskLibWrapper.debug('* CodeMetrics.initializeIsSufficientlyTested()')

    if (this._inputs.testFactor === null) {
      this._isSufficientlyTested = null
    } else {
      this._isSufficientlyTested = this._metrics.testCode >= (this._metrics.productCode * this._inputs.testFactor)
    }
  }

  private initializeSizeIndicator (): void {
    this._taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')

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
    this._taskLibWrapper.debug('* CodeMetrics.calculateSize()')

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
