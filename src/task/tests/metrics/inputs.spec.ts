// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anyString, instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import { InputsDefault } from '../../src/metrics/inputsDefault'
import async from 'async'
import Inputs from '../../src/metrics/inputs'
import Logger from '../../src/utilities/logger'
import RunnerInvoker from '../../src/runners/runnerInvoker'

describe('inputs.ts', (): void => {
  const adjustingBaseSizeResource: string = `Adjusting the base size input to '${InputsDefault.baseSize}'.`
  const adjustingGrowthRateResource: string = `Adjusting the growth rate input to '${InputsDefault.growthRate}'.`
  const adjustingTestFactorResource: string = `Adjusting the test factor input to '${InputsDefault.testFactor}'.`
  const adjustingFileMatchingPatternsResource: string = `Adjusting the file matching patterns input to '${JSON.stringify(InputsDefault.fileMatchingPatterns)}'.`
  const adjustingCodeFileExtensionsResource: string = `Adjusting the code file extensions input to '${JSON.stringify(InputsDefault.codeFileExtensions)}'.`
  const disablingTestFactorResource: string = 'Disabling the test factor validation.'
  const settingBaseSizeResource: string = 'Setting the base size input to \'VALUE\'.'
  const settingGrowthRateResource: string = 'Setting the growth rate input to \'VALUE\'.'
  const settingTestFactorResource: string = 'Setting the test factor input to \'VALUE\'.'
  const settingFileMatchingPatternsResource: string = 'Setting the file matching patterns input to \'VALUE\'.'
  const settingCodeFileExtensionsResource: string = 'Setting the code file extensions input to \'VALUE\'.'

  let logger: Logger
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    logger = mock(Logger)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.getInput('BaseSize', false)).thenReturn('')
    when(runnerInvoker.getInput('GrowthRate', false)).thenReturn('')
    when(runnerInvoker.getInput('TestFactor', false)).thenReturn('')
    when(runnerInvoker.getInput('FileMatchingPatterns', false)).thenReturn('')
    when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn('')
    when(runnerInvoker.loc('metrics.inputs.adjustingBaseSize', InputsDefault.baseSize.toLocaleString())).thenReturn(adjustingBaseSizeResource)
    when(runnerInvoker.loc('metrics.inputs.adjustingGrowthRate', InputsDefault.growthRate.toLocaleString())).thenReturn(adjustingGrowthRateResource)
    when(runnerInvoker.loc('metrics.inputs.adjustingTestFactor', InputsDefault.testFactor.toLocaleString())).thenReturn(adjustingTestFactorResource)
    when(runnerInvoker.loc('metrics.inputs.adjustingFileMatchingPatterns', JSON.stringify(InputsDefault.fileMatchingPatterns))).thenReturn(adjustingFileMatchingPatternsResource)
    when(runnerInvoker.loc('metrics.inputs.adjustingCodeFileExtensions', JSON.stringify(InputsDefault.codeFileExtensions))).thenReturn(adjustingCodeFileExtensionsResource)
    when(runnerInvoker.loc('metrics.inputs.disablingTestFactor')).thenReturn(disablingTestFactorResource)
    when(runnerInvoker.loc('metrics.inputs.settingBaseSize', anyString())).thenReturn(settingBaseSizeResource)
    when(runnerInvoker.loc('metrics.inputs.settingGrowthRate', anyString())).thenReturn(settingGrowthRateResource)
    when(runnerInvoker.loc('metrics.inputs.settingTestFactor', anyString())).thenReturn(settingTestFactorResource)
    when(runnerInvoker.loc('metrics.inputs.settingFileMatchingPatterns', anyString())).thenReturn(settingFileMatchingPatternsResource)
    when(runnerInvoker.loc('metrics.inputs.settingCodeFileExtensions', anyString())).thenReturn(settingCodeFileExtensionsResource)
  })

  describe('initialize()', (): void => {
    describe('all inputs', (): void => {
      it('should set all default values when nothing is specified', (): void => {
        // Act
        const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

        // Assert
        expect(inputs.baseSize).to.equal(InputsDefault.baseSize)
        expect(inputs.growthRate).to.equal(InputsDefault.growthRate)
        expect(inputs.testFactor).to.equal(InputsDefault.testFactor)
        expect(inputs.fileMatchingPatterns).to.deep.equal(InputsDefault.fileMatchingPatterns)
        expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(InputsDefault.codeFileExtensions))
        verify(logger.logDebug('* Inputs.initialize()')).times(5)
        verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
        verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
        verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
        verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
        verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
        verify(logger.logDebug('* Inputs.baseSize')).once()
        verify(logger.logDebug('* Inputs.growthRate')).once()
        verify(logger.logDebug('* Inputs.testFactor')).once()
        verify(logger.logDebug('* Inputs.fileMatchingPatterns')).once()
        verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
        verify(logger.logInfo(adjustingBaseSizeResource)).once()
        verify(logger.logInfo(adjustingGrowthRateResource)).once()
        verify(logger.logInfo(adjustingTestFactorResource)).once()
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
        verify(logger.logInfo(disablingTestFactorResource)).never()
        verify(logger.logInfo(settingBaseSizeResource)).never()
        verify(logger.logInfo(settingGrowthRateResource)).never()
        verify(logger.logInfo(settingTestFactorResource)).never()
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
        verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
      })

      it('should set all input values when all are specified', (): void => {
        // Arrange
        when(runnerInvoker.getInput('BaseSize', false)).thenReturn('5.0')
        when(runnerInvoker.getInput('GrowthRate', false)).thenReturn('4.4')
        when(runnerInvoker.getInput('TestFactor', false)).thenReturn('2.7')
        when(runnerInvoker.getInput('FileMatchingPatterns', false)).thenReturn('aa\nbb')
        when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn('js\nts')

        // Act
        const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

        // Assert
        expect(inputs.baseSize).to.equal(5.0)
        expect(inputs.growthRate).to.equal(4.4)
        expect(inputs.testFactor).to.equal(2.7)
        expect(inputs.fileMatchingPatterns).to.deep.equal(['aa', 'bb'])
        expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(['js', 'ts']))
        verify(logger.logDebug('* Inputs.initialize()')).times(5)
        verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
        verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
        verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
        verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
        verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
        verify(logger.logDebug('* Inputs.baseSize')).once()
        verify(logger.logDebug('* Inputs.growthRate')).once()
        verify(logger.logDebug('* Inputs.testFactor')).once()
        verify(logger.logDebug('* Inputs.fileMatchingPatterns')).once()
        verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
        verify(logger.logInfo(adjustingBaseSizeResource)).never()
        verify(logger.logInfo(adjustingGrowthRateResource)).never()
        verify(logger.logInfo(adjustingTestFactorResource)).never()
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).never()
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never()
        verify(logger.logInfo(disablingTestFactorResource)).never()
        verify(logger.logInfo(settingBaseSizeResource)).once()
        verify(logger.logInfo(settingGrowthRateResource)).once()
        verify(logger.logInfo(settingTestFactorResource)).once()
        verify(logger.logInfo(settingFileMatchingPatternsResource)).once()
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once()
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
            when(runnerInvoker.getInput('BaseSize', false)).thenReturn(baseSize)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.baseSize).to.equal(InputsDefault.baseSize)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.baseSize')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('BaseSize', false)).thenReturn(baseSize)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.baseSize).to.equal(InputsDefault.baseSize)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.baseSize')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('BaseSize', false)).thenReturn(baseSize)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.baseSize).to.equal(parseInt(baseSize))
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.baseSize')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).never()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).once()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('GrowthRate', false)).thenReturn(growthRate)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.growthRate).to.equal(InputsDefault.growthRate)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.growthRate')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
          })
        })

      async.each(
        [
          '0',
          '0.5',
          '1',
          '-2',
          '-1.2',
          '-5',
          '0.9999999999'
        ], (growthRate: string): void => {
          it(`should set the default when the input '${growthRate}' is less than or equal to 1.0`, (): void => {
            // Arrange
            when(runnerInvoker.getInput('GrowthRate', false)).thenReturn(growthRate)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.growthRate).to.equal(InputsDefault.growthRate)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.growthRate')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
          })
        })

      async.each(
        [
          '5',
          '2.0',
          '1000',
          '1.001',
          '1.2',
          '1.0000000001',
          '1.09',
          '7'
        ], (growthRate: string): void => {
          it(`should set the converted value when the input '${growthRate}' is greater than 1.0`, (): void => {
            // Arrange
            when(runnerInvoker.getInput('GrowthRate', false)).thenReturn(growthRate)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.growthRate).to.equal(parseFloat(growthRate))
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.growthRate')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).never()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).once()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.testFactor).to.equal(InputsDefault.testFactor)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.testFactor')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.testFactor).to.equal(InputsDefault.testFactor)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.testFactor')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.testFactor).to.equal(parseFloat(testFactor))
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.testFactor')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).never()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).once()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
          })
        })

      async.each(
        [
          '0',
          '0.0'
        ], (testFactor: string): void => {
          it(`should set null when the input '${testFactor}' is equal to 0.0`, (): void => {
            // Arrange
            when(runnerInvoker.getInput('TestFactor', false)).thenReturn(testFactor)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.testFactor).to.equal(null)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.testFactor')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).never()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).once()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('FileMatchingPatterns', false)).thenReturn(fileMatchingPatterns)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.fileMatchingPatterns).to.deep.equal(InputsDefault.fileMatchingPatterns)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.fileMatchingPatterns')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('FileMatchingPatterns', false)).thenReturn(fileMatchingPatterns)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.fileMatchingPatterns).to.deep.equal([fileMatchingPatterns])
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.fileMatchingPatterns')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('FileMatchingPatterns', false)).thenReturn(fileMatchingPatterns)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.fileMatchingPatterns).to.deep.equal(expectedOutput)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.fileMatchingPatterns')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn(codeFileExtensions)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(InputsDefault.codeFileExtensions))
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).once()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).never()
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
            const expectedResult: Set<string> = new Set<string>(codeFileExtensions.split('\n'))
            when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn(codeFileExtensions)

            // Act
            const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

            // Assert
            expect(inputs.codeFileExtensions).to.deep.equal(expectedResult)
            verify(logger.logDebug('* Inputs.initialize()')).once()
            verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
            verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
            verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
            verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
            verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
            verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
            verify(logger.logInfo(adjustingBaseSizeResource)).once()
            verify(logger.logInfo(adjustingGrowthRateResource)).once()
            verify(logger.logInfo(adjustingTestFactorResource)).once()
            verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
            verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never()
            verify(logger.logInfo(disablingTestFactorResource)).never()
            verify(logger.logInfo(settingBaseSizeResource)).never()
            verify(logger.logInfo(settingGrowthRateResource)).never()
            verify(logger.logInfo(settingTestFactorResource)).never()
            verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
            verify(logger.logInfo(settingCodeFileExtensionsResource)).once()
          })
        })

      it('should handle repeated insertion of identical items', (): void => {
        // Arrange
        when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn('ada\nada')

        // Act
        const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

        // Assert
        expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(['ada']))
        verify(logger.logDebug('* Inputs.initialize()')).once()
        verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
        verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
        verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
        verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
        verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
        verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
        verify(logger.logInfo(adjustingBaseSizeResource)).once()
        verify(logger.logInfo(adjustingGrowthRateResource)).once()
        verify(logger.logInfo(adjustingTestFactorResource)).once()
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never()
        verify(logger.logInfo(disablingTestFactorResource)).never()
        verify(logger.logInfo(settingBaseSizeResource)).never()
        verify(logger.logInfo(settingGrowthRateResource)).never()
        verify(logger.logInfo(settingTestFactorResource)).never()
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once()
      })

      it('should convert extensions to lower case', (): void => {
        // Arrange
        when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn('ADA\ncS\nTxT')

        // Act
        const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

        // Assert
        expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(['ada', 'cs', 'txt']))
        verify(logger.logDebug('* Inputs.initialize()')).once()
        verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
        verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
        verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
        verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
        verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
        verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
        verify(logger.logInfo(adjustingBaseSizeResource)).once()
        verify(logger.logInfo(adjustingGrowthRateResource)).once()
        verify(logger.logInfo(adjustingTestFactorResource)).once()
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never()
        verify(logger.logInfo(disablingTestFactorResource)).never()
        verify(logger.logInfo(settingBaseSizeResource)).never()
        verify(logger.logInfo(settingGrowthRateResource)).never()
        verify(logger.logInfo(settingTestFactorResource)).never()
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once()
      })

      it('should remove . and * from extension names', (): void => {
        // Arrange
        when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn('*.ada\n.txt')

        // Act
        const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

        // Assert
        expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(['ada', 'txt']))
        verify(logger.logDebug('* Inputs.initialize()')).once()
        verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
        verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
        verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
        verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
        verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
        verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
        verify(logger.logInfo(adjustingBaseSizeResource)).once()
        verify(logger.logInfo(adjustingGrowthRateResource)).once()
        verify(logger.logInfo(adjustingTestFactorResource)).once()
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never()
        verify(logger.logInfo(disablingTestFactorResource)).never()
        verify(logger.logInfo(settingBaseSizeResource)).never()
        verify(logger.logInfo(settingGrowthRateResource)).never()
        verify(logger.logInfo(settingTestFactorResource)).never()
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once()
      })

      it('should convert extensions to lower case', (): void => {
        // Arrange
        when(runnerInvoker.getInput('CodeFileExtensions', false)).thenReturn('ADA\ncS\nTxT')

        // Act
        const inputs: Inputs = new Inputs(instance(logger), instance(runnerInvoker))

        // Assert
        expect(inputs.codeFileExtensions).to.deep.equal(new Set<string>(['ada', 'cs', 'txt']))
        verify(logger.logDebug('* Inputs.initialize()')).once()
        verify(logger.logDebug('* Inputs.initializeBaseSize()')).once()
        verify(logger.logDebug('* Inputs.initializeGrowthRate()')).once()
        verify(logger.logDebug('* Inputs.initializeTestFactor()')).once()
        verify(logger.logDebug('* Inputs.initializeFileMatchingPatterns()')).once()
        verify(logger.logDebug('* Inputs.initializeCodeFileExtensions()')).once()
        verify(logger.logDebug('* Inputs.codeFileExtensions')).once()
        verify(logger.logInfo(adjustingBaseSizeResource)).once()
        verify(logger.logInfo(adjustingGrowthRateResource)).once()
        verify(logger.logInfo(adjustingTestFactorResource)).once()
        verify(logger.logInfo(adjustingFileMatchingPatternsResource)).once()
        verify(logger.logInfo(adjustingCodeFileExtensionsResource)).never()
        verify(logger.logInfo(disablingTestFactorResource)).never()
        verify(logger.logInfo(settingBaseSizeResource)).never()
        verify(logger.logInfo(settingGrowthRateResource)).never()
        verify(logger.logInfo(settingTestFactorResource)).never()
        verify(logger.logInfo(settingFileMatchingPatternsResource)).never()
        verify(logger.logInfo(settingCodeFileExtensionsResource)).once()
      })
    })
  })
})
