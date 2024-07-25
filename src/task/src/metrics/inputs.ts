/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from './inputsDefault'
import Logger from '../utilities/logger'
import RunnerInvoker from '../runners/runnerInvoker'
import { decimalRadix } from '../utilities/constants'
import { singleton } from 'tsyringe'

/**
 * A class representing inputs passed to the task.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class Inputs {
  private readonly logger: Logger
  private readonly runnerInvoker: RunnerInvoker

  private isInitializedInternal = false
  private baseSizeInternal = 0
  private growthRateInternal = 0
  private testFactorInternal: number | null = 0
  private alwaysCloseCommentInternal = false
  private fileMatchingPatternsInternal: string[] = []
  private codeFileExtensionsInternal: Set<string> = new Set<string>()

  /**
   * Initializes a new instance of the `Inputs` class.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (logger: Logger, runnerInvoker: RunnerInvoker) {
    this.logger = logger
    this.runnerInvoker = runnerInvoker
  }

  /**
   * Gets the base size input, which is the maximum number of new lines in an extra small pull request.
   * @returns The base size input.
   */
  public get baseSize (): number {
    this.logger.logDebug('* Inputs.baseSize')

    this.initialize()
    return this.baseSizeInternal
  }

  /**
   * Gets the growth rate input, which is applied to the base size for calculating the size of larger pull requests.
   * @returns The growth rate input.
   */
  public get growthRate (): number {
    this.logger.logDebug('* Inputs.growthRate')

    this.initialize()
    return this.growthRateInternal
  }

  /**
   * Gets the test factor input, which is the number of lines of test code expected for each line of product code.
   * @returns The test factor input. If the test coverage is not to be checked, this will be `null`.
   */
  public get testFactor (): number | null {
    this.logger.logDebug('* Inputs.testFactor')

    this.initialize()
    return this.testFactorInternal
  }

  /**
   * Gets the value indicating whether to always close the size and test comment, instead of leaving it open when
   * requiring attention.
   * @returns The value indicating whether to always close the comment.
   */
  public get alwaysCloseComment (): boolean {
    this.logger.logDebug('* Inputs.alwaysCloseComment')

    this.initialize()
    return this.alwaysCloseCommentInternal
  }

  /**
   * Gets the file matching patterns input, which is the set of globs specifying the files and folders to include.
   * @returns The file matching patterns input.
   */
  public get fileMatchingPatterns (): string[] {
    this.logger.logDebug('* Inputs.fileMatchingPatterns')

    this.initialize()
    return this.fileMatchingPatternsInternal
  }

  /**
   * Gets the code file extensions input, which is the set of extensions for files containing code so that non-code files can be excluded.
   * @returns The code file extensions input.
   */
  public get codeFileExtensions (): Set<string> {
    this.logger.logDebug('* Inputs.codeFileExtensions')

    this.initialize()
    return this.codeFileExtensionsInternal
  }

  private initialize (): void {
    this.logger.logDebug('* Inputs.initialize()')

    if (this.isInitializedInternal) {
      return
    }

    const baseSize: string | undefined = this.runnerInvoker.getInput(['Base', 'Size'])
    this.initializeBaseSize(baseSize)

    const growthRate: string | undefined = this.runnerInvoker.getInput(['Growth', 'Rate'])
    this.initializeGrowthRate(growthRate)

    const testFactor: string | undefined = this.runnerInvoker.getInput(['Test', 'Factor'])
    this.initializeTestFactor(testFactor)

    const alwaysCloseComment: string | undefined = this.runnerInvoker.getInput(['Always', 'Close', 'Comment'])
    this.initializeAlwaysCloseComment(alwaysCloseComment)

    const fileMatchingPatterns: string | undefined = this.runnerInvoker.getInput(['File', 'Matching', 'Patterns'])
    this.initializeFileMatchingPatterns(fileMatchingPatterns)

    const codeFileExtensions: string | undefined = this.runnerInvoker.getInput(['Code', 'File', 'Extensions'])
    this.initializeCodeFileExtensions(codeFileExtensions)

    this.isInitializedInternal = true
  }

  private initializeBaseSize (baseSize: string | undefined): void {
    this.logger.logDebug('* Inputs.initializeBaseSize()')

    const convertedValue: number = baseSize === undefined ? NaN : parseInt(baseSize, decimalRadix)
    if (!isNaN(convertedValue) && convertedValue > 0) {
      this.baseSizeInternal = convertedValue
      this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.settingBaseSize', this.baseSizeInternal.toLocaleString()))
      return
    }

    this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.adjustingBaseSize', InputsDefault.baseSize.toLocaleString()))
    this.baseSizeInternal = InputsDefault.baseSize
  }

  private initializeGrowthRate (growthRate: string | undefined): void {
    this.logger.logDebug('* Inputs.initializeGrowthRate()')

    const convertedValue: number = growthRate === undefined ? NaN : parseFloat(growthRate)
    if (!isNaN(convertedValue) && convertedValue > 1.0) {
      this.growthRateInternal = convertedValue
      this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.settingGrowthRate', this.growthRateInternal.toLocaleString()))
      return
    }

    this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.adjustingGrowthRate', InputsDefault.growthRate.toLocaleString()))
    this.growthRateInternal = InputsDefault.growthRate
  }

  private initializeTestFactor (testFactor: string | undefined): void {
    this.logger.logDebug('* Inputs.initializeTestFactor()')

    const convertedValue: number = testFactor === undefined ? NaN : parseFloat(testFactor)
    if (!isNaN(convertedValue) && convertedValue >= 0.0) {
      if (convertedValue === 0.0) {
        this.testFactorInternal = null
        this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.disablingTestFactor'))
      } else {
        this.testFactorInternal = convertedValue
        this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.settingTestFactor', this.testFactorInternal.toLocaleString()))
      }

      return
    }

    this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.adjustingTestFactor', InputsDefault.testFactor.toLocaleString()))
    this.testFactorInternal = InputsDefault.testFactor
  }

  private initializeAlwaysCloseComment (alwaysCloseComment: string | undefined): void {
    this.logger.logDebug('* Inputs.initializeAlwaysCloseComment()')

    const convertedValue: boolean | undefined = alwaysCloseComment?.toLowerCase() === 'true'
    if (convertedValue) {
      this.alwaysCloseCommentInternal = convertedValue
      this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.settingAlwaysCloseComment'))
      return
    }

    this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.adjustingAlwaysCloseComment'))
    this.alwaysCloseCommentInternal = InputsDefault.alwaysCloseComment
  }

  private initializeFileMatchingPatterns (fileMatchingPatterns: string | undefined): void {
    this.logger.logDebug('* Inputs.initializeFileMatchingPatterns()')

    if (fileMatchingPatterns !== undefined && fileMatchingPatterns.trim() !== '') {
      this.fileMatchingPatternsInternal = fileMatchingPatterns.replace(/\\/gu, '/').replace(/\n$/gu, '').split('\n')
      this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.settingFileMatchingPatterns', JSON.stringify(this.fileMatchingPatternsInternal)))
      return
    }

    this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.adjustingFileMatchingPatterns', JSON.stringify(InputsDefault.fileMatchingPatterns)))
    this.fileMatchingPatternsInternal = InputsDefault.fileMatchingPatterns
  }

  private initializeCodeFileExtensions (codeFileExtensions: string | undefined): void {
    this.logger.logDebug('* Inputs.initializeCodeFileExtensions()')

    if (codeFileExtensions !== undefined && codeFileExtensions.trim() !== '') {
      const codeFileExtensionsArray: string[] = codeFileExtensions.replace(/\n$/gu, '').split('\n')
      for (const value of codeFileExtensionsArray) {
        let modifiedValue: string = value
        if (modifiedValue.startsWith('*.')) {
          modifiedValue = modifiedValue.substring(2)
        } else if (modifiedValue.startsWith('.')) {
          modifiedValue = modifiedValue.substring(1)
        }

        this.codeFileExtensionsInternal.add(modifiedValue.toLowerCase())
      }

      this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.settingCodeFileExtensions', JSON.stringify(Array.from(this.codeFileExtensionsInternal))))
      return
    }

    this.logger.logInfo(this.runnerInvoker.loc('metrics.inputs.adjustingCodeFileExtensions', JSON.stringify(InputsDefault.codeFileExtensions)))
    this.codeFileExtensionsInternal = new Set<string>(InputsDefault.codeFileExtensions)
  }
}
