// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ConsoleWrapper from '../wrappers/consoleWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

class Parameters {
  private _consoleWrapper: ConsoleWrapper;
  private _taskLibWrapper: TaskLibWrapper;

  private _baseSize: number = 0;
  private _growthRate: number = 0;
  private _testFactor: number = 0;
  private _fileMatchingPatterns: string[] = [];
  private _codeFileExtensions: string[] = [];

  constructor (consoleWrapper: ConsoleWrapper, taskLibWrapper: TaskLibWrapper) {
    this._taskLibWrapper = taskLibWrapper
    this._consoleWrapper = consoleWrapper
  }

  public get baseSize (): number {
    this._taskLibWrapper.debug('* Parameters.baseSize')

    return this._baseSize
  }

  public get growthRate (): number {
    this._taskLibWrapper.debug('* Parameters.growthRate')

    return this._growthRate
  }

  public get testFactor (): number {
    this._taskLibWrapper.debug('* Parameters.testFactor')

    return this._testFactor
  }

  public get fileMatchingPatterns (): string[] {
    this._taskLibWrapper.debug('* Parameters.fileMatchingPatterns')

    return this._fileMatchingPatterns
  }

  public get codeFileExtensions (): string[] {
    this._taskLibWrapper.debug('* Parameters.codeFileExtensions')

    return this._codeFileExtensions
  }

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
    if (!baseSize || !convertedValue || convertedValue <= 0) {
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
    if (!growthRate || !convertedValue || convertedValue < 1.0) {
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
    if (!testFactor || !convertedValue || convertedValue < 0.0) {
      const defaultValue: number = 1.5
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingTestFactor', defaultValue.toLocaleString()))
      this._testFactor = defaultValue
    } else {
      this._testFactor = convertedValue
    }
  }

  private initializeFileMatchingPatterns (fileMatchingPatterns: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')

    if (!fileMatchingPatterns) {
      const defaultValue: string = '**/*'
      this._consoleWrapper.log(this._taskLibWrapper.loc('updaters.parameters.adjustingFileMatchingPatterns', defaultValue))
      this._fileMatchingPatterns.push(defaultValue)
    } else {
      this._fileMatchingPatterns = fileMatchingPatterns.split('\n')
    }
  }

  private initializeCodeFileExtensions (codeFileExtensions: string): void {
    this._taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')

    if (!codeFileExtensions) {
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

export default Parameters
