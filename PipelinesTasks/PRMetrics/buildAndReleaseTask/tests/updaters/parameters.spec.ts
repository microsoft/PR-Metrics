// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { instance, mock } from 'ts-mockito'

import ConsoleWrapper from '../../wrappers/consoleWrapper'
import Parameters from '../../updaters/parameters'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import async from 'async'
import { expect } from 'chai'

describe('parameters.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper
  let consoleWrapper: ConsoleWrapper

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    consoleWrapper = mock(ConsoleWrapper)
  })
  describe('initialize', (): void => {
    describe('initializer function', (): void => {
      it('initialize - should give all default values', (): void => {
        // Arrange
        const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

        // // Act
        parameters.initialize('', '', '', '', '')

        // // Assert
        expect(parameters.baseSize).to.equal(250)
        expect(parameters.growthRate).to.equal(2.0)
        expect(parameters.testFactor).to.equal(1.5)
        expect(parameters.fileMatchingPatterns).to.deep.equal(['**/*'])
        expect(parameters.codeFileExtensions.length).to.equal(108)
      })

      it('initialize - should give all the expected values', (): void => {
        // Arrange
        const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

        // // Act
        parameters.initialize('5.0', '4.4', '2.7', 'aa\nbb', 'js\nts')

        // // Assert
        expect(parameters.baseSize).to.equal(5.0)
        expect(parameters.growthRate).to.equal(4.4)
        expect(parameters.testFactor).to.equal(2.7)
        expect(parameters.fileMatchingPatterns).to.deep.equal(['aa', 'bb'])
        expect(parameters.codeFileExtensions).to.deep.equal(['*.js', '*.ts'])
      })
    })

    describe('initializeBaseSize', (): void => {
      async.each(
        [
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (currentBaseSize: string): void => {
          it(`initializeBaseSize - should give a value of 250 when base size is invalid input '${currentBaseSize}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize(currentBaseSize, '', '', '', '')

            // Assert
            expect(parameters.baseSize).to.equal(250)
          })
        })

      async.each(
        [
          '0',
          '-1',
          '-1000',
          '-5'
        ], (currentBaseSize: string): void => {
          it(`initializeBaseSize - should give a value of 250 when base size is less than or equal to 0 '${currentBaseSize}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize(currentBaseSize, '', '', '', '')

            // Assert
            expect(parameters.baseSize).to.equal(250)
          })
        })

      async.each(
        [
          '1',
          '5',
          '1000',
          '5.5'
        ], (currentBaseSize: string): void => {
          it(`initializeBaseSize - should give the converted value when base size is greater than 0 '${currentBaseSize}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize(currentBaseSize, '', '', '', '')

            // Assert
            expect(parameters.baseSize).to.equal(parseInt(currentBaseSize))
          })
        })
    })

    describe('initializeGrowthRate', (): void => {
      async.each(
        [
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (currentGrowthRate: string): void => {
          it(`initializeGrowthRate - should give a value of 2.0 when base size is invalid input '${currentGrowthRate}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', currentGrowthRate, '', '', '')

            // Assert
            expect(parameters.growthRate).to.equal(2.0)
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
        ], (currentGrowthRate: string): void => {
          it(`initializeGrowthRate - should give a value of 2.0 when converted value is less than 1.0 '${currentGrowthRate}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', currentGrowthRate, '', '', '')

            // Assert
            expect(parameters.growthRate).to.equal(2.0)
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
        ], (currentGrowthRate: string): void => {
          it(`initializeGrowthRate - should give the converted when it is greater than 1.0 '${currentGrowthRate}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', currentGrowthRate, '', '', '')

            // Assert
            expect(parameters.growthRate).to.equal(parseFloat(currentGrowthRate))
          })
        })
    })
    describe('initializeTestFactor', (): void => {
      async.each(
        [
          '',
          ' ',
          'abc',
          '===',
          '!2',
          'null',
          'undefined'
        ], (currentTestFactor: string): void => {
          it(`initializeTestFactor - should give a value of 1.5 when base size is invalid input '${currentTestFactor}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', currentTestFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(1.5)
          })
        })

      async.each(
        [
          '0',
          '-0.0000009',
          '-2',
          '-1.2',
          '-5',
          '-0.9999999999'
        ], (currentTestFactor: string): void => {
          it(`initializeTestFactor - should give a value of 1.5 when converted value is less than 0.0 '${currentTestFactor}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', currentTestFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(1.5)
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
        ], (currentTestFactor: string): void => {
          it(`initializeTestFactor - should give the converted when it is greater than 0.0 '${currentTestFactor}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', currentTestFactor, '', '')

            // Assert
            expect(parameters.testFactor).to.equal(parseFloat(currentTestFactor))
          })
        })
    })
    describe('initializeFileMatchingPatterns', (): void => {
      async.each(
        [
          '',
          ' ',
          '     ',
          '\n'
        ], (currentFileMatchingPatterns: string): void => {
          it(`initializeFileMatchingPatterns - should give a value of [**/*] when input is invalid '${currentFileMatchingPatterns}'`, (): void => {
            // Arrange
            const expectedOutput: string[] = ['**/*']
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', currentFileMatchingPatterns, '')

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal(expectedOutput)
          })
        })

      async.each(
        [
          'abc',
          'abc def hik',
          '*.ada *.js *ts *.bb *txt'
        ], (currentFileMatchingPatterns: string): void => {
          it(`initializeFileMatchingPatterns - should not break the string up '${currentFileMatchingPatterns}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', currentFileMatchingPatterns, '')

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal([currentFileMatchingPatterns])
          })
        })

      async.each(
        [
          '*.ada\n*.js\n*.ts\n*.bb\n*.txt',
          'abc\ndef\nhij'
        ], (currentFileMatchingPatterns: string): void => {
          it(`initializeFileMatchingPatterns - should break the string at the newline character '${currentFileMatchingPatterns}'`, (): void => {
            // Arrange
            const expectedOutput: string[] = currentFileMatchingPatterns.split('\n')
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', currentFileMatchingPatterns, '')

            // Assert
            expect(parameters.fileMatchingPatterns).to.deep.equal(expectedOutput)
          })
        })
    })

    describe('initializeCodeFileExtensions', (): void => {
      async.each(
        [
          '',
          ' ',
          '     ',
          '\n'
        ], (currentCodeFileExtensions: string): void => {
          it(`initializeCodeFileExtensions - should give the default array when input is invalid '${currentCodeFileExtensions}'`, (): void => {
            // Arrange
            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', '', currentCodeFileExtensions)

            // Assert
            expect(parameters.codeFileExtensions.length).to.equal(108)
          })
        })

      async.each(
        [
          'ada\njs\nts\nbb\ntxt',
          'abc\ndef\nhij',
          'ts'
        ], (currentCodeFileExtensions: string): void => {
          it(`initializeCodeFileExtensions - should break the string at the newline character '${currentCodeFileExtensions}'`, (): void => {
            // Arrange
            const splittedExtensions: string[] = currentCodeFileExtensions.split('\n')
            const expectedResult: string[] = splittedExtensions.map(entry => `*.${entry}`)

            const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

            // Act
            parameters.initialize('', '', '', '', currentCodeFileExtensions)

            // Assert
            expect(parameters.codeFileExtensions).to.deep.equal(expectedResult)
          })
        })
    })
  }) // end of describe
}) // end of describe
