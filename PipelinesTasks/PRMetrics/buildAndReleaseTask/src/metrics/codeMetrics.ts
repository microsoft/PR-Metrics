// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FixedLengthArray } from '../utilities/fixedLengthArray'
import { IFileCodeMetric } from './iFileCodeMetric'
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

    const gitDiffSummary: string = this._gitInvoker.getDiffSummary()
    if (!gitDiffSummary.trim()) {
      throw Error('The Git diff summary was empty.')
    }

    this.initializeMetrics(gitDiffSummary)
    this.initializeSizeIndicator()
    this._isInitialized = true
  }

  // Note: glob match only works with string[]
  private initializeMetrics (gitDiffSummary: string) {
    this._taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')

    let lines: string[] = gitDiffSummary.split('\n')

    // condense file and folder names that were changed e.g. F{a => i}leT{b => e}st.d{c => l}l"
    lines = lines.map(line => line.replace(/{.*? => ([^}]+?)}/gm, '$1'))

    const matches: string[] = []
    const doesNotMatch: string[] = []

    // checks for glob matches
    lines.forEach((line: string): void => {
      // causing bugs
      if (taskLib.match([line], this._inputs.fileMatchingPatterns).length > 0 && this.fileExtensionMatch(line)) {
        matches.push(line)
      } else {
        doesNotMatch.push(line)
      }
    })

    this.constructMetrics(matches, doesNotMatch)
  }

  private fileExtensionMatch (line: string): boolean {
    this._taskLibWrapper.debug('* CodeMetrics.fileExtensionMatch()')

    let found = false

    this._inputs.codeFileExtensions.every((item: string) => {
      if (line.includes(item.replace('*', ''))) {
        found = true
        return false
      }
      return true
    })

    return found
  }

  private constructMetrics (matches: string[], doesNotMatch: string[]): void {
    this._taskLibWrapper.debug('* CodeMetrics.constructMetrics()')

    const matchesMap: IFileCodeMetric[] = this.createFileMetricsMap(matches)

    matchesMap.forEach((entry: IFileCodeMetric) => {
      const value: number = entry.value === '-' ? 0 : parseInt(entry.value)

      if (/.*Test.*/i.test(entry.fileName) || /.*.spec.*/i.test(entry.fileName) || /.*test\/.*/i.test(entry.fileName)) {
        this._testCodeCounter += value
      } else {
        this._productCodeCounter += value
      }
    })

    const doesNotMatchMap: IFileCodeMetric[] = this.createFileMetricsMap(doesNotMatch)

    doesNotMatchMap.forEach((entry: IFileCodeMetric) => {
      if (entry.value !== '-') {
        this._ignoredCodeCounter += parseInt(entry.value)
        this._ignoredFilesWithLinesAdded.push(entry.fileName)
      } else {
        this._ignoredFilesWithoutLinesAdded.push(entry.fileName)
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
      result.push({ fileName: elements[2]!, value: elements[0]! })
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
