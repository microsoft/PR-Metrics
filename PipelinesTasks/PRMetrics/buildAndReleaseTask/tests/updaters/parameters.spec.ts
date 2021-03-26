// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { ParametersDefault } from '../../updaters/parametersDefault'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import ConsoleWrapper from '../../wrappers/consoleWrapper'
import Parameters from '../../updaters/parameters'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'

describe('parameters.ts', (): void => {
  const adjustingBaseSizeResource: string = `Adjusting base size parameter to ${ParametersDefault.baseSize}`
  const adjustingGrowthRateResource: string = `Adjusting growth rate parameter to ${ParametersDefault.growthRate}`
  const adjustingTestFactorResource: string = `Adjusting test factor parameter to ${ParametersDefault.testFactor}`
  const adjustingFileMatchingPatternsResource: string = `Adjusting file matching patterns to ${JSON.stringify(ParametersDefault.fileMatchingPatterns)}`
  const adjustCodeFileExtensionsResource: string = 'Adjusting code file extensions parameter to default values'

  let taskLibWrapper: TaskLibWrapper
  let consoleWrapper: ConsoleWrapper

  beforeEach((): void => {
    consoleWrapper = mock(ConsoleWrapper)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.getInput('BaseSize', false)).thenReturn('')
    when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn('')
    when(taskLibWrapper.getInput('TestFactor', false)).thenReturn('')
    when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn('')
    when(taskLibWrapper.getInput('CodeFileExtensions', false)).thenReturn('')
    when(taskLibWrapper.loc('updaters.parameters.adjustingBaseSize', ParametersDefault.baseSize.toLocaleString())).thenReturn(adjustingBaseSizeResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingGrowthRate', ParametersDefault.growthRate.toLocaleString())).thenReturn(adjustingGrowthRateResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingTestFactor', ParametersDefault.testFactor.toLocaleString())).thenReturn(adjustingTestFactorResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingFileMatchingPatterns', JSON.stringify(ParametersDefault.fileMatchingPatterns))).thenReturn(adjustingFileMatchingPatternsResource)
    when(taskLibWrapper.loc('updaters.parameters.adjustingCodeFileExtensions')).thenReturn(adjustCodeFileExtensionsResource)
  })

  describe('initialize()', (): void => {
    describe('all parameters', (): void => {
      it('should set all default values when nothing is specified', (): void => {
        // Act
        const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

        // Assert
        expect(parameters.baseSize).to.equal(ParametersDefault.baseSize)
        expect(parameters.growthRate).to.equal(ParametersDefault.growthRate)
        expect(parameters.testFactor).to.equal(ParametersDefault.testFactor)
        expect(parameters.fileMatchingPatterns).to.deep.equal(ParametersDefault.fileMatchingPatterns)
        expect(parameters.codeFileExtensions).to.deep.equal(ParametersDefault.codeFileExtensions)
        verify(taskLibWrapper.debug('* Parameters.initialize()')).times(5)
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
        when(taskLibWrapper.getInput('BaseSize', false)).thenReturn('5.0')
        when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn('4.4')
        when(taskLibWrapper.getInput('TestFactor', false)).thenReturn('2.7')
        when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn('aa\nbb')
        when(taskLibWrapper.getInput('CodeFileExtensions', false)).thenReturn('js\nts')

        // Act
        const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

        // Assert
        expect(parameters.baseSize).to.equal(5.0)
        expect(parameters.growthRate).to.equal(4.4)
        expect(parameters.testFactor).to.equal(2.7)
        expect(parameters.fileMatchingPatterns).to.deep.equal(['aa', 'bb'])
        expect(parameters.codeFileExtensions).to.deep.equal(['*.js', '*.ts'])
        verify(taskLibWrapper.debug('* Parameters.initialize()')).times(5)
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
          undefined,
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (baseSize: string | undefined): void => {
          it(`should set the default when the input '${baseSize}' is invalid`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('BaseSize', false)).thenReturn(baseSize)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.baseSize).to.equal(ParametersDefault.baseSize)
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
          it(`should set the default when the input '${baseSize}' is less than or equal to 0`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('BaseSize', false)).thenReturn(baseSize)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.baseSize).to.equal(ParametersDefault.baseSize)
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
            when(taskLibWrapper.getInput('BaseSize', false)).thenReturn(baseSize)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
          undefined,
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (growthRate: string | undefined): void => {
          it(`should set the default when the input '${growthRate}' is invalid`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn(growthRate)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.growthRate).to.equal(ParametersDefault.growthRate)
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
          it(`should set the default when the input '${growthRate}' is less than 1.0`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn(growthRate)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.growthRate).to.equal(ParametersDefault.growthRate)
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
            when(taskLibWrapper.getInput('GrowthRate', false)).thenReturn(growthRate)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
          undefined,
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (testFactor: string | undefined): void => {
          it(`should set the default when the input '${testFactor}' is invalid`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.testFactor).to.equal(ParametersDefault.testFactor)
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
          it(`should set the default when the input '${testFactor}' is less than 0.0`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.testFactor).to.equal(ParametersDefault.testFactor)
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
            when(taskLibWrapper.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
            when(taskLibWrapper.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
          undefined,
          '',
          ' ',
          '     ',
          '\n'
        ], (fileMatchingPatterns: string | undefined): void => {
          it(`should set the default when the input '${fileMatchingPatterns?.replace(/\n/g, '\\n')}' is invalid`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn(fileMatchingPatterns)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal(ParametersDefault.fileMatchingPatterns)
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
            when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn(fileMatchingPatterns)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
          it(`should split '${fileMatchingPatterns.replace(/\n/g, '\\n')}' at the newline character`, (): void => {
            // Arrange
            const expectedOutput: string[] = fileMatchingPatterns.split('\n')
            when(taskLibWrapper.getInput('FileMatchingPatterns', false)).thenReturn(fileMatchingPatterns)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
          undefined,
          '',
          ' ',
          '     ',
          '\n'
        ], (codeFileExtensions: string | undefined): void => {
          it(`should set the default when the input '${codeFileExtensions?.replace(/\n/g, '\\n')}' is invalid`, (): void => {
            // Arrange
            when(taskLibWrapper.getInput('CodeFileExtensions', false)).thenReturn(codeFileExtensions)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Assert
            expect(parameters.codeFileExtensions).to.deep.equal(ParametersDefault.codeFileExtensions)
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
          it(`should split '${codeFileExtensions.replace(/\n/g, '\\n')}' at the newline character`, (): void => {
            // Arrange
            const splitExtensions: string[] = codeFileExtensions.split('\n')
            const expectedResult: string[] = splitExtensions.map(entry => `*.${entry}`)
            when(taskLibWrapper.getInput('CodeFileExtensions', false)).thenReturn(codeFileExtensions)

            // Act
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

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
