// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import CodeMetricsCalculator from '../src/metrics/codeMetricsCalculator'
import Logger from '../src/utilities/logger'
import PullRequestMetrics from '../src/pullRequestMetrics'
import RunnerInvoker from '../src/runners/runnerInvoker'

describe('pullRequestMetrics.ts', (): void => {
  let codeMetricsCalculator: CodeMetricsCalculator
  let logger: Logger
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    codeMetricsCalculator = mock(CodeMetricsCalculator)
    logger = mock(Logger)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.loc('pullRequestMetrics.succeeded')).thenReturn('PR Metrics succeeded')
  })

  describe('run()', (): void => {
    it('should skip when receiving a skip flag', async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(instance(codeMetricsCalculator), instance(logger), instance(runnerInvoker))
      when(codeMetricsCalculator.shouldSkip).thenReturn('Skip')

      // Act
      await pullRequestMetrics.run('Folder')

      // Assert
      verify(runnerInvoker.locInitialize('Folder')).once()
      verify(runnerInvoker.setStatusSkipped('Skip')).once()
    })

    it('should fail when receiving a stop flag', async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(instance(codeMetricsCalculator), instance(logger), instance(runnerInvoker))
      when(codeMetricsCalculator.shouldStop()).thenResolve('Stop')

      // Act
      await pullRequestMetrics.run('Folder')

      // Assert
      verify(runnerInvoker.locInitialize('Folder')).once()
      verify(runnerInvoker.setStatusFailed('Stop')).once()
    })

    it('should succeed when no skip or stop flag is received', async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(instance(codeMetricsCalculator), instance(logger), instance(runnerInvoker))

      // Act
      await pullRequestMetrics.run('Folder')

      // Assert
      verify(runnerInvoker.locInitialize('Folder')).once()
      verify(codeMetricsCalculator.updateDetails()).once()
      verify(codeMetricsCalculator.updateComments()).once()
      verify(runnerInvoker.setStatusSucceeded('PR Metrics succeeded')).once()
    })

    it('should log a message when PR_METRICS_ACCESS_TOKEN is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.PR_METRICS_ACCESS_TOKEN
      process.env.SYSTEM_ACCESSTOKEN = 'PAT'
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(instance(codeMetricsCalculator), instance(logger), instance(runnerInvoker))

      // Act
      await pullRequestMetrics.run('Folder')

      // Assert
      verify(runnerInvoker.locInitialize('Folder')).once()
      verify(logger.logWarning('Use of \'System.AccessToken\' has been deprecated and will stop working in a future version of PR Metrics. Please switch to \'PR_Metrics_Access_Token\' as soon as possible.')).once()
      verify(codeMetricsCalculator.updateDetails()).once()
      verify(codeMetricsCalculator.updateComments()).once()
      verify(runnerInvoker.setStatusSucceeded('PR Metrics succeeded')).once()
      expect(process.env.PR_METRICS_ACCESS_TOKEN).to.equal('PAT')

      // Finalization
      delete process.env.SYSTEM_ACCESSTOKEN
      delete process.env.PR_METRICS_ACCESS_TOKEN
    })

    it('should catch and log errors', async (): Promise<void> => {
      // Arrange
      const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(instance(codeMetricsCalculator), instance(logger), instance(runnerInvoker))
      const error: Error = new Error('Error Message')
      when(codeMetricsCalculator.shouldSkip).thenThrow(error)

      // Act
      await pullRequestMetrics.run('Folder')

      // Assert
      verify(runnerInvoker.locInitialize('Folder')).once()
      verify(logger.logErrorObject(error)).once()
      verify(logger.replay()).once()
      verify(runnerInvoker.setStatusFailed('Error Message')).once()
    })
  })
})
