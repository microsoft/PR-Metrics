// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ConsoleWrapper from '../wrappers/consoleWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class representing parameters passed to the task.
 */
export default class Parameters {
  private _consoleWrapper: ConsoleWrapper;
  private _taskLibWrapper: TaskLibWrapper;

  private _baseSize: number = 0;
  private _growthRate: number = 0;
  private _testFactor: number = 0;
  private _fileMatchingPatterns: string[] = [];
  private _codeFileExtensions: string[] = [];

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
   * @returns The test factor parameter.
   */
  public get testFactor (): number {
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
    if (!convertedValue || convertedValue <= 0) {
      const defaultValue: number = 250
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingBaseSize', defaultValue.toLocaleString()))
      this._baseSize = defaultValue
    } else {
      this._baseSize = convertedValue
    }
  }

  private initializeGrowthRate (growthRate: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeGrowthRate()')

    const convertedValue: number = parseFloat(growthRate)
    if (!convertedValue || convertedValue < 1.0) {
      const defaultValue: number = 2.0
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingGrowthRate', defaultValue.toLocaleString()))
      this._growthRate = defaultValue
    } else {
      this._growthRate = convertedValue
    }
  }

  private initializeTestFactor (testFactor: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeTestFactor()')

    const convertedValue: number = parseFloat(testFactor)
    if (!convertedValue || convertedValue < 0.0) {
      const defaultValue: number = 1.5
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingTestFactor', defaultValue.toLocaleString()))
      this._testFactor = defaultValue
    } else {
      this._testFactor = convertedValue
    }
  }

  private initializeFileMatchingPatterns (fileMatchingPatterns: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')

    if (!fileMatchingPatterns?.trim()) {
      const defaultValue: string = '**/*'
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingFileMatchingPatterns', defaultValue))
      this._fileMatchingPatterns.push(defaultValue)
    } else {
      this._fileMatchingPatterns = fileMatchingPatterns.split('\n')
    }
  }

  private initializeCodeFileExtensions (codeFileExtensions: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')

    if (!codeFileExtensions?.trim()) {
      const codeFileExtensionsArray: string[] = codeFileExtensions.split('\n')
      codeFileExtensionsArray.forEach((value: string): void => {
        this._codeFileExtensions.push(`*.${value}`)
      })
    } else {
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingCodeFileExtensions'))
      this._codeFileExtensions = [
        '*.ada',
        '*.adb',
        '*.ads',
        '*.asm',
        '*.bas',
        '*.bb',
        '*.bmx',
        '*.c',
        '*.cbl',
        '*.cbp',
        '*.cc',
        '*.clj',
        '*.cls',
        '*.cob',
        '*.cpp',
        '*.cs',
        '*.cxx',
        '*.d',
        '*.dba',
        '*.e',
        '*.efs',
        '*.egt',
        '*.el',
        '*.f',
        '*.f77',
        '*.f90',
        '*.for',
        '*.frm',
        '*.frx',
        '*.fth',
        '*.ftn',
        '*.ged',
        '*.gm6',
        '*.gmd',
        '*.gmk',
        '*.gml',
        '*.go',
        '*.h',
        '*.hpp',
        '*.hs',
        '*.hxx',
        '*.i',
        '*.inc',
        '*.js',
        '*.java',
        '*.l',
        '*.lgt',
        '*.lisp',
        '*.m',
        '*.m4',
        '*.ml',
        '*.msqr',
        '*.n',
        '*.nb',
        '*.p',
        '*.pas',
        '*.php',
        '*.php3',
        '*.php4',
        '*.php5',
        '*.phps',
        '*.phtml',
        '*.piv',
        '*.pl',
        '*.pl1',
        '*.pli',
        '*.pm',
        '*.pol',
        '*.pp',
        '*.prg',
        '*.pro',
        '*.py',
        '*.r',
        '*.rb',
        '*.red',
        '*.reds',
        '*.rkt',
        '*.rktl',
        '*.s',
        '*.scala',
        '*.sce',
        '*.sci',
        '*.scm',
        '*.sd7',
        '*.skb',
        '*.skc',
        '*.skd',
        '*.skf',
        '*.skg',
        '*.ski',
        '*.skk',
        '*.skm',
        '*.sko',
        '*.skp',
        '*.skq',
        '*.sks',
        '*.skt',
        '*.skz',
        '*.spin',
        '*.stk',
        '*.swg',
        '*.tcl',
        '*.ts',
        '*.vb',
        '*.xpl',
        '*.xq',
        '*.xsl',
        '*.y'
      ]
    }
  }
}
