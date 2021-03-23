// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ConsoleWrapper from '../wrappers/consoleWrapper'
import Metrics from './metrics'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

class CodeMetrics {
  private _size: string = '';
  private _baseSize: number = 0;
  private _growthRate: number = 0;
  private _testFactor: number = 0;
  private _sufficientTestCode: boolean = false;
  private _metrics: Metrics = new Metrics(0, 0, 0);

  private ignoredFilesWithLinesAdded: string[] = [];
  private ignoredFilesWithoutLinesAdded: string[] = [];
  private fileMatchingPatterns: string[] = [];
  private codeFileExtensions: string[] = [];
  private taskLibWrapper: TaskLibWrapper;
  private _consoleWrapper: ConsoleWrapper;

  constructor (baseSize: string, growthRate: string, testFactor: string, fileMatchingPatterns: string, codeFileExtensions: string, gitDiffSummary: string, taskLibWrapper: TaskLibWrapper, consoleWrapper: ConsoleWrapper) {
    this.taskLibWrapper = taskLibWrapper
    this.taskLibWrapper.debug('* CodeMetrics.new()')

    this._consoleWrapper = consoleWrapper

    this.normalizeParameters(baseSize, growthRate, testFactor, fileMatchingPatterns, codeFileExtensions)
    this.initializeMetrics(gitDiffSummary)
    this.setSufficientTestCode()
    this.initializeSize()
  }

  private setSufficientTestCode (): void {
    this._sufficientTestCode = this._metrics.testCode >= (this._metrics.productCode * this._testFactor)
  }

  public get metrics () {
    return this._metrics
  }

  public set metrics (newMetrics: Metrics) {
    // throw error if input is incorrect
    this._metrics = newMetrics
    this.setSufficientTestCode()
  }

  public get size (): string {
    return this._size
  }

  public set size (newSize: string) {
    // throw error if input is incorrect
    this._size = newSize
  }

  public get baseSize (): number {
    return this._baseSize
  }

  public set baseSize (newSize: number) {
    // throw error if input is incorrect
    this._baseSize = newSize
  }

  public get growthRate (): number {
    return this._growthRate
  }

  public set growthRate (newGrowthRate: number) {
    // throw error if input is incorrect
    this._growthRate = newGrowthRate
  }

  public get testFactor (): number {
    return this._testFactor
  }

  public set testFactor (newtestFactor: number) {
    // throw error if input is incorrect
    this._testFactor = newtestFactor
    this.setSufficientTestCode()
  }

  public get sufficientTestCode (): boolean {
    return this._sufficientTestCode
  }

  public getSizeIndicator (): string {
    this.taskLibWrapper.debug('* CodeMetrics.getSizeIndicator()')

    let indicator: string = this._size

    if (this._sufficientTestCode) {
      indicator += '$([char]0x2714)'
    } else {
      indicator += '$([char]0x26A0)$([char]0xFE0F)'
    }

    return indicator
  }

  public isSmall (): boolean {
    this.taskLibWrapper.debug('* CodeMetrics.isSmall()')

    return this._metrics.productCode <= this._baseSize
  }

  public areTestsExpected (): boolean {
    this.taskLibWrapper.debug('* CodeMetrics.areTestsExpected()')

    return this._testFactor > 0.0
  }

  private normalizeParameters (baseSize: string, growthRate: string, testFactor: string, fileMatchingPatterns: string, codeFileExtensions: string): void {
    this.taskLibWrapper.debug('* CodeMetrics.normalizeParameters()')

    let integerOutput: number = 0
    integerOutput = parseInt(baseSize)
    if (!baseSize || !integerOutput || integerOutput < 0) {
      this._consoleWrapper.log('Adjusting base size parameter to 250.')
      this._baseSize = 250
    } else {
      this._baseSize = integerOutput
    }

    let doubleOutput: number = 0.0
    doubleOutput = parseFloat(growthRate)
    if (!growthRate || !doubleOutput || doubleOutput < 1.0) {
      this._consoleWrapper.log('Adjusting growth rate parameter to 2.0.')
      this._growthRate = 2.0
    } else {
      this._growthRate = doubleOutput
    }

    doubleOutput = parseFloat(testFactor)
    if (!testFactor || !doubleOutput || doubleOutput < 0.0) {
      this._consoleWrapper.log('Adjusting test factor parameter to 1.5.')

      this._testFactor = 1.5
    } else {
      this._testFactor = doubleOutput
    }

    if (!fileMatchingPatterns) {
      this._consoleWrapper.log('Adjusting file matching patterns to **/*.')
      this.fileMatchingPatterns.push('**/*')
    } else {
      this.fileMatchingPatterns = fileMatchingPatterns.split('\n')
    }

    this.normalizeCodeFileExtensionsParameter(codeFileExtensions)
  }

  private normalizeCodeFileExtensionsParameter (codeFileExtensions: string): void {
    this.taskLibWrapper.debug('* CodeMetrics.normalizeCodeFileExtensionsParameter()')

    if (codeFileExtensions) {
      this._consoleWrapper.log("Adjusting code file extensions parameter to default values.'")

      this.codeFileExtensions = [
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
    } else {
      this.codeFileExtensions = codeFileExtensions.split('\n')

      for (let i = 0; i < this.codeFileExtensions.length; i++) {
        this.codeFileExtensions[i] = `*.${this.codeFileExtensions[i]}`
      }
    }
  }

  private initializeMetrics (gitDiffSummary: string): void {
    this.taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')

    const lines: string[] = gitDiffSummary.split('\n')
    const filesAll: Map<string, any> = new Map()

    // Skip the last line as it will always be empty.
    for (let i = 0; i < lines.length - 1; i++) {
      let elements: string[]
      const line: string | undefined = lines[i]

      if (line) {
        elements = line.split('s')
      } else {
        elements = []
      }

      let fileName: string = ''

      for (let j = 2; j < elements.length; j++) {
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
        filesAll.set(fileName, elements[0])
      }
    }

    const filesFiltered: string = `Select-Match -ItemPath ${filesAll.keys()} -Pattern ${this.fileMatchingPatterns}`

    let filesFilteredIndex: number = 0
    let productCode: number = 0
    let testCode: number = 0
    let ignoredCode: number = 0

    filesAll.forEach((value, key) => {
      // The next if statement works on the principal that the result from Select-Match is guaranteed to be in the
      // same order as the input.
      if (filesFiltered != null && filesFilteredIndex < filesFiltered.length && filesFiltered[filesFilteredIndex] === key) {
        filesFilteredIndex++
        let updatedMetrics: boolean = false

        for (const codeFileExtension in this.codeFileExtensions) {
          if (new RegExp(`${codeFileExtension}`, 'ig').test(key)) {
            if (/\*Test\*/ig.test(key)) {
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
        if (value !== '0') {
          this.ignoredFilesWithLinesAdded.push(key)
        } else {
          this.ignoredFilesWithoutLinesAdded.push(key)
        }

        ignoredCode += value
      }
    })

    this._metrics = new Metrics(productCode, testCode, ignoredCode)
  }

  private initializeSize (): void {
    this.taskLibWrapper.debug('* CodeMetrics.initializeSize()')

    const indicators: string[] = ['XS', 'S', 'M', 'L', 'XL']

    this._size = indicators[1]!
    let currentSize: number = this._baseSize
    let index: number = 1

    if (this._metrics.subtotal === 0) {
      this._size = indicators[0]!
    } else {
      // Calculate the smaller sizes.
      if (this._metrics.productCode < this._baseSize / this._growthRate) {
        this._size = indicators[0]!
      }

      // Calculate the larger sizes.
      if (this._metrics.productCode > this._baseSize) {
        while (this._metrics.productCode > currentSize) {
          index++
          currentSize *= this._growthRate

          if (index < indicators.length) {
            this._size = indicators[index]!
          } else {
            this._size = (index - indicators.length + 2).toLocaleString() + indicators[-1]
          }
        }
      }
    }
  }
}

export default CodeMetrics
