// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FixedLengthArray } from '../utilities/fixedLengthArray'
import Metrics from './metrics'
import Parameters from './parameters'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for computing metrics for software code in pull requests.
 */
export default class CodeMetrics {
  private _parameters: Parameters
  private _taskLibWrapper: TaskLibWrapper

  private _ignoredFilesWithLinesAdded: string[] = []
  private _ignoredFilesWithoutLinesAdded: string[] = []
  private _sizeIndicator: string = ''
  private _metrics: Metrics = new Metrics(0, 0, 0)

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
  public get metrics (): Metrics {
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
    const fileMetrics: Map<string, number> = this.extractFileMetrics(lines)
    const filteredFiles: string[] = this.filterFiles(fileMetrics)
    this.constructMetrics(fileMetrics, filteredFiles)
  }

  private extractFileMetrics (lines: string[]): Map<string, number> {
    this._taskLibWrapper.debug('* CodeMetrics.extractFileMetrics()')

    const result: Map<string, number> = new Map<string, number>()

    // Skip the last line as it will always be empty.
    for (let i: number = 0; i < lines.length - 1; i++) {
      let elements: string[] = []
      const line: string | undefined = lines[i]
      if (line) {
        elements = line.split('s')
      }

      let fileName: string = ''
      for (let j: number = 2; j < elements.length; j++) {
        if (elements[j] !== '=>') {
          const element: string = elements[j] || ''
          const lastIndex: number = element.indexOf('{')

          if (lastIndex >= 0) {
            elements[j] = element.substring(0, lastIndex)
          }

          fileName += element
        }
      }

      if (elements[0] !== '-') {
        fileName = fileName.replace('}', '')
        result.set(fileName, parseInt(elements[0]!))
      }
    }

    return result
  }

  private filterFiles (fileMetrics: Map<string, number>): string[] {
    this._taskLibWrapper.debug('* CodeMetrics.filterFiles()')

    return [...fileMetrics.keys()].filter((item: string): boolean => {
      let matchFound: boolean = false

      this._parameters.fileMatchingPatterns.every((entry: string): boolean => {
        if (new RegExp(`${entry}`, 'i').test(item)) {
          matchFound = true
          return false
        }

        return true
      })

      return matchFound
    })
  }

  private constructMetrics (fileMetrics: Map<string, number>, filteredFiles: string[]): void {
    this._taskLibWrapper.debug('* CodeMetrics.constructMetrics()')

    let filesFilteredIndex: number = 0
    let productCode: number = 0
    let testCode: number = 0
    let ignoredCode: number = 0
    fileMetrics.forEach((value: number, key: string): void => {
      // The next if statement works on the principal that the result from the match operation is guaranteed to be in the same order as the input.
      if (filteredFiles !== null && filesFilteredIndex < filteredFiles.length && filteredFiles[filesFilteredIndex] === key) {
        filesFilteredIndex++

        let updatedMetrics: boolean = false
        for (const codeFileExtension in this._parameters.codeFileExtensions) {
          if (new RegExp(`${codeFileExtension}`, 'i').test(key)) {
            if (/.*Test.*/i.test(key)) {
              testCode += value
            } else {
              productCode += value
            }

            updatedMetrics = true
            break
          }
        }

        if (!updatedMetrics) {
          ignoredCode += value
        }
      } else {
        if (value !== 0) {
          this._ignoredFilesWithLinesAdded.push(key)
        } else {
          this._ignoredFilesWithoutLinesAdded.push(key)
        }

        ignoredCode += value
      }
    })

    this._metrics = new Metrics(productCode, testCode, ignoredCode)
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
