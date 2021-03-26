// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as taskLib from 'azure-pipelines-task-lib/task'

import CodeMetricsData from './codeMetricsData'
import { FixedLengthArray } from '../utilities/fixedLengthArray'
import { IFileCodeMetric } from './iFileCodeMetric'
import Parameters from './parameters'
import TaskLibWrapper from '../wrappers/taskLibWrapper'
import { singleton } from 'tsyringe'

/**
 * A class for computing metrics for software code in pull requests.
 */
@singleton()
export default class CodeMetrics {
  private _parameters: Parameters
  private _taskLibWrapper: TaskLibWrapper;

  private _ignoredFilesWithLinesAdded: string[] = []
  private _ignoredFilesWithoutLinesAdded: string[] = []
  private _size: string = ''
  private _sizeIndicator: string = ''
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)

  private _productCodeCounter: number = 0
  private _testCodeCounter: number = 0
  private _ignoredCodeCounter: number = 0

  /**
   * Initializes a new instance of the `CodeMetrics` class.
   * @param parameters The parameters passed to the task.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  constructor (parameters: Parameters, taskLibWrapper: TaskLibWrapper) {
    this._parameters = parameters
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the collection of ignored files with added lines.
   * @returns The collection of ignored files with added lines.
   */
  public get ignoredFilesWithLinesAdded (): string[] {
    this._taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')

    return this._ignoredFilesWithLinesAdded
  }

  /**
   * Gets the collection of ignored files without added lines.
   * @returns The collection of ignored files without added lines.
   */
  public get ignoredFilesWithoutLinesAdded (): string[] {
    this._taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')

    return this._ignoredFilesWithoutLinesAdded
  }

  /**
   * Gets the size.
   * @returns The size.
   */
  public get size (): string {
    this._taskLibWrapper.debug('* CodeMetrics.size')

    return this._size
  }

  /**
   * Gets the size indicator, which will form part of the title.
   * @returns The size indicator.
   */
  public get sizeIndicator (): string {
    this._taskLibWrapper.debug('* CodeMetrics.sizeIndicator')

    return this._sizeIndicator
  }

  /**
   * Gets the collection of pull request metrics.
   * @returns The collection of pull request metrics.
   */
  public get metrics (): CodeMetricsData {
    this._taskLibWrapper.debug('* CodeMetrics.metrics')

    return this._metrics
  }

  /**
   * Gets a value indicating whether the pull request is small or extra small.
   * @returns A value indicating whether the pull request is small or extra small.
   */
  public get isSmall (): boolean {
    this._taskLibWrapper.debug('* CodeMetrics.isSmall')

    return this._metrics.productCode <= this._parameters.baseSize
  }

  /**
   * Gets a value indicating whether the pull request has sufficient test coverage.
   * @returns A value indicating whether the pull request has sufficient test coverage. If the test coverage is not being checked, the value will be `null`.
   */
  public get isSufficientlyTested (): boolean | null {
    this._taskLibWrapper.debug('* CodeMetrics.isSufficientlyTested')

    if (this._parameters.testFactor === null) {
      return null
    }

    return this._metrics.testCode >= (this._metrics.productCode * this._parameters.testFactor)
  }

  /**
   * Initializes the object with the specified Git input.
   * @param gitDiffSummary The Git diff summary input.
   */
  public initialize (gitDiffSummary: string): void {
    this._taskLibWrapper.debug('* CodeMetrics.initialize()')

    if (!gitDiffSummary?.trim()) {
      throw RangeError('The git diff summary was empty.')
    }

    this.initializeMetrics(gitDiffSummary)
    this.initializeSizeIndicator()
  }

  private fileExtensionMatch (line: string): boolean {
    let found = false

    this._parameters.codeFileExtensions.every((item: string) => {
      if (line.includes(item.replace('*', ''))) {
        found = true
        return false
      }
      return true
    })

    return found
  }

  // Note: glob match only works with string[]
  private initializeMetrics (gitDiffSummary: string) {
    this._taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')

    let lines: string[] = gitDiffSummary.split('\n')

    // condense file and folder names that were changed e.g. F{a => i}leT{b => e}st.d{c => l}l"
    lines = lines.map(line => line.replace(/{.*? => ([^}]+?)}/gmi, '$1'))

    const matches: string[] = []
    const doesNotMatch: string[] = []

    // checks for glob matches
    lines.forEach((line: string) => {
      // causing bugs
      if (taskLib.match([line], this._parameters.fileMatchingPatterns).length > 0 && this.fileExtensionMatch(line)) {
        matches.push(line)
      } else {
        doesNotMatch.push(line)
      }
    })

    this.constructMetrics(matches, doesNotMatch)
  }

  private constructMetrics (matches: string[], doesNotMatch: string[]): void {
    this._taskLibWrapper.debug('* CodeMetrics.constructMetrics()')

    const matchesMap: IFileCodeMetric[] = this.createFileMetricsMap(matches)

    matchesMap.forEach((entry: IFileCodeMetric) => {
      if (/.*Test.*/i.test(entry.filename) || /.*.spec.*/i.test(entry.filename) || /.*test\/.*/i.test(entry.filename)) {
        this._testCodeCounter += parseInt(entry.value)
      } else {
        this._productCodeCounter += parseInt(entry.value)
      }
    })

    const doesNotMatchMap: IFileCodeMetric[] = this.createFileMetricsMap(doesNotMatch)

    doesNotMatchMap.forEach((entry: IFileCodeMetric) => {
      if (entry.value !== '-') {
        this._ignoredCodeCounter += parseInt(entry.value)
        this._ignoredFilesWithLinesAdded.push(entry.filename)
      } else {
        this._ignoredFilesWithoutLinesAdded.push(entry.filename)
      }
    })

    this._metrics = new CodeMetricsData(this._productCodeCounter, this._testCodeCounter, this._ignoredCodeCounter)
  }

  private createFileMetricsMap (input: string[]): IFileCodeMetric[] {
    this._taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')

    const result: IFileCodeMetric[] = []

    // Skip the last line as it will always be empty.
    const inputEmptyRemoved: string[] = input.filter(e => e)

    inputEmptyRemoved.forEach((line: string) => {
      const elements: string[] = line.split(/\s+/)
      result.push({ filename: elements[2]!, value: elements[0]! })
    })

    return result
  }

  private initializeSizeIndicator (): void {
    this._taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')

    this._size = this.calculateSize()
    let testIndicator: string = ''
    if (this.isSufficientlyTested !== null) {
      if (this.isSufficientlyTested) {
        testIndicator = this._taskLibWrapper.loc('updaters.codeMetrics.titleTestsSufficient')
      } else {
        testIndicator = this._taskLibWrapper.loc('updaters.codeMetrics.titleTestsInsufficient')
      }
    }

    this._sizeIndicator = this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', this._size, testIndicator)
  }

  private calculateSize (): string {
    this._taskLibWrapper.debug('* CodeMetrics.calculateSize()')

    const indicators: FixedLengthArray<((prefix: string) => string), 5> = [
      (_: string): string => this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeXS'),
      (_: string): string => this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeS'),
      (_: string): string => this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeM'),
      (_: string): string => this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeL'),
      (prefix: string): string => this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeXL', prefix)
    ]

    let result: string = indicators[1]('')
    let currentSize: number = this._parameters.baseSize
    let index: number = 1

    if (this._metrics.subtotal === 0) {
      result = indicators[0]('')
    } else {
      // Calculate the smaller sizes.
      if (this._metrics.productCode < this._parameters.baseSize / this._parameters.growthRate) {
        result = indicators[0]('')
      }

      // Calculate the larger sizes.
      if (this._metrics.productCode > this._parameters.baseSize) {
        while (this._metrics.productCode > currentSize) {
          index++
          currentSize *= this._parameters.growthRate

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
