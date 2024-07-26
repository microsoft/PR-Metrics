/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as minimatch from 'minimatch'
import * as path from 'path'
import { CodeFileMetric } from './codeFileMetric'
import CodeMetricsData from './codeMetricsData'
import { FixedLengthArray } from '../utilities/fixedLengthArray'
import GitInvoker from '../git/gitInvoker'
import Inputs from './inputs'
import Logger from '../utilities/logger'
import RunnerInvoker from '../runners/runnerInvoker'
import { decimalRadix } from '../utilities/constants'
import { singleton } from 'tsyringe'

/**
 * A class for computing metrics for software code in pull requests.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class CodeMetrics {
  private static readonly minimatchOptions: minimatch.MinimatchOptions = {
    dot: true,
  }

  private readonly gitInvoker: GitInvoker
  private readonly inputs: Inputs
  private readonly logger: Logger
  private readonly runnerInvoker: RunnerInvoker

  private isInitialized = false
  private readonly filesNotRequiringReview: string[] = []
  private readonly deletedFilesNotRequiringReview: string[] = []
  private size = ''
  private sizeIndicator = ''
  private metrics: CodeMetricsData = new CodeMetricsData(0, 0, 0)
  private isSufficientlyTestedInternal: boolean | null = null

  /**
   * Initializes a new instance of the `CodeMetrics` class.
   * @param gitInvoker The Git invoker.
   * @param inputs The inputs passed to the task.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (gitInvoker: GitInvoker, inputs: Inputs, logger: Logger, runnerInvoker: RunnerInvoker) {
    this.gitInvoker = gitInvoker
    this.inputs = inputs
    this.logger = logger
    this.runnerInvoker = runnerInvoker
  }

  /**
   * Gets the collection of files not requiring review to which to add a comment.
   * @returns A promise containing the collection of files not requiring review.
   */
  public async getFilesNotRequiringReview (): Promise<string[]> {
    this.logger.logDebug('* CodeMetrics.getFilesNotRequiringReview()')

    await this.initialize()
    return this.filesNotRequiringReview
  }

  /**
   * Gets the collection of deleted files not requiring review to which to add a comment.
   * @returns A promise containing the collection of deleted files not requiring review.
   */
  public async getDeletedFilesNotRequiringReview (): Promise<string[]> {
    this.logger.logDebug('* CodeMetrics.getDeletedFilesNotRequiringReview()')

    await this.initialize()
    return this.deletedFilesNotRequiringReview
  }

  /**
   * Gets the size of the pull request – XS, S, M, etc.
   * @returns A promise containing the size of the pull request.
   */
  public async getSize (): Promise<string> {
    this.logger.logDebug('* CodeMetrics.getSize()')

    await this.initialize()
    return this.size
  }

  /**
   * Gets the size indicator comprising the size and test coverage indicator, which will form part of the title.
   * @returns A promise containing the size indicator.
   */
  public async getSizeIndicator (): Promise<string> {
    this.logger.logDebug('* CodeMetrics.getSizeIndicator()')

    await this.initialize()
    return this.sizeIndicator
  }

  /**
   * Gets the collection of pull request code metrics.
   * @returns A promise containing the collection of pull request code metrics.
   */
  public async getMetrics (): Promise<CodeMetricsData> {
    this.logger.logDebug('* CodeMetrics.getMetrics()')

    await this.initialize()
    return this.metrics
  }

  /**
   * Gets a value indicating whether the pull request is small or extra small.
   * @returns A promise indicating whether the pull request is small or extra small.
   */
  public async isSmall (): Promise<boolean> {
    this.logger.logDebug('* CodeMetrics.isSmall()')

    await this.initialize()
    return this.metrics.productCode < (this.inputs.baseSize * this.inputs.growthRate)
  }

  /**
   * Gets a value indicating whether the pull request has sufficient test coverage.
   * @returns A promise indicating whether the pull request has sufficient test coverage. If the test coverage is not being checked, the value will be `null`.
   */
  public async isSufficientlyTested (): Promise<boolean | null> {
    this.logger.logDebug('* CodeMetrics.isSufficientlyTested()')

    await this.initialize()
    return this.isSufficientlyTestedInternal
  }

  private async initialize (): Promise<void> {
    this.logger.logDebug('* CodeMetrics.initialize()')

    if (this.isInitialized) {
      return
    }

    const gitDiffSummary: string = (await this.gitInvoker.getDiffSummary()).trim()
    if (gitDiffSummary === '') {
      throw new Error('The Git diff summary is empty.')
    }

    this.isInitialized = true
    this.initializeMetrics(gitDiffSummary)
    this.initializeIsSufficientlyTested()
    this.initializeSizeIndicator()
  }

  private initializeMetrics (gitDiffSummary: string): void {
    this.logger.logDebug('* CodeMetrics.initializeMetrics()')

    const codeFileMetrics: CodeFileMetric[] = this.createFileMetricsMap(gitDiffSummary)

    const matches: CodeFileMetric[] = []
    const nonMatches: CodeFileMetric[] = []
    const nonMatchesToComment: CodeFileMetric[] = []

    // Check for glob matches.
    for (const codeFileMetric of codeFileMetrics) {
      let isValidFilePattern = false

      /*
       * Iterate through the list of patterns. First, check for positive matches. Next, if one of the positive matches
       * is overridden by a negative match, remove it from consideration. Finally, check for double negative matches,
       * which override the negative matches.
       */
      const positiveFileMatchingPatterns: string[] = []
      const negativeFileMatchingPatterns: string[] = []
      const doubleNegativeFileMatchingPatterns: string[] = []
      for (const fileMatchingPattern of this.inputs.fileMatchingPatterns){
        if (fileMatchingPattern.startsWith('!!')) {
          doubleNegativeFileMatchingPatterns.push(fileMatchingPattern.substring(2))
        } else if (fileMatchingPattern.startsWith('!')) {
          negativeFileMatchingPatterns.push(fileMatchingPattern.substring(1))
        } else {
          positiveFileMatchingPatterns.push(fileMatchingPattern)
        }
      }

      for (const fileMatchingPattern of positiveFileMatchingPatterns) {
        if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
          isValidFilePattern = true
        }
      }

      if (isValidFilePattern) {
        for (const fileMatchingPattern of negativeFileMatchingPatterns) {
          if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
            isValidFilePattern = false
          }
        }

        if (!isValidFilePattern) {
          for (const fileMatchingPattern of doubleNegativeFileMatchingPatterns) {
            if (this.performGlobCheck(codeFileMetric.fileName, fileMatchingPattern)) {
              isValidFilePattern = true
            }
          }
        }
      }

      const isValidFileExtension: boolean = this.matchFileExtension(codeFileMetric.fileName)
      if (isValidFilePattern && isValidFileExtension) {
        matches.push(codeFileMetric)
      } else if (isValidFilePattern) {
        nonMatches.push(codeFileMetric)
      } else {
        nonMatchesToComment.push(codeFileMetric)
      }
    }

    this.constructMetrics(matches, nonMatches, nonMatchesToComment)
  }

  private performGlobCheck (fileName: string, fileMatchingPattern: string): boolean {
    this.logger.logDebug('* CodeMetrics.performGlobCheck()')

    return minimatch.match([fileName], fileMatchingPattern, CodeMetrics.minimatchOptions).length > 0
  }

  private matchFileExtension (fileName: string): boolean {
    this.logger.logDebug('* CodeMetrics.matchFileExtension()')

    const fileExtensionIndex: number = fileName.lastIndexOf('.')
    const fileExtension: string = fileName.substring(fileExtensionIndex + 1).toLowerCase()
    const result: boolean = this.inputs.codeFileExtensions.has(fileExtension)

    this.logger.logDebug(`File name '${fileName}' has extension '${fileExtension}', which is ${result ? 'in' : 'ex'}cluded.`)
    return result
  }

  private constructMetrics (matches: CodeFileMetric[], nonMatches: CodeFileMetric[], nonMatchesToComment: CodeFileMetric[]): void {
    this.logger.logDebug('* CodeMetrics.constructMetrics()')

    let productCode = 0
    let testCode = 0
    let ignoredCode = 0

    for (const entry of matches) {
      if (/.*(?:(?:T|t)est|TEST).*/u.test(entry.fileName) || /.*\.spec\..*/iu.test(path.basename(entry.fileName))) {
        this.logger.logDebug(`Test File: ${entry.fileName} (${entry.linesAdded.toString()} lines)`)
        testCode += entry.linesAdded
      } else {
        this.logger.logDebug(`Product File: ${entry.fileName} (${entry.linesAdded.toString()} lines)`)
        productCode += entry.linesAdded
      }
    }

    for (const entry of nonMatches) {
      this.logger.logDebug(`Ignored File: ${entry.fileName} (${entry.linesAdded.toString()} lines)`)
      ignoredCode += entry.linesAdded
    }

    for (const entry of nonMatchesToComment) {
      if (entry.linesAdded > 0 || (entry.linesAdded === 0 && entry.linesDeleted === 0)) {
        this.logger.logDebug(`Ignored File: ${entry.fileName} (${entry.linesAdded.toString()} lines), comment to be added`)
        ignoredCode += entry.linesAdded
        this.filesNotRequiringReview.push(entry.fileName)
      } else {
        this.logger.logDebug(`Ignored File: ${entry.fileName} (deleted), comment to be added`)
        this.deletedFilesNotRequiringReview.push(entry.fileName)
      }
    }

    this.metrics = new CodeMetricsData(productCode, testCode, ignoredCode)
  }

  private createFileMetricsMap (input: string): CodeFileMetric[] {
    this.logger.logDebug('* CodeMetrics.createFileMetricsMap()')

    // Removing the ending that can be created by test mocks.
    const endingToRemove = '\r\nrc:0\r\nsuccess:true'
    let modifiedInput: string = input
    if (modifiedInput.endsWith(endingToRemove)) {
      modifiedInput = modifiedInput.substring(0, input.length - endingToRemove.length)
    }

    // Condense file and folder names that were renamed e.g. F{a => i}leT{b => e}st.d{c => l}l".
    const lines: string[] = modifiedInput.split('\n')

    const result: CodeFileMetric[] = []
    for (const line of lines) {
      const elements: string[] = line.split('\t')
      if (elements[0] === undefined || elements[1] === undefined || elements[2] === undefined) {
        throw new RangeError(`The number of elements '${elements.length.toString()}' in '${line}' in input '${modifiedInput}' did not match the expected 3.`)
      }

      // Condense file and folder names that were renamed e.g. "F{a => i}leT{b => e}st.d{c => l}l" or "FaleTbst.dcl => FileTest.dll".
      const fileName: string = elements[2]
        .replace(/\{.*? => (?<newName>[^}]+?)\}/gu, '$<newName>')
        .replace(/.*? => (?<newName>[^}]+?)/gu, '$<newName>')

      result.push({
        fileName,
        linesAdded: this.parseChangedLines(elements[0], line, 'added'),
        linesDeleted: this.parseChangedLines(elements[1], line, 'deleted'),
      })
    }

    return result
  }

  private parseChangedLines (element: string, line: string, category: string): number {
    // Parse the number of lines changed. For binary files, the lines will be '-'.
    let result: number
    if (element === '-') {
      result = 0
    } else {
      result = parseInt(element, decimalRadix)
      if (isNaN(result)) {
        throw new Error(`Could not parse ${category} lines '${element}' from line '${line}'.`)
      }
    }

    return result
  }

  private initializeIsSufficientlyTested (): void {
    this.logger.logDebug('* CodeMetrics.initializeIsSufficientlyTested()')

    if (this.inputs.testFactor === null) {
      this.isSufficientlyTestedInternal = null
    } else {
      this.isSufficientlyTestedInternal = this.metrics.testCode >= (this.metrics.productCode * this.inputs.testFactor)
    }
  }

  private initializeSizeIndicator (): void {
    this.logger.logDebug('* CodeMetrics.initializeSizeIndicator()')

    this.size = this.calculateSize()
    let testIndicator = ''
    if (this.isSufficientlyTestedInternal !== null) {
      if (this.isSufficientlyTestedInternal) {
        testIndicator = this.runnerInvoker.loc('metrics.codeMetrics.titleTestsSufficient')
      } else {
        testIndicator = this.runnerInvoker.loc('metrics.codeMetrics.titleTestsInsufficient')
      }
    }

    this.sizeIndicator = this.runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', this.size, testIndicator)
  }

  private calculateSize (): string {
    this.logger.logDebug('* CodeMetrics.calculateSize()')

    const indicators: FixedLengthArray<((prefix: string) => string), 5> = [
      (): string => this.runnerInvoker.loc('metrics.codeMetrics.titleSizeXS'),
      (): string => this.runnerInvoker.loc('metrics.codeMetrics.titleSizeS'),
      (): string => this.runnerInvoker.loc('metrics.codeMetrics.titleSizeM'),
      (): string => this.runnerInvoker.loc('metrics.codeMetrics.titleSizeL'),
      (prefix: string): string => this.runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', prefix),
    ]

    // Calculate the smaller size.
    if (this.metrics.productCode < this.inputs.baseSize) {
      return indicators[0]('')
    }

    // Calculate the larger sizes.
    let index = 1
    let result: string = indicators[1]('')
    let currentSize: number = this.inputs.baseSize * this.inputs.growthRate
    while (this.metrics.productCode >= currentSize) {
      currentSize *= this.inputs.growthRate
      index += 1

      if (index === 2 || index === 3 || index === 4) {
        result = indicators[index]('')
      } else {
        result = indicators[4]((index - indicators.length + 2).toLocaleString())
      }
    }

    return result
  }
}
