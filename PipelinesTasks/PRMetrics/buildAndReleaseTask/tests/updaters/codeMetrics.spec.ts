// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { instance, mock, verify, when } from 'ts-mockito'

import CodeMetrics from '../../updaters/codeMetrics'
import CodeMetricsData from '../../updaters/codeMetricsData'
import Parameters from '../../updaters/parameters'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import async from 'async'
import { expect } from 'chai'

const localizations = {
  titleSizeXS: 'XS',
  titleSizeS: 'S',
  titleSizeM: 'M',
  titleSizeL: 'L',
  titleSizeXL: 'XL',
  titleTestsSufficient: 'updaters.codeMetrics.titleTestsSufficient',
  titleTestsInsufficient: 'updaters.codeMetrics.titleTestsInsufficient'
}
describe('codeMetrics.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper
  let parameters: Parameters

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    parameters = mock(Parameters)

    when(parameters.baseSize).thenReturn(5)
    when(parameters.growthRate).thenReturn(5)
    when(parameters.testFactor).thenReturn(5)
    when(parameters.fileMatchingPatterns).thenReturn(['*.js'])
    when(parameters.codeFileExtensions).thenReturn(['*.js'])

    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeXS')).thenReturn(localizations.titleSizeXS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeS')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeM')).thenReturn(localizations.titleSizeM)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeL')).thenReturn(localizations.titleSizeL)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeXL')).thenReturn(localizations.titleSizeXL)

    when(taskLibWrapper.loc(localizations.titleTestsSufficient)).thenReturn('sufficient')
    when(taskLibWrapper.loc(localizations.titleTestsInsufficient)).thenReturn('insufficient')

    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, localizations.titleTestsSufficient)).thenReturn(localizations.titleSizeS + localizations.titleTestsSufficient)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, localizations.titleTestsInsufficient)).thenReturn(localizations.titleSizeXS + localizations.titleTestsInsufficient)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, localizations.titleTestsSufficient)).thenReturn(localizations.titleSizeS + localizations.titleTestsSufficient)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, localizations.titleTestsInsufficient)).thenReturn(localizations.titleSizeS + localizations.titleTestsInsufficient)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, localizations.titleTestsSufficient)).thenReturn(localizations.titleSizeM + localizations.titleTestsSufficient)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, localizations.titleTestsInsufficient)).thenReturn(localizations.titleSizeM + localizations.titleTestsInsufficient)

    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, '')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, '')).thenReturn(localizations.titleSizeXS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, '')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, '')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, '')).thenReturn(localizations.titleSizeM)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, '')).thenReturn(localizations.titleSizeM)
  })

  describe('initialize', (): void => {
    // it('TESTEST ============== TESTEST ==============', (): void => {

    //   const line = '9 9 File1.cs'
    //   const pattern = ['*.dll']

    //   const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
    //   expect(codeMetrics.test(line, pattern)).to.equal(true)
    // })

    // it('TESTEST', ():void => {
    //   // Arrange
    //   when(parameters.baseSize).thenReturn(50)
    //   when(parameters.growthRate).thenReturn(2.5)
    //   when(parameters.testFactor).thenReturn(1.0)
    //   when(parameters.fileMatchingPatterns).thenReturn(['**/*', '!File*.cs', '!**/*.dll', '!test/File*.cs', 'test/File2.cs'])
    //   when(parameters.codeFileExtensions).thenReturn(['*.cs', '*.dll'])

    //   const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
    //   const gitDiffSummary: string = '9    1    File1.cs\n' +
    //         '0    9    File2.cs\n' +
    //         '-    -    File.dll\n' +
    //         '9    1    {Folder_Old => Folder}/FileTest1.cs\n' +
    //         '0    9    File{a => t}est2.cs\n' +
    //         '-    -    F{a => i}leT{b => e}st.d{c => l}l\n' +
    //         '9    1    {test/File.cs => test/File1.cs}\n' +
    //         '0    9    {product => test}/File2.cs\n' +
    //         '-    -    {product => test}/File.dll\n'
    //   const expectedMetrics: CodeMetricsData = new CodeMetricsData(0, 9, 18)

    //   // Act
    //   codeMetrics.initialize(gitDiffSummary)

    //   // Assert
    //   expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
    //   expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
    //   expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
    //   expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
    //   expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File1.cs', 'test/File1.cs'])
    //   expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File2.cs', 'Filetest2.cs'])
    // })

    describe('isSmall function', (): void => {
      async.each(
        [
          { productCode: 0, baseSize: 5 },
          { productCode: 5, baseSize: 4 },
          { productCode: 20, baseSize: 12 },
          { productCode: 7, baseSize: 7 }
        ], (entryObj): void => {
          it('isSmall', (): void => {
            // Arrage
            when(parameters.baseSize).thenReturn(entryObj.baseSize)

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.productCode}    5    File1.js`

            // Act
            codeMetrics.initialize(gitDiffSummary)

            // Assert
            expect(codeMetrics.isSmall).to.equal(entryObj.productCode <= entryObj.baseSize)
            verify(taskLibWrapper.debug('* CodeMetrics.isSmall')).once()
          })
        })
    })

    describe('isSufficientlyTested function', (): void => {
      async.each(
        [
          { productCode: 0, testCode: 5, testFactor: 0 },
          { productCode: 5, testCode: 4, testFactor: 8 },
          { productCode: 20, testCode: 12, testFactor: 2 },
          { productCode: 7, testCode: 40, testFactor: 0 }
        ], (entryObj): void => {
          it('isSufficientlyTested', (): void => {
            // Arrage
            when(parameters.testFactor).thenReturn(entryObj.testFactor)

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.productCode}    5    File1.js\n${entryObj.testCode}    5    File1Test.js`

            // Act
            codeMetrics.initialize(gitDiffSummary)

            // Assert
            expect(codeMetrics.isSufficientlyTested).to.equal(entryObj.testCode >= (entryObj.productCode * entryObj.testFactor))
            verify(taskLibWrapper.debug('* CodeMetrics.isSufficientlyTested')).thrice()
          })
        })

      it('isSufficientlyTested', (): void => {
        // Arrage
        when(parameters.testFactor).thenReturn(null)

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
        const gitDiffSummary: string = '5    5    File1.js\n5    5    File1Test.js'

        // Act
        codeMetrics.initialize(gitDiffSummary)

        // Assert
        expect(codeMetrics.isSufficientlyTested).to.equal(null)
        verify(taskLibWrapper.debug('* CodeMetrics.isSufficientlyTested')).twice()
      })
    })

    describe('initializer function', (): void => {
      async.each(
        [
          { file1: 9, file2: 8, file3: '-' },
          { file1: 20, file2: 5, file3: '-' },
          { file1: 1, file2: 7, file3: '-' }
        ], (entryObj): void => {
          it('should set all input values when all are specified', (): void => {
            // Arrange
            when(parameters.baseSize).thenReturn(5)
            when(parameters.growthRate).thenReturn(40)
            when(parameters.testFactor).thenReturn(20)
            when(parameters.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(parameters.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, 0, 0)

            // Act
            codeMetrics.initialize(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll'])
            // expect(codeMetrics.size).to.equal('S')
            verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).twice()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
          })
        })

      async.each(
        [
          { file1: 9, file2: 8, file3: 2 },
          { file1: 20, file2: 5, file3: 4 },
          { file1: 1, file2: 7, file3: 1 }
        ], (entryObj): void => {
          it('unused files have some changes', (): void => {
            // Arrange
            when(parameters.baseSize).thenReturn(5)
            when(parameters.growthRate).thenReturn(40)
            when(parameters.testFactor).thenReturn(20)
            when(parameters.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(parameters.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, 0, entryObj.file3)

            // Act
            codeMetrics.initialize(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.sizeIndicator).to.equal('S')
            verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).twice()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
          })
        })

      async.each(
        [
          { file1: 9, file2: 8, file3: 2, testFile: 8 },
          { file1: 20, file2: 5, file3: 4, testFile: 0 },
          { file1: 1, file2: 7, file3: 1, testFile: 24 }
        ], (entryObj): void => {
          it('test files and unused files have some changes', (): void => {
            // Arrange
            when(parameters.baseSize).thenReturn(5)
            when(parameters.growthRate).thenReturn(40)
            when(parameters.testFactor).thenReturn(20)
            when(parameters.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(parameters.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n${entryObj.testFile}    8    FileTest1.ts`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, entryObj.testFile, entryObj.file3)

            // Act
            codeMetrics.initialize(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.sizeIndicator).to.equal('S')
            verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).twice()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
          })
        })

      async.each(
        [
          { file1: 9, file2: 8, unusedFile: 2, testFile: 8, testFile2: 0 },
          { file1: 20, file2: 5, unusedFile: 4, testFile: 0, testFile2: 7 },
          { file1: 1, file2: 7, unusedFile: 1, testFile: 24, testFile2: 3 }
        ], (entryObj): void => {
          it('test files and unused files have some changes', (): void => {
            // Arrange
            when(parameters.baseSize).thenReturn(5)
            when(parameters.growthRate).thenReturn(40)
            when(parameters.testFactor).thenReturn(20)
            when(parameters.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(parameters.codeFileExtensions).thenReturn(['*.js', '*.ts'])
            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.unusedFile}    -    File.dll\n${entryObj.testFile}    8    FileTest1.ts\n${entryObj.testFile2} - fileT2.spec.ts`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, entryObj.testFile + entryObj.testFile2, entryObj.unusedFile)

            // Act
            codeMetrics.initialize(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.sizeIndicator).to.equal('S')
            verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).twice()
            verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
            verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
          })
        })
    })
    describe('initializer function', (): void => {
      async.each(
        [
          '',
          '  ',
          '\n'
        ], (input: string): void => {
          it('should throw an error', (): void => {
            // Arrage
            const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))

            // Act
            try {
              codeMetrics.initialize(input)
            } catch (error) {
              // Assert
              verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
              expect(error.message).to.equal('The git diff summary was empty.')
            }
          })
        })
      // it('should set all input values when all are specified', (): void => {
      //   // Arrange
      //   const parameters = new Parameters(instance(parameters), instance(taskLibWrapper))

      //   when(taskLibWrapper.getInput('BaseSize', false)).thenReturn('5.0')
      //   when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn('40')
      //   when(taskLibWrapper.getInput('TestFactor', false)).thenReturn('20')
      //   when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn('js\nts')
      //   when(taskLibWrapper.getInput('CodeFileExtensions', false)).thenReturn('js\nts')
      //   const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
      //   const gitDiffSummary: string = '9    1    File1.js\n0    9    File2.ts\n-    -    File.dll\n'
      //   const expectedMetrics: CodeMetricsData = new CodeMetricsData(9, 0, 0)

      //   // Act
      //   codeMetrics.initialize(gitDiffSummary)

      //   // Assert
      //   expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
      //   expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
      //   expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
      //   expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
      //   expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
      //   expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll'])
      //   expect(codeMetrics.sizeIndicator).to.equal('S')
      //   verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
      //   // verify(taskLibWrapper.debug('* CodeMetrics.extractFileMetrics()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.filterFiles()')).twice()
      //   verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
      //   // verify(taskLibWrapper.debug('* CodeMetrics.sizeIndicator')).once()
      //   // verify(taskLibWrapper.debug('* CodeMetrics.metrics')).once()
      // })

      // it('should set all input values when all are specified', (): void => {
      //   // Arrange
      //   const parameters = new Parameters(instance(parameters), instance(taskLibWrapper))

      //   when(taskLibWrapper.getInput('BaseSize', false)).thenReturn('5.0')
      //   when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn('40')
      //   when(taskLibWrapper.getInput('TestFactor', false)).thenReturn('20')
      //   when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn('js\nts')
      //   when(taskLibWrapper.getInput('CodeFileExtensions', false)).thenReturn('js\nts')
      //   const codeMetrics: CodeMetrics = new CodeMetrics(instance(parameters), instance(taskLibWrapper))
      //   const gitDiffSummary: string = '9    10    File1.js\n9    10    File2.ts\n-    -    File.dll\n'
      //   const expectedMetrics: CodeMetricsData = new CodeMetricsData(18, 0, 0)

      //   // Act
      //   codeMetrics.initialize(gitDiffSummary)

      //   // Assert
      //   expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
      //   expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
      //   expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
      //   expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
      //   expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
      //   expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll'])
      //   expect(codeMetrics.sizeIndicator).to.equal('S')
      //   verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
      //   // verify(taskLibWrapper.debug('* CodeMetrics.extractFileMetrics()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.filterFiles()')).twice()
      //   verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
      //   verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
      //   // verify(taskLibWrapper.debug('* CodeMetrics.sizeIndicator')).once()
      //   // verify(taskLibWrapper.debug('* CodeMetrics.metrics')).once()
      // })
    })

    describe('old tests', (): void => {

    })
  })
})
