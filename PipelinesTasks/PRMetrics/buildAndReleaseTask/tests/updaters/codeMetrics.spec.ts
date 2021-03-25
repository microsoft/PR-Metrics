// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { instance, mock, verify, when } from 'ts-mockito'

import CodeMetrics from '../../updaters/codeMetrics'
import ConsoleWrapper from '../../wrappers/consoleWrapper'
import Metrics from '../../updaters/metrics'
import Parameters from '../../updaters/parameters'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import { expect } from 'chai'

const localizations = {
  titleSizeXS: 'XS',
  titleSizeS: 'S',
  titleSizeM: 'M',
  titleSizeL: 'L',
  titleSizeXL: 'XL'
}
describe('codeMetrics.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper
  let consoleWrapper: ConsoleWrapper
  let parameters: Parameters

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    consoleWrapper = mock(ConsoleWrapper)
    parameters = new Parameters(instance(consoleWrapper), instance(taskLibWrapper))

    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeXS')).thenReturn(localizations.titleSizeXS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeS')).thenReturn(localizations.titleSizeS)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeM')).thenReturn(localizations.titleSizeM)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeL')).thenReturn(localizations.titleSizeL)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeXL')).thenReturn(localizations.titleSizeXL)
  })

  describe('initialize', (): void => {
    describe('initializer function', (): void => {
      it('initialize - should give all default values', (): void => {
        // Arrage
        parameters.initialize('', '', '', '', '')
        const codeMetrics: CodeMetrics = new CodeMetrics(parameters, instance(taskLibWrapper))

        // Act
        codeMetrics.initialize('')

        // Assert
        const expectedMetrics: Metrics = new Metrics(0, 0, 0)
        expect(codeMetrics.ignoredFilesWithLinesAdded).to.deep.equal([])
        expect(codeMetrics.ignoredFilesWithoutLinesAdded).to.deep.equal([])
        expect(codeMetrics.sizeIndicator).to.equal(localizations.titleSizeXS)
        expect(codeMetrics.metrics).to.deep.equal(expectedMetrics)

        verify(taskLibWrapper.debug('* CodeMetrics.initialize()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.extractFileMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.filterFiles()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.constructMetrics()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.initializeSizeIndicator()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.calculateSize()')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithLinesAdded')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.ignoredFilesWithoutLinesAdded')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.sizeIndicator')).once()
        verify(taskLibWrapper.debug('* CodeMetrics.metrics')).once()
      })
    })
    describe('initializeMetrics', (): void => {

    })
    describe('initializeSizeIndicator', (): void => {})
  })
})
