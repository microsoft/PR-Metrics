// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import CodeMetricsData from './codeMetricsData'
import { FixedLengthArray } from '../utilities/fixedLengthArray'
import Parameters from './parameters'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for computing metrics for software code in pull requests.
 */
export default class CodeMetrics {
  private _parameters: Parameters
  private _taskLibWrapper: TaskLibWrapper;

  private _ignoredFilesWithLinesAdded: string[] = [];
  private _ignoredFilesWithoutLinesAdded: string[] = [];
  private _sizeIndicator: string = '';
  private _metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)

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

    this.initializeMetrics(gitDiffSummary)
    this.initializeSizeIndicator()
  }

  private initializeMetrics (gitDiffSummary: string): void {
    this._taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')

    const lines: string[] = gitDiffSummary.split('\n')
    const fileMetrics: any[] = this.createFileMetricsMap(lines)

    // TODO: rename the ones
    // canuse a map function

    this.constructMetrics(fileMetrics)
  }

  public createFileMetricsMap (input: string[]): any[] {
    this._taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')

    const result: any[] = []

    // Skip the last line as it will always be empty.
    const inputEmptyRemoved: string[] = input.filter(e => e)

    inputEmptyRemoved.forEach((line: string) => {
      const elements: string[] = line.split(/\s+/)
      result.push({ filename: elements[2], value: elements[0] })
    })

    return result
  }

  private filterFiles (input: any[], matchDesired: boolean): any[] {
    this._taskLibWrapper.debug('* CodeMetrics.filterFiles()')
    const result:any[] = []

    input.forEach(entry => {
      const regexp = new RegExp('(' + this._parameters.fileMatchingPatterns.join('|') + ')')

      if (matchDesired && regexp.test(entry.filename)) {
        result.push(entry)
      }

      if (!matchDesired && !regexp.test(entry.filename)) {
        result.push(entry)
      }
    })

    return result
  }

  public constructMetrics (fileMetrics: any[]): void {
    this._taskLibWrapper.debug('* CodeMetrics.constructMetrics()')

    let productCode: number = 0
    let testCode: number = 0
    let ignoredCode: number = 0

    // matches code file extension
    const matches: any[] = this.filterFiles(fileMetrics, true)
    matches.forEach((entry: any) => {
      if (/.*Test.*/i.test(entry.filename)) {
        testCode += parseInt(entry.value)
      } else {
        productCode += parseInt(entry.value)
      }
    })

    // does not match code file extension
    const doesNotMatch = this.filterFiles(fileMetrics, false)
    doesNotMatch.forEach((entry: any) => {
      if (entry.value !== '-') {
        ignoredCode += parseInt(entry.value)
        this._ignoredFilesWithLinesAdded.push(entry.filename)
      } else {
        this._ignoredFilesWithoutLinesAdded.push(entry.filename)
      }
    })

    this._metrics = new CodeMetricsData(productCode, testCode, ignoredCode)
  }

  private initializeSizeIndicator (): void {
    this._taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')

    const size: string = this.calculateSize()
    let testIndicator: string = ''
    if (this.isSufficientlyTested !== null) {
      if (this.isSufficientlyTested) {
        testIndicator = this._taskLibWrapper.loc('updaters.codeMetrics.titleTestsSufficient')
      } else {
        testIndicator = this._taskLibWrapper.loc('updaters.codeMetrics.titleTestsInsufficient')
      }
    }

    this._sizeIndicator = this._taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', size, testIndicator)
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
