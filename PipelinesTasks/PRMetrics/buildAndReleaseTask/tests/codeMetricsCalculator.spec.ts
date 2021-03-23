// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TaskLibWrapper from '../wrappers/taskLibWrapper'
import { mock, when } from 'ts-mockito'

describe('codeMetricsCalculator.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.pullRequest.addDescription')).thenReturn('❌ **Add a description.**')
  })
})
