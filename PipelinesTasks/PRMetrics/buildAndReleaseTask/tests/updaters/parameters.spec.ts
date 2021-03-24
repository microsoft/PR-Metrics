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
          parameters.initialize(currentBaseSize, '', '', '', '') // NaN

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
          parameters.initialize(currentBaseSize, '', '', '', '') // negative or zero

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
          parameters.initialize(currentBaseSize, '', '', '', '') // positive integer

          // Assert
          expect(parameters.baseSize).to.equal(parseInt(currentBaseSize))
        })
      })

    /** initializeGrowthRate */
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
          parameters.initialize('', currentGrowthRate, '', '', '') // NaN

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
          parameters.initialize('', currentGrowthRate, '', '', '') // NaN

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
        '7'
      ], (currentGrowthRate: string): void => {
        it(`initializeGrowthRate - should give the converted when it is greater than 1.0 '${currentGrowthRate}'`, (): void => {
          // Arrange

          const parameters: Parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

          // Act
          parameters.initialize('', currentGrowthRate, '', '', '') // NaN

          // Assert
          expect(parameters.growthRate).to.equal(parseFloat(currentGrowthRate))
        })
      })
  }) // end of describe
}) // end of describe
