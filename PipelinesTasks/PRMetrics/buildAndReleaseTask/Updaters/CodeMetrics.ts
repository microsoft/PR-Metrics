// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IMetrics } from './iMetrics'
import ProcessWrapper from '../wrappers/processWrapper'
import TaskLibWrapper from '../wrappers/taskLibWrapper'
import { isNullOrWhitespace } from './codeMetricsHelpers'

class CodeMetrics {
  public size: string;
  public metrics: IMetrics;
  public ignoredFilesWithLinesAdded: string[];
  public ignoredFilesWithoutLinesAdded: string[];
  public baseSize: number;
  public expectedTestCode: number;

  private growthRate: number;
  private testFactor: number;
  private fileMatchingPatterns: string[];
  private codeFileExtensions: string[];
  private sufficientTestCode: boolean;
  private taskLibWrapper: TaskLibWrapper;
  private processWrapper: ProcessWrapper;

  constructor (baseSize: string, growthRate: string, testFactor: string, fileMatchingPatterns: string, codeFileExtensions: string, gitDiffSummary: string, taskLibWrapper: TaskLibWrapper, processWrapper: ProcessWrapper) {
    
    this.taskLibWrapper = taskLibWrapper
    this.taskLibWrapper.debug('* CodeMetrics.new()')

    this.processWrapper = processWrapper

    this.size = ''
    this.baseSize = 0
    this.testFactor = 0
    this.growthRate = 0

    this.codeFileExtensions = []
    this.fileMatchingPatterns = []
    this.ignoredFilesWithLinesAdded = []
    this.ignoredFilesWithoutLinesAdded = []

    this.metrics = {
      productCode: 0,
      testCode: 0,
      subtotal: 0,
      ignored: 0,
      total: 0
    }

    this.normalizeParameters(baseSize, growthRate, testFactor, fileMatchingPatterns, codeFileExtensions)

    this.initializeMetrics(gitDiffSummary)
    this.expectedTestCode = this.metrics.productCode * this.testFactor
    this.sufficientTestCode = this.metrics.testCode >= this.expectedTestCode
    this.initializeSize()
  }

  public getSizeIndicator (): string {
    this.taskLibWrapper.debug('* CodeMetrics.GetSizeIndicator()')

    let indicator = this.size

    if (this.sufficientTestCode) {
      indicator += '$([char]0x2714)'
    } else {
      indicator += '$([char]0x26A0)$([char]0xFE0F)'
    }

    return indicator
  }

  public isSmall (): boolean {
    this.taskLibWrapper.debug('* CodeMetrics.IsSmall()')

    return this.metrics.productCode <= this.baseSize
  }

  public areTestsExpected (): boolean {
    this.taskLibWrapper.debug('* CodeMetrics.AreTestsExpected()')

    return this.testFactor > 0.0
  }

  public hasSufficientTestCode (): boolean {
    this.taskLibWrapper.debug('* CodeMetrics.HasSufficientTestCode()')

    return this.sufficientTestCode
  }

  private normalizeParameters (baseSize: string, growthRate: string, testFactor: string, fileMatchingPatterns: string, codeFileExtensions: string): void {
    this.taskLibWrapper.debug('* CodeMetrics.NormalizeParameters()')

    let integerOutput: number = 0
    integerOutput = parseInt(baseSize)
    if (isNullOrWhitespace(baseSize) || !integerOutput || integerOutput < 0) {
      this.processWrapper.write('Adjusting base size parameter to 250.')
      this.baseSize = 250
    } else {
      this.baseSize = integerOutput
    }

    let doubleOutput: number = 0.0
    doubleOutput = parseFloat(growthRate)
    if (isNullOrWhitespace(growthRate) || !doubleOutput || doubleOutput < 1.0) {
      this.processWrapper.write('Adjusting growth rate parameter to 2.0.')
      this.growthRate = 2.0
    } else {
      this.growthRate = doubleOutput
    }

    doubleOutput = parseFloat(testFactor)
    if (isNullOrWhitespace(testFactor) || !doubleOutput || doubleOutput < 0.0) {
      this.processWrapper.write('Adjusting test factor parameter to 1.5.')

      this.testFactor = 1.5
    } else {
      this.testFactor = doubleOutput
    }

    if (isNullOrWhitespace(fileMatchingPatterns)) {
      this.processWrapper.write('Adjusting file matching patterns to **/*.')

      this.fileMatchingPatterns.push('**/*')
    } else {
      this.fileMatchingPatterns = fileMatchingPatterns.split('\n')
    }

    this.normalizeCodeFileExtensionsParameter(codeFileExtensions)
  }

  private normalizeCodeFileExtensionsParameter (codeFileExtensions: string): void {
    this.taskLibWrapper.debug('* CodeMetrics.NormalizeCodeFileExtensionsParameter()')

    if (isNullOrWhitespace(codeFileExtensions)) {
      this.processWrapper.write("Adjusting code file extensions parameter to default values.'")

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
    this.taskLibWrapper.debug('* CodeMetrics.InitializeMetrics()')

    const lines: string[] = gitDiffSummary.split('\n')
    const filesAll = new Map()

    // Skip the last line as it will always be empty.
    for (let i = 0; i < lines.length - 1; i++) {
      let elements: string[]
      const line = lines[i]

      if (line) {
        elements = line.split('s')
      } else {
        elements = []
      }

      let fileName = ''

      for (let j = 2; j < elements.length; j++) {
        if (elements[j] !== '=>') {
          const element = elements[j] || ''

          const lastIndex = element.indexOf('{')
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

    filesAll.forEach((value, key) => {
      // The next if statement works on the principal that the result from Select-Match is guaranteed to be in the
      // same order as the input.
      if (filesFiltered != null && filesFilteredIndex < filesFiltered.length && filesFiltered[filesFilteredIndex] === key) {
        filesFilteredIndex++
        let updatedMetrics: boolean = false

        for (const codeFileExtension in this.codeFileExtensions) {
          if (key.test(new RegExp(`${codeFileExtension}`, 'ig'))) {
            if (key.test(new RegExp('/*Test*/', 'ig'))) {
              this.metrics.testCode += value
            } else {
              this.metrics.productCode += value
            }

            updatedMetrics = true
            break
          }
        }

        if (!updatedMetrics) {
          this.metrics.ignored += value
        }
      } else {
        if (value !== '0') {
          this.ignoredFilesWithLinesAdded.push(key)
        } else {
          this.ignoredFilesWithoutLinesAdded.push(key)
        }

        this.metrics.ignored += value
      }
    })

    this.metrics.subtotal = this.metrics.productCode + this.metrics.testCode
    this.metrics.total = this.metrics.subtotal + this.metrics.ignored
  }

  private initializeSize (): void {
    this.taskLibWrapper.debug('* CodeMetrics.InitializeSize()')

    const indicators: string[] = ['XS', 'S', 'M', 'L', 'XL']

    this.size = indicators[1]!
    let currentSize = this.baseSize
    let index = 1

    if (this.metrics.subtotal === 0) {
      this.size = indicators[0]!
    } else {
      // Calculate the smaller sizes.
      if (this.metrics.productCode < this.baseSize / this.growthRate) {
        this.size = indicators[0]!
      }

      // Calculate the larger sizes.
      if (this.metrics.productCode > this.baseSize) {
        while (this.metrics.productCode > currentSize) {
          index++
          currentSize *= this.growthRate

          if (index < indicators.length) {
            this.size = indicators[index]!
          } else {
            this.size = (index - indicators.length + 2).toLocaleString() + indicators[-1]
          }
        }
      }
    }
  }
}

export default CodeMetrics
