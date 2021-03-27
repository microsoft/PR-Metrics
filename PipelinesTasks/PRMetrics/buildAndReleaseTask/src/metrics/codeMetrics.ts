// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FixedLengthArray } from '../utilities/fixedLengthArray'
import { IFileCodeMetric } from './iFileCodeMetric'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
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
  private _ignoredFilesWithLinesAdded: string[] = []
  private _ignoredFilesWithoutLinesAdded: string[] = []
  private _size: string = ''
  private _sizeIndicator: string = ''
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)

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
   * Gets the collection of ignored files with added lines.
   * @returns The collection of ignored files with added lines.
   */
  public get ignoredFilesWithLinesAdded (): string[] {
    this._taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')

    this.initialize()
    return this._ignoredFilesWithLinesAdded
  }

  /**
   * Gets the collection of ignored files without added lines.
   * @returns The collection of ignored files without added lines.
   */
  public get ignoredFilesWithoutLinesAdded (): string[] {
    this._taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')

    this.initialize()
    return this._ignoredFilesWithoutLinesAdded
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
    return this._metrics.productCode <= this._inputs.baseSize
  }

  /**
   * Gets a value indicating whether the pull request has sufficient test coverage.
   * @returns A value indicating whether the pull request has sufficient test coverage. If the test coverage is not being checked, the value will be `null`.
   */
  public get isSufficientlyTested (): boolean | null {
    this._taskLibWrapper.debug('* CodeMetrics.isSufficientlyTested')

    if (this._inputs.testFactor === null) {
      return null
    }

    return this._metrics.testCode >= (this._metrics.productCode * this._inputs.testFactor)
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

    this.initializeMetrics(gitDiffSummary)
    this.initializeSizeIndicator()
    this._isInitialized = true
  }

  private initializeMetrics (gitDiffSummary: string) {
    this._taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')

    let lines: string[] = gitDiffSummary.split('\n')

    // Condense file and folder names that were renamed e.g. F{a => i}leT{b => e}st.d{c => l}l".
    lines = lines.map(line => line.replace(/{.*? => ([^}]+?)}/g, '$1'))

    const matches: string[] = []
    const nonMatchesWithComment: string[] = []
    const nonMatchesWithoutComment: string[] = []

    // Check for glob matches.
    lines.forEach((line: string): void => {
      const isValidFilePattern: boolean = taskLib.match([line], this._inputs.fileMatchingPatterns).length > 0
      const isValidFileExtension: boolean = this.matchFileExtension(line)
      if (isValidFilePattern && isValidFileExtension) {
        matches.push(line)
      } else if (!isValidFilePattern) {
        nonMatchesWithComment.push(line)
      } else {
        nonMatchesWithoutComment.push(line)
      }
    })

    this.constructMetrics(matches, nonMatchesWithComment, nonMatchesWithoutComment)
  }

  private matchFileExtension (line: string): boolean {
    this._taskLibWrapper.debug('* CodeMetrics.matchFileExtension()')

    const fileExtension: string | undefined = line.split('.').pop()
    if (!fileExtension) {
      return false
    }

    return this._inputs.codeFileExtensions.has(fileExtension)
  }

  private constructMetrics (matches: string[], nonMatchesWithComment: string[], nonMatchesWithoutComment: string[]): void {
    this._taskLibWrapper.debug('* CodeMetrics.constructMetrics()')

    let productCode: number = 0
    let testCode: number = 0
    let ignoredCode: number = 0

    const matchesMap: IFileCodeMetric[] = this.createFileMetricsMap(matches)
    matchesMap.forEach((entry: IFileCodeMetric): void => {
      if (entry.value !== '-') {
        const value: number = parseInt(entry.value)
        if (/.*test.*/i.test(entry.fileName)) {
          testCode += value
        } else {
          productCode += value
        }
      }
    })

    const nonMatchesWithCommentMap: IFileCodeMetric[] = this.createFileMetricsMap(nonMatchesWithComment)
    nonMatchesWithCommentMap.forEach((entry: IFileCodeMetric): void => {
      if (entry.value !== '-') {
        ignoredCode += parseInt(entry.value)
        this._ignoredFilesWithLinesAdded.push(entry.fileName)
      } else {
        this._ignoredFilesWithoutLinesAdded.push(entry.fileName)
      }
    })

    const nonMatchesWithoutCommentMap: IFileCodeMetric[] = this.createFileMetricsMap(nonMatchesWithoutComment)
    nonMatchesWithoutCommentMap.forEach((entry: IFileCodeMetric): void => {
      if (entry.value !== '-') {
        ignoredCode += parseInt(entry.value)
      }
    })

    this._metrics = new CodeMetricsData(productCode, testCode, ignoredCode)
  }

  private createFileMetricsMap (input: string[]): IFileCodeMetric[] {
    this._taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')

    const result: IFileCodeMetric[] = []
    input.forEach((line: string): void => {
      const elements: string[] = line.split(/\s+/)

      const fileName: string = Validator.validateField(elements[2], 'fileName', 'CodeMetrics.createFileMetricsMap()')
      const value: string = Validator.validateField(elements[0], 'value', 'CodeMetrics.createFileMetricsMap()')
      result.push({
        fileName: fileName,
        value: value
      })
    })

    return result
  }

  private initializeSizeIndicator (): void {
    this._taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')

    this._size = this.calculateSize()
    let testIndicator: string = ''
    if (this.isSufficientlyTested !== null) {
      if (this.isSufficientlyTested) {
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

    let result: string = indicators[1]('')
    let currentSize: number = this._inputs.baseSize
    let index: number = 1

    if (this._metrics.subtotal === 0) {
      result = indicators[0]('')
    } else {
      // Calculate the smaller sizes.
      if (this._metrics.productCode < this._inputs.baseSize / this._inputs.growthRate) {
        result = indicators[0]('')
      }

      // Calculate the larger sizes.
      if (this._metrics.productCode > this._inputs.baseSize) {
        while (this._metrics.productCode > currentSize) {
          index++
          currentSize *= this._inputs.growthRate

          if (index < indicators.length) {
            result = indicators[index]!('')
          } else {
            result = indicators[indicators.length - 1]!((index - indicators.length + 2).toLocaleString())
          }
        }
      }
    }

    return result
  }
}
