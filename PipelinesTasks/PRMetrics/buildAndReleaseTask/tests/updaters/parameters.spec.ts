// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import ConsoleWrapper from '../../wrappers/consoleWrapper'
import Parameters from '../../updaters/parameters'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'

describe('parameters.ts', (): void => {
  const adjustingBaseSizeResource: string = 'Adjusting base size parameter to 250'
  const adjustingGrowthRateResource: string = 'Adjusting growth rate parameter to 2.0'
  const adjustingTestFactorResource: string = 'Adjusting test factor parameter to 1.5'
  const adjustingFileMatchingPatternsResource: string = 'Adjusting file matching patterns to **/*'
  const adjustCodeFileExtensionsResource: string = 'Adjusting code file extensions parameter to default values'

  let taskLibWrapper: TaskLibWrapper
  let consoleWrapper: ConsoleWrapper

  beforeEach((): void => {
    consoleWrapper = mock(ConsoleWrapper)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.parameters.adjustingBaseSize', '250')).thenReturn(adjustingBaseSizeResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingGrowthRate', '2')).thenReturn(adjustingGrowthRateResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingTestFactor', '1.5')).thenReturn(adjustingTestFactorResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingFileMatchingPatterns', '**/*')).thenReturn(adjustingFileMatchingPatternsResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingCodeFileExtensions')).thenReturn(adjustCodeFileExtensionsResource)
  })

  describe('initialize()', (): void => {
    describe('all parameters', (): void => {
      it('should set all default values when nothing is specified', (): void => {
        // Arrange
        const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

        // Act
        parameters.initialize('', '', '', '', '')

        // Assert
        expect(parameters.baseSize).to.equal(250)
        expect(parameters.growthRate).to.equal(2.0)
        expect(parameters.testFactor).to.equal(1.5)
        expect(parameters.fileMatchingPatterns).to.deep.equal(['**/*'])
        expect(parameters.codeFileExtensions.length).to.equal(108)
        verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
        verify(taskLibWrapper.debug('* Parameters.baseSize')).once()
        verify(taskLibWrapper.debug('* Parameters.growthRate')).once()
        verify(taskLibWrapper.debug('* Parameters.testFactor')).once()
        verify(taskLibWrapper.debug('* Parameters.fileMatchingPatterns')).once()
        verify(taskLibWrapper.debug('* Parameters.codeFileExtensions')).once()
        verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
        verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
        verify(consoleWrapper.log(adjustingTestFactorResource)).once()
        verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
        verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
      })

      it('should set all input values when all are specified', (): void => {
        // Arrange
        const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

        // Act
        parameters.initialize('5.0', '4.4', '2.7', 'aa\nbb', 'js\nts')

        // Assert
        expect(parameters.baseSize).to.equal(5.0)
        expect(parameters.growthRate).to.equal(4.4)
        expect(parameters.testFactor).to.equal(2.7)
        expect(parameters.fileMatchingPatterns).to.deep.equal(['aa', 'bb'])
        expect(parameters.codeFileExtensions).to.deep.equal(['*.js', '*.ts'])
        verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
        verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
        verify(taskLibWrapper.debug('* Parameters.baseSize')).once()
        verify(taskLibWrapper.debug('* Parameters.growthRate')).once()
        verify(taskLibWrapper.debug('* Parameters.testFactor')).once()
        verify(taskLibWrapper.debug('* Parameters.fileMatchingPatterns')).once()
        verify(taskLibWrapper.debug('* Parameters.codeFileExtensions')).once()
        verify(consoleWrapper.log(adjustingBaseSizeResource)).never()
        verify(consoleWrapper.log(adjustingGrowthRateResource)).never()
        verify(consoleWrapper.log(adjustingTestFactorResource)).never()
        verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).never()
        verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).never()
      })
    })

    describe('base size', (): void => {
      async.each(
        [
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (baseSize: string): void => {
          it(`should set a value of 250 when the input '${baseSize}' is invalid`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize(baseSize, '', '', '', '')

            // Assert
            expect(parameters.baseSize).to.equal(250)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.baseSize')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '0',
          '-1',
          '-1000',
          '-5'
        ], (baseSize: string): void => {
          it(`should set a value of 250 when the input '${baseSize}' is less than or equal to 0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize(baseSize, '', '', '', '')

            // Assert
            expect(parameters.baseSize).to.equal(250)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.baseSize')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '1',
          '5',
          '1000',
          '5.5'
        ], (baseSize: string): void => {
          it(`should set the converted value when the input '${baseSize}' is greater than 0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize(baseSize, '', '', '', '')

            // Assert
            expect(parameters.baseSize).to.equal(parseInt(baseSize))
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.baseSize')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).never()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })
    })

    describe('growth rate', (): void => {
      async.each(
        [
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (growthRate: string): void => {
          it(`should set a value of 2.0 when the input '${growthRate}' is invalid`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', growthRate, '', '', '')

            // Assert
            expect(parameters.growthRate).to.equal(2.0)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.growthRate')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '0',
          '0.5',
          '-2',
          '-1.2',
          '-5',
          '0.9999999999'
        ], (growthRate: string): void => {
          it(`should set a value of 2.0 when the input '${growthRate}' is less than 1.0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', growthRate, '', '', '')

            // Assert
            expect(parameters.growthRate).to.equal(2.0)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.growthRate')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '5',
          '2.0',
          '1000',
          '1',
          '1.001',
          '1.2',
          '1.0000000001',
          '1.09',
          '7'
        ], (growthRate: string): void => {
          it(`should set the converted value when the input '${growthRate}' is greater than or equal to 1.0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', growthRate, '', '', '')

            // Assert
            expect(parameters.growthRate).to.equal(parseFloat(growthRate))
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.growthRate')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).never()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })
    })

    describe('test factor', (): void => {
      async.each(
        [
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (testFactor: string): void => {
          it(`should set a value of 1.5 when the input '${testFactor}' is invalid`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', testFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(1.5)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.testFactor')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '-0.0000009',
          '-2',
          '-1.2',
          '-5',
          '-0.9999999999'
        ], (testFactor: string): void => {
          it(`should set a value of 1.5 when the input '${testFactor}' is less than 0.0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', testFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(1.5)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.testFactor')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '0',
          '5',
          '2.0',
          '1000',
          '1.001',
          '1.2',
          '0.000000000000009',
          '0.09',
          '7'
        ], (testFactor: string): void => {
          it(`should set the converted value when the input '${testFactor}' is greater than 0.0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', testFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(parseFloat(testFactor))
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.testFactor')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).never()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '0',
          '0.0'
        ], (testFactor: string): void => {
          it(`should set null when the input '${testFactor}' is equal to 0.0`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', testFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(null)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.testFactor')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).never()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })
    })

    describe('file matching patterns', (): void => {
      async.each(
        [
          '',
          ' ',
          '     ',
          '\n'
        ], (fileMatchingPatterns: string): void => {
          it(`should set a value of [**/*] when the input '${fileMatchingPatterns}' is invalid`, (): void => {
            // Arrange
            const expectedOutput: string[] = ['**/*']
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', fileMatchingPatterns, '')

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal(expectedOutput)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.fileMatchingPatterns')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          'abc',
          'abc def hik',
          '*.ada *.js *ts *.bb *txt'
        ], (fileMatchingPatterns: string): void => {
          it(`should not split '${fileMatchingPatterns}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', fileMatchingPatterns, '')

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal([fileMatchingPatterns])
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.fileMatchingPatterns')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).never()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          '*.ada\n*.js\n*.ts\n*.bb\n*.txt',
          'abc\ndef\nhij'
        ], (fileMatchingPatterns: string): void => {
          it(`should split '${fileMatchingPatterns}' at the newline character`, (): void => {
            // Arrange
            const expectedOutput: string[] = fileMatchingPatterns.split('\n')
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', fileMatchingPatterns, '')

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal(expectedOutput)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.fileMatchingPatterns')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).never()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })
    })

    describe('code file extensions', (): void => {
      async.each(
        [
          '',
          ' ',
          '     ',
          '\n'
        ], (codeFileExtensions: string): void => {
          it(`should set the default array when the input '${codeFileExtensions}' is invalid`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', '', codeFileExtensions)

            // Assert
            expect(parameters.codeFileExtensions.length).to.equal(108)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.codeFileExtensions')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).once()
          })
        })

      async.each(
        [
          'ada\njs\nts\nbb\ntxt',
          'abc\ndef\nhij',
          'ts'
        ], (codeFileExtensions: string): void => {
          it(`should split '${codeFileExtensions}' at the newline character`, (): void => {
            // Arrange
            const splitExtensions: string[] = codeFileExtensions.split('\n')
            const expectedResult: string[] = splitExtensions.map(entry => `*.${entry}`)

            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', '', codeFileExtensions)

            // Assert
            expect(parameters.codeFileExtensions).to.deep.equal(expectedResult)
            verify(taskLibWrapper.debug('* Parameters.initialize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeBaseSize()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeGrowthRate()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeTestFactor()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeFileMatchingPatterns()')).once()
            verify(taskLibWrapper.debug('* Parameters.initializeCodeFileExtensions()')).once()
            verify(taskLibWrapper.debug('* Parameters.codeFileExtensions')).once()
            verify(consoleWrapper.log(adjustingBaseSizeResource)).once()
            verify(consoleWrapper.log(adjustingGrowthRateResource)).once()
            verify(consoleWrapper.log(adjustingTestFactorResource)).once()
            verify(consoleWrapper.log(adjustingFileMatchingPatternsResource)).once()
            verify(consoleWrapper.log(adjustCodeFileExtensionsResource)).never()
          })
        })
    })
  })
})
