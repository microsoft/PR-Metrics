// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ConsoleWrapper from '../wrappers/consoleWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'
import { ParametersDefault } from './parametersDefault'

/**
 * A class representing parameters passed to the task.
 */
export default class Parameters {
  private _consoleWrapper: ConsoleWrapper
  private _taskLibWrapper: TaskLibWrapper

  private _baseSize: number = 0
  private _growthRate: number = 0
  private _testFactor: number | null = 0
  private _fileMatchingPatterns: string[] = []
  private _codeFileExtensions: string[] = []

  /**
   * Initializes a new instance of the `Parameters` class.
   * @param codeMetrics The wrapper around the console.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  constructor (consoleWrapper: ConsoleWrapper, taskLibWrapper: TaskLibWrapper) {
    this._taskLibWrapper = taskLibWrapper
    this._consoleWrapper = consoleWrapper
  }

  /**
   * Gets the base size parameter, which is the maximum number of new lines in a small pull request.
   * @returns The base size parameter.
   */
  public get baseSize (): number {
    this._taskLibWrapper.debug('* Parameters.baseSize')

    return this._baseSize
  }

  /**
   * Gets the growth rate parameter, which is applied to the base size for calculating the size of larger pull requests.
   * @returns The growth rate parameter.
   */
  public get growthRate (): number {
    this._taskLibWrapper.debug('* Parameters.growthRate')

    return this._growthRate
  }

  /**
   * Gets the test factor parameter, which is the number of lines of test code expected for each line of product code.
   * @returns The test factor parameter. If the test coverage is not to be checked, this will be `null`.
   */
  public get testFactor (): number | null {
    this._taskLibWrapper.debug('* Parameters.testFactor')

    return this._testFactor
  }

  /**
   * Gets the file matching patterns parameter, which is the set of Azure DevOps file matching patterns specifying the files and folders to include.
   * @returns The file matching patterns parameter.
   */
  public get fileMatchingPatterns (): string[] {
    this._taskLibWrapper.debug('* Parameters.fileMatchingPatterns')

    return this._fileMatchingPatterns
  }

  /**
   * Gets the code file extensions parameter, which is the set of extensions for files containing code so that non-code files can be excluded.
   * @returns The code file extensions parameter.
   */
  public get codeFileExtensions (): string[] {
    this._taskLibWrapper.debug('* Parameters.codeFileExtensions')

    return this._codeFileExtensions
  }

  /**
   * Initializes the object with the specified input parameter values.
   * @param baseSize The base size parameter input.
   * @param growthRate The growth rate parameter input.
   * @param testFactor The test factor parameter input.
   * @param fileMatchingPatterns The file matching patterns parameter input.
   * @param codeFileExtensions The code file extensions parameter input.
   */
  public initialize (baseSize: string, growthRate: string, testFactor: string, fileMatchingPatterns: string, codeFileExtensions: string): void {
    this._taskLibWrapper.debug('* Parameters.initialize()')

    this.initializeBaseSize(baseSize)
    this.initializeGrowthRate(growthRate)
    this.initializeTestFactor(testFactor)
    this.initializeFileMatchingPatterns(fileMatchingPatterns)
    this.initializeCodeFileExtensions(codeFileExtensions)
  }

  private initializeBaseSize (baseSize: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeBaseSize()')

    const convertedValue: number = parseInt(baseSize)
    if (!isNaN(convertedValue) && convertedValue > 0) {
      this._baseSize = convertedValue
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingBaseSize', ParametersDefault.baseSize.toLocaleString()))
    this._baseSize = ParametersDefault.baseSize
  }

  private initializeGrowthRate (growthRate: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeGrowthRate()')

    const convertedValue: number = parseFloat(growthRate)
    if (!isNaN(convertedValue) && convertedValue >= 1.0) {
      this._growthRate = convertedValue
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingGrowthRate', ParametersDefault.growthRate.toLocaleString()))
    this._growthRate = ParametersDefault.growthRate
  }

  private initializeTestFactor (testFactor: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeTestFactor()')

    const convertedValue: number = parseFloat(testFactor)
    if (!isNaN(convertedValue) && convertedValue >= 0.0) {
      this._testFactor = convertedValue === 0.0 ? null : convertedValue
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingTestFactor', ParametersDefault.testFactor.toLocaleString()))
    this._testFactor = ParametersDefault.testFactor
  }

  private initializeFileMatchingPatterns (fileMatchingPatterns: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')

    if (fileMatchingPatterns.trim()) {
      this._fileMatchingPatterns = fileMatchingPatterns.split('\n')
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingFileMatchingPatterns', JSON.stringify(ParametersDefault.fileMatchingPatterns)))
    this._fileMatchingPatterns = ParametersDefault.fileMatchingPatterns
  }

  private initializeCodeFileExtensions (codeFileExtensions: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')

    if (codeFileExtensions.trim()) {
      const codeFileExtensionsArray: string[] = codeFileExtensions.split('\n')
      codeFileExtensionsArray.forEach((value: string): void => {
        this._codeFileExtensions.push(`*.${value}`)
      })
      return
    }

    this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingCodeFileExtensions'))
    this._codeFileExtensions = ParametersDefault.codeFileExtensions
  }
}
