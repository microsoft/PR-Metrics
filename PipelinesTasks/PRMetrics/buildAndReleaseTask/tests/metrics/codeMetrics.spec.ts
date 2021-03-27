// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetrics from '../../src/metrics/codeMetrics'
import CodeMetricsData from '../../src/metrics/codeMetricsData'
import GitInvoker from '../../src/git/gitInvoker'
import Inputs from '../../src/metrics/inputs'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

const localizations = {
  titleSizeXS: 'XS',
  titleSizeS: 'S',
  titleSizeM: 'M',
  titleSizeL: 'L',
  titleSizeXL: 'XL',
  titleTestsSufficient: 'metrics.codeMetrics.titleTestsSufficient',
  titleTestsInsufficient: 'metrics.codeMetrics.titleTestsInsufficient'
}
describe('codeMetrics.ts', (): void => {
  let gitInvoker: GitInvoker
  let taskLibWrapper: TaskLibWrapper
  let inputs: Inputs

  beforeEach((): void => {
    gitInvoker = mock(GitInvoker)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXS')).thenReturn(localizations.titleSizeXS)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeS')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeM')).thenReturn(localizations.titleSizeM)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeL')).thenReturn(localizations.titleSizeL)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL')).thenReturn(localizations.titleSizeXL)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', '')).thenReturn(localizations.titleSizeXL)
    when(taskLibWrapper.loc(localizations.titleTestsSufficient)).thenReturn('sufficient')
    when(taskLibWrapper.loc(localizations.titleTestsInsufficient)).thenReturn('insufficient')

    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, localizations.titleTestsSufficient)).thenReturn(localizations.titleSizeXS + localizations.titleTestsSufficient)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, localizations.titleTestsInsufficient)).thenReturn(localizations.titleSizeXS + localizations.titleTestsInsufficient)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, localizations.titleTestsSufficient)).thenReturn(localizations.titleSizeS + localizations.titleTestsSufficient)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, localizations.titleTestsInsufficient)).thenReturn(localizations.titleSizeS + localizations.titleTestsInsufficient)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, localizations.titleTestsSufficient)).thenReturn(localizations.titleSizeM + localizations.titleTestsSufficient)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, localizations.titleTestsInsufficient)).thenReturn(localizations.titleSizeM + localizations.titleTestsInsufficient)

    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeXS, '')).thenReturn(localizations.titleSizeXS)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeS, '')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', localizations.titleSizeM, '')).thenReturn(localizations.titleSizeM)

    inputs = mock(Inputs)
    when(inputs.baseSize).thenReturn(5)
    when(inputs.growthRate).thenReturn(5)
    when(inputs.testFactor).thenReturn(5)
    when(inputs.fileMatchingPatterns).thenReturn(['*.js'])
    when(inputs.codeFileExtensions).thenReturn(['*.js'])
  })

  describe('initialize', (): void => {
    describe('size indicator test', (): void => {
      it('should be XS', (): void => {
      // Arrange

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '0    0    File1.js'

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.size).to.equal('XS')
        verify(taskLibWrapper.debug('* CodeMetrics.size')).once()
      })

      it('should be XS', (): void => {
        // Arrange
        const gitDiffSummary: string = '0    0    File1.js'
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)
        when(inputs.baseSize).thenReturn(0)
        when(inputs.growthRate).thenReturn(0)
        when(inputs.testFactor).thenReturn(0)
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))

        // Act

        // Assert
        expect(codeMetrics.size).to.equal('XS')
        verify(taskLibWrapper.debug('* CodeMetrics.size')).once()
      })

      it('should be S', (): void => {
        // Arrange

        when(inputs.baseSize).thenReturn(5)
        when(inputs.growthRate).thenReturn(5)
        when(inputs.testFactor).thenReturn(5)
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '5    0    File1.js'

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.size).to.equal('S')
        verify(taskLibWrapper.debug('* CodeMetrics.size')).once()
      })

      it('should be M', (): void => {
        // Arrange

        when(inputs.baseSize).thenReturn(5)
        when(inputs.growthRate).thenReturn(5)
        when(inputs.testFactor).thenReturn(5)
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '6    0    File1.js'

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.size).to.equal('M')
        verify(taskLibWrapper.debug('* CodeMetrics.size')).once()
      })

      it('should be L', (): void => {
        // Arrange

        when(inputs.baseSize).thenReturn(5)
        when(inputs.growthRate).thenReturn(2)
        when(inputs.testFactor).thenReturn(5)
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '20    0    File1.js'

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.size).to.equal('L')
        verify(taskLibWrapper.debug('* CodeMetrics.size')).once()
      })

      it('should be XL', (): void => {
        // Arrange

        when(inputs.baseSize).thenReturn(5)
        when(inputs.growthRate).thenReturn(2)
        when(inputs.testFactor).thenReturn(5)
        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '30    0    File1.js'

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.size).to.equal('XL')
        verify(taskLibWrapper.debug('* CodeMetrics.size')).once()
      })
    })

    describe('isSmall function', (): void => {
      async.each(
        [
          { productCode: 0, baseSize: 5 },
          { productCode: 5, baseSize: 4 },
          { productCode: 20, baseSize: 12 },
          { productCode: 7, baseSize: 7 }
        ], (entryObj): void => {
          it('isSmall', (): void => {
            // Arrange
            when(inputs.baseSize).thenReturn(entryObj.baseSize)

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.productCode}    5    File1.js`

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

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
            // Arrange
            when(inputs.testFactor).thenReturn(entryObj.testFactor)

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.productCode}    5    File1.js\n${entryObj.testCode}    5    File1Test.js`

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

            // Assert
            expect(codeMetrics.isSufficientlyTested).to.equal(entryObj.testCode >= (entryObj.productCode * entryObj.testFactor))
            verify(taskLibWrapper.debug('* CodeMetrics.isSufficientlyTested')).thrice()
          })
        })

      it('isSufficientlyTested', (): void => {
        // Arrange
        when(inputs.testFactor).thenReturn(null)

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '5    5    File1.js\n5    5    File1Test.js'

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

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
            when(inputs.baseSize).thenReturn(5)
            when(inputs.growthRate).thenReturn(40)
            when(inputs.testFactor).thenReturn(20)
            when(inputs.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, 0, 0)

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll'])
            // expect(codeMetrics.size).to.equal('S')
            verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
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
          { file1: '-', file2: 8, file3: 4 },
          { file1: '-', file2: 5, file3: 4 },
          { file1: '-', file2: 7, file3: 4 }
        ], (entryObj): void => {
          it('should set all input values when all are specified', (): void => {
            // Arrange
            when(inputs.baseSize).thenReturn(5)
            when(inputs.growthRate).thenReturn(40)
            when(inputs.testFactor).thenReturn(20)
            when(inputs.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n`

            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file2, 0, entryObj.file3)

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.size).to.equal('S')
            verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
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
            when(inputs.baseSize).thenReturn(5)
            when(inputs.growthRate).thenReturn(40)
            when(inputs.testFactor).thenReturn(20)
            when(inputs.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, 0, entryObj.file3)

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.sizeIndicator).to.equal('S')
            verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
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
            when(inputs.baseSize).thenReturn(5)
            when(inputs.growthRate).thenReturn(40)
            when(inputs.testFactor).thenReturn(20)
            when(inputs.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])

            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.file3}    -    File.dll\n${entryObj.testFile}    8    FileTest1.ts`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, entryObj.testFile, entryObj.file3)

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.sizeIndicator).to.equal('S')
            verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
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
            when(inputs.baseSize).thenReturn(5)
            when(inputs.growthRate).thenReturn(40)
            when(inputs.testFactor).thenReturn(20)
            when(inputs.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
            when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])
            const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
            const gitDiffSummary: string = `${entryObj.file1}    1    File1.js\n${entryObj.file2}    9    File2.ts\n${entryObj.unusedFile}    -    File.dll\n${entryObj.testFile}    8    FileTest1.ts\n${entryObj.testFile2} - fileT2.spec.ts`
            const expectedMetrics: CodeMetricsData = new CodeMetricsData(entryObj.file1 + entryObj.file2, entryObj.testFile + entryObj.testFile2, entryObj.unusedFile)

            // Act
            when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

            // Assert
            expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
            expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
            expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
            expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
            expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal(['File.dll'])
            expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
            // expect(codeMetrics.sizeIndicator).to.equal('S')
            verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
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
      // async.each(
      //   [
      //     '',
      //     '  ',
      //     '\n'
      //   ], (input: string): void => {
      //     it('should throw an error', (): void => {
      //       // Arrange
      //       const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))

      //       // Act
      //       try {
      //         when(gitInvoker.getDiffSummary()).thenReturn(input)
      //       } catch (error) {
      //         // Assert
      //         verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
      //         expect(error.message).to.equal('The git diff summary was empty.')
      //       }
      //     })
      //   })
      it('should set all input values when all are specified', (): void => {
        // Arrange
        when(inputs.baseSize).thenReturn(5)
        when(inputs.growthRate).thenReturn(40)
        when(inputs.testFactor).thenReturn(20)
        when(inputs.fileMatchingPatterns).thenReturn(['*.js', '*.ts'])
        when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '9    1    File1.js\n0    9    File2.ts\n-    -    File.dll\n'
        const expectedMetrics: CodeMetricsData = new CodeMetricsData(9, 0, 0)

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
        expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
        expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
        expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
        expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
        expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll'])
        // expect(codeMetrics.sizeIndicator).to.equal('S')
        verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).twice()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
      })

      it('should set all input values when all are specified', (): void => {
        // Arrange
        when(inputs.baseSize).thenReturn(5)
        when(inputs.growthRate).thenReturn(40)
        when(inputs.testFactor).thenReturn(20)
        when(inputs.fileMatchingPatterns).thenReturn(['**/*.js', '**/*.ts'])
        when(inputs.codeFileExtensions).thenReturn(['*.js', '*.ts'])

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '9    1    folder/File1.js\n0    9    folder/File2.ts\n-    -    File.dll\n'
        const expectedMetrics: CodeMetricsData = new CodeMetricsData(9, 0, 0)

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
        expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
        expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
        expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
        expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
        expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll'])
        // expect(codeMetrics.sizeIndicator).to.equal('S')
        verify(taskLibWrapper.debug('* when(gitInvoker.getDiffSummary()).thenReturn()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.createFileMetricsMap()')).twice()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
      })
    })

    describe('old tests', (): void => {
      it('called with ignored and renamed files 1', ():void => {
        // Arrange
        when(inputs.baseSize).thenReturn(50)
        when(inputs.growthRate).thenReturn(2.5)
        when(inputs.testFactor).thenReturn(1.0)
        when(inputs.fileMatchingPatterns).thenReturn(['**/*', '!File*.cs', '!**/*.dll', '!test/File*.cs', 'test/File2.cs'])
        when(inputs.codeFileExtensions).thenReturn(['*.cs', '*.dll'])

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '9    1    File1.cs\n' +
              '0    9    File2.cs\n' +
              '-    -    File.dll\n' +
              '9    1    {Folder_Old => Folder}/FileTest1.cs\n' +
              '0    9    File{a => t}est2.cs\n' +
              '-    -    F{a => i}leT{b => e}st.d{c => l}l\n' +
              '9    1    {test/File.cs => test/File1.cs}\n' +
              '0    9    {product => test}/File2.cs\n' +
              '-    -    {product => test}/File.dll\n'
        const expectedMetrics: CodeMetricsData = new CodeMetricsData(9, 18, 0)

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
        expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
        expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
        expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
        expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
        expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll', 'FileTest.dll', 'test/File.dll'])
      })

      it('called with ignored and renamed files 2', ():void => {
        // Arrange
        when(inputs.baseSize).thenReturn(50)
        when(inputs.growthRate).thenReturn(2.5)
        when(inputs.testFactor).thenReturn(1.0)
        when(inputs.fileMatchingPatterns).thenReturn(['*.cs', '**/*.cs'])
        when(inputs.codeFileExtensions).thenReturn(['*.cs'])

        const codeMetrics: CodeMetrics = new CodeMetrics(instance(gitInvoker), instance(inputs), instance(taskLibWrapper))
        const gitDiffSummary: string = '9    1    File1.cs\n' +
              '0    9    File2.cs\n' +
              '-    -    File.dll\n' +
              '9    1    {Folder_Old => Folder}/FileTest1.cs\n' +
              '0    9    File{a => t}est2.cs\n' +
              '-    -    F{a => i}leT{b => e}st.d{c => l}l\n' +
              '9    1    {test/File.cs => test/File1.cs}\n' +
              '0    9    {product => test}/File2.cs\n' +
              '-    -    {product => test}/File.dll\n'
        const expectedMetrics: CodeMetricsData = new CodeMetricsData(9, 18, 0)

        // Act
        when(gitInvoker.getDiffSummary()).thenReturn(gitDiffSummary)

        // Assert
        expect(codeMetrics.metrics.testCode).to.equal(expectedMetrics.testCode)
        expect(codeMetrics.metrics.productCode).to.equal(expectedMetrics.productCode)
        expect(codeMetrics.metrics.ignoredCode).to.equal(expectedMetrics.ignoredCode)
        expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)
        expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
        expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal(['File.dll', 'FileTest.dll', 'test/File.dll'])
      })
    })
  })
})
