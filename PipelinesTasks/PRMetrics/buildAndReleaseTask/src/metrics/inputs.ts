// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { InputsDefault } from './inputsDefault'
import { singleton } from 'tsyringe'
import ConsoleWrapper from '../wrappers/consoleWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class representing inputs passed to the task.
 */
@singleton()
export default class Inputs {
  private _consoleWrapper: ConsoleWrapper
  private _taskLibWrapper: TaskLibWrapper

  private _isInitialized: boolean = false
  private _baseSize: number = 0
  private _growthRate: number = 0
  private _testFactor: number | null = 0
  private _fileMatchingPatterns: string[] = []
  private _codeFileExtensions: Set<string> = new Set<string>()

  /**
   * Initializes a new instance of the `Inputs` class.
   * @param consoleWrapper The wrapper around the console.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  constructor (consoleWrapper: ConsoleWrapper, taskLibWrapper: TaskLibWrapper) {
    this._consoleWrapper = consoleWrapper
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets the base size input, which is the maximum number of new lines in a small pull request.
   * @returns The base size input.
   */
  public get baseSize (): number {
    this._taskLibWrapper.debug('* Inputs.baseSize')

    this.initialize()
    return this._baseSize
  }

  /**
   * Gets the growth rate input, which is applied to the base size for calculating the size of larger pull requests.
   * @returns The growth rate input.
   */
  public get growthRate (): number {
    this._taskLibWrapper.debug('* Inputs.growthRate')

    this.initialize()
    return this._growthRate
  }

  /**
   * Gets the test factor input, which is the number of lines of test code expected for each line of product code.
   * @returns The test factor input. If the test coverage is not to be checked, this will be `null`.
   */
  public get testFactor (): number | null {
    this._taskLibWrapper.debug('* Inputs.testFactor')

    this.initialize()
    return this._testFactor
  }

  /**
   * Gets the file matching patterns input, which is the set of Azure DevOps file matching patterns specifying the files and folders to include.
   * @returns The file matching patterns input.
   */
  public get fileMatchingPatterns (): string[] {
    this._taskLibWrapper.debug('* Inputs.fileMatchingPatterns')

    this.initialize()
    return this._fileMatchingPatterns
  }

  /**
   * Gets the code file extensions input, which is the set of extensions for files containing code so that non-code files can be excluded.
   * @returns The code file extensions input.
   */
  public get codeFileExtensions (): Set<string> {
    this._taskLibWrapper.debug('* Inputs.codeFileExtensions')

    this.initialize()
    return this._codeFileExtensions
  }

  private initialize (): void {
    this._taskLibWrapper.debug('* Inputs.initialize()')

    if (this._isInitialized) {
      return
    }

    const baseSize: string | undefined = this._taskLibWrapper.getInput('BaseSize', false)
    this.initializeBaseSize(baseSize)

    const growthRate: string | undefined = this._taskLibWrapper.getInput('GrowthRate', false)
    this.initializeGrowthRate(growthRate)

    const testFactor: string | undefined = this._taskLibWrapper.getInput('TestFactor', false)
    this.initializeTestFactor(testFactor)

    const fileMatchingPatterns: string | undefined = this._taskLibWrapper.getInput('FileMatchingPatterns', false)
    this.initializeFileMatchingPatterns(fileMatchingPatterns)

    const codeFileExtensions: string | undefined = this._taskLibWrapper.getInput('CodeFileExtensions', false)
    this.initializeCodeFileExtensions(codeFileExtensions)

    this._isInitialized = true
  }

  private initializeBaseSize (baseSize: string | undefined): void {
    this._taskLibWrapper.debug('* Inputs.initializeBaseSize()')

    const convertedValue: number = parseInt(baseSize!)
    if (!isNaN(convertedValue) && convertedValue > 0) {
      this._baseSize = convertedValue
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('metrics.inputs.adjustingBaseSize', InputsDefault.baseSize.toLocaleString()))
    this._baseSize = InputsDefault.baseSize
  }

  private initializeGrowthRate (growthRate: string | undefined): void {
    this._taskLibWrapper.debug('* Inputs.initializeGrowthRate()')

    const convertedValue: number = parseFloat(growthRate!)
    if (!isNaN(convertedValue) && convertedValue >= 1.0) {
      this._growthRate = convertedValue
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('metrics.inputs.adjustingGrowthRate', InputsDefault.growthRate.toLocaleString()))
    this._growthRate = InputsDefault.growthRate
  }

  private initializeTestFactor (testFactor: string | undefined): void {
    this._taskLibWrapper.debug('* Inputs.initializeTestFactor()')

    const convertedValue: number = parseFloat(testFactor!)
    if (!isNaN(convertedValue) && convertedValue >= 0.0) {
      this._testFactor = convertedValue === 0.0 ? null : convertedValue
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('metrics.inputs.adjustingTestFactor', InputsDefault.testFactor.toLocaleString()))
    this._testFactor = InputsDefault.testFactor
  }

  private initializeFileMatchingPatterns (fileMatchingPatterns: string | undefined): void {
    this._taskLibWrapper.debug('* Inputs.initializeFileMatchingPatterns()')

    if (fileMatchingPatterns?.trim()) {
      this._fileMatchingPatterns = fileMatchingPatterns.split('\n')
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('metrics.inputs.adjustingFileMatchingPatterns', JSON.stringify(InputsDefault.fileMatchingPatterns)))
    this._fileMatchingPatterns = InputsDefault.fileMatchingPatterns
  }

  private initializeCodeFileExtensions (codeFileExtensions: string | undefined): void {
    this._taskLibWrapper.debug('* Inputs.initializeCodeFileExtensions()')

    if (codeFileExtensions?.trim()) {
      const codeFileExtensionsArray: string[] = codeFileExtensions.split('\n')
      codeFileExtensionsArray.forEach((value: string): void => {
        if (value.startsWith('*.')) {
          value = value.substring(2)
        } else if (value.startsWith('.')) {
          value = value.substring(1)
        }

        this._codeFileExtensions.add(value)
      })
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('metrics.inputs.adjustingCodeFileExtensions'))
    this._codeFileExtensions = InputsDefault.codeFileExtensions
  }
}
