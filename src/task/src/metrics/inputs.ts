// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { InputsDefault } from './inputsDefault'
import { singleton } from 'tsyringe'
import Logger from '../utilities/logger'
import RunnerInvoker from '../runners/runnerInvoker'

/**
 * A class representing inputs passed to the task.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class Inputs {
  private readonly _logger: Logger
  private readonly _runnerInvoker: RunnerInvoker

  private _isInitialized: boolean = false
  private _baseSize: number = 0
  private _growthRate: number = 0
  private _testFactor: number | null = 0
  private _fileMatchingPatterns: string[] = []
  private _codeFileExtensions: Set<string> = new Set<string>()

  /**
   * Initializes a new instance of the `Inputs` class.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  constructor (logger: Logger, runnerInvoker: RunnerInvoker) {
    this._logger = logger
    this._runnerInvoker = runnerInvoker
  }

  /**
   * Gets the base size input, which is the maximum number of new lines in a small pull request.
   * @returns The base size input.
   */
  public get baseSize (): number {
    this._logger.logDebug('* Inputs.baseSize')

    this.initialize()
    return this._baseSize
  }

  /**
   * Gets the growth rate input, which is applied to the base size for calculating the size of larger pull requests.
   * @returns The growth rate input.
   */
  public get growthRate (): number {
    this._logger.logDebug('* Inputs.growthRate')

    this.initialize()
    return this._growthRate
  }

  /**
   * Gets the test factor input, which is the number of lines of test code expected for each line of product code.
   * @returns The test factor input. If the test coverage is not to be checked, this will be `null`.
   */
  public get testFactor (): number | null {
    this._logger.logDebug('* Inputs.testFactor')

    this.initialize()
    return this._testFactor
  }

  /**
   * Gets the file matching patterns input, which is the set of globs specifying the files and folders to include.
   * @returns The file matching patterns input.
   */
  public get fileMatchingPatterns (): string[] {
    this._logger.logDebug('* Inputs.fileMatchingPatterns')

    this.initialize()
    return this._fileMatchingPatterns
  }

  /**
   * Gets the code file extensions input, which is the set of extensions for files containing code so that non-code files can be excluded.
   * @returns The code file extensions input.
   */
  public get codeFileExtensions (): Set<string> {
    this._logger.logDebug('* Inputs.codeFileExtensions')

    this.initialize()
    return this._codeFileExtensions
  }

  private initialize (): void {
    this._logger.logDebug('* Inputs.initialize()')

    if (this._isInitialized) {
      return
    }

    const baseSize: string | undefined = this._runnerInvoker.getInput(['Base', 'Size'])
    this.initializeBaseSize(baseSize)

    const growthRate: string | undefined = this._runnerInvoker.getInput(['Growth', 'Rate'])
    this.initializeGrowthRate(growthRate)

    const testFactor: string | undefined = this._runnerInvoker.getInput(['Test', 'Factor'])
    this.initializeTestFactor(testFactor)

    const fileMatchingPatterns: string | undefined = this._runnerInvoker.getInput(['File', 'Matching', 'Patterns'])
    this.initializeFileMatchingPatterns(fileMatchingPatterns)

    const codeFileExtensions: string | undefined = this._runnerInvoker.getInput(['Code', 'File', 'Extensions'])
    this.initializeCodeFileExtensions(codeFileExtensions)

    this._isInitialized = true
  }

  private initializeBaseSize (baseSize: string | undefined): void {
    this._logger.logDebug('* Inputs.initializeBaseSize()')

    const convertedValue: number = baseSize === undefined ? NaN : parseInt(baseSize)
    if (!isNaN(convertedValue) && convertedValue > 0) {
      this._baseSize = convertedValue
      this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.settingBaseSize', this._baseSize.toLocaleString()))
      return
    }

    this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.adjustingBaseSize', InputsDefault.baseSize.toLocaleString()))
    this._baseSize = InputsDefault.baseSize
  }

  private initializeGrowthRate (growthRate: string | undefined): void {
    this._logger.logDebug('* Inputs.initializeGrowthRate()')

    const convertedValue: number = growthRate === undefined ? NaN : parseFloat(growthRate)
    if (!isNaN(convertedValue) && convertedValue > 1.0) {
      this._growthRate = convertedValue
      this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.settingGrowthRate', this._growthRate.toLocaleString()))
      return
    }

    this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.adjustingGrowthRate', InputsDefault.growthRate.toLocaleString()))
    this._growthRate = InputsDefault.growthRate
  }

  private initializeTestFactor (testFactor: string | undefined): void {
    this._logger.logDebug('* Inputs.initializeTestFactor()')

    const convertedValue: number = testFactor === undefined ? NaN : parseFloat(testFactor)
    if (!isNaN(convertedValue) && convertedValue >= 0.0) {
      if (convertedValue === 0.0) {
        this._testFactor = null
        this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.disablingTestFactor'))
      } else {
        this._testFactor = convertedValue
        this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.settingTestFactor', this._testFactor.toLocaleString()))
      }

      return
    }

    this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.adjustingTestFactor', InputsDefault.testFactor.toLocaleString()))
    this._testFactor = InputsDefault.testFactor
  }

  private initializeFileMatchingPatterns (fileMatchingPatterns: string | undefined): void {
    this._logger.logDebug('* Inputs.initializeFileMatchingPatterns()')

    if (fileMatchingPatterns?.trim()) {
      this._fileMatchingPatterns = fileMatchingPatterns.replace(/\\/g, '/').replace(/\n$/g, '').split('\n')
      this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.settingFileMatchingPatterns', JSON.stringify(this._fileMatchingPatterns)))
      return
    }

    this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.adjustingFileMatchingPatterns', JSON.stringify(InputsDefault.fileMatchingPatterns)))
    this._fileMatchingPatterns = InputsDefault.fileMatchingPatterns
  }

  private initializeCodeFileExtensions (codeFileExtensions: string | undefined): void {
    this._logger.logDebug('* Inputs.initializeCodeFileExtensions()')

    if (codeFileExtensions?.trim()) {
      const codeFileExtensionsArray: string[] = codeFileExtensions.replace(/\n$/g, '').split('\n')
      codeFileExtensionsArray.forEach((value: string): void => {
        if (value.startsWith('*.')) {
          value = value.substring(2)
        } else if (value.startsWith('.')) {
          value = value.substring(1)
        }

        this._codeFileExtensions.add(value.toLowerCase())
      })
      this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.settingCodeFileExtensions', JSON.stringify(Array.from(this._codeFileExtensions))))
      return
    }

    this._logger.logInfo(this._runnerInvoker.loc('metrics.inputs.adjustingCodeFileExtensions', JSON.stringify(InputsDefault.codeFileExtensions)))
    this._codeFileExtensions = new Set<string>(InputsDefault.codeFileExtensions)
  }
}
