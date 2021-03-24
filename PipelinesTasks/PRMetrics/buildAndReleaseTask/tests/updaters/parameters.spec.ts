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
  })
})
