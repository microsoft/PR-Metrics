// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import AzureReposInvoker from '../invokers/azureReposInvoker'
import CodeMetrics from '../updaters/codeMetrics'
import CodeMetricsCalculator from '../codeMetricsCalculator'
import PullRequest from '../updaters/pullRequest'
import PullRequestComments from '../updaters/pullRequestComments'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

describe('codeMetricsCalculator.ts', (): void => {
  let azureReposInvoker: AzureReposInvoker
  let codeMetrics: CodeMetrics
  let pullRequest: PullRequest
  let pullRequestComments: PullRequestComments
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker)
    when(azureReposInvoker.isAccessTokenAvailable).thenReturn(true)

    codeMetrics = mock(CodeMetrics)

    pullRequest = mock(PullRequest)
    when(pullRequest.isPullRequest).thenReturn(true)

    pullRequestComments = mock(PullRequestComments)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('codeMetricsCalculator.noAccessToken')).thenReturn('Could not access the OAuth token. Enable the option \'Allow scripts to access OAuth token\' under the build process phase settings.')
    when(taskLibWrapper.loc('codeMetricsCalculator.noPullRequest')).thenReturn('The build is not running against a pull request. Canceling task with warning.')
  })

  describe('isRunnable', (): void => {
    it('should return null when runnable', (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.isRunnable

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.isRunnable')).once()
    })

    it('should return the appropriate message when not a pull request', (): void => {
      // Arrange
      when(pullRequest.isPullRequest).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.isRunnable

      // Assert
      expect(result).to.equal('The build is not running against a pull request. Canceling task with warning.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.isRunnable')).once()
    })

    it('should return the appropriate message when no access token is available', (): void => {
      // Arrange
      when(azureReposInvoker.isAccessTokenAvailable).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.isRunnable

      // Assert
      expect(result).to.equal('Could not access the OAuth token. Enable the option \'Allow scripts to access OAuth token\' under the build process phase settings.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.isRunnable')).once()
    })
  })

  // describe('updateDetails()', (): void => {
  //   it('should return the expected result', async (): Promise<void> => {
  //     // Arrange
  //     when(pullRequest.getUpdatedDescription('TODO')).thenReturn('TODO')
  //     when(pullRequest.getUpdatedTitle('TODO')).thenReturn('S✔ ◾ TODO')
  //     const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

  //     // Act
  //     await codeMetricsCalculator.updateDetails()

  //     // Assert
  //     verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateDetails()')).once()
  //   })
  // })

  // describe('updateComments()', (): void => {
  //   it('should return the expected result', async (): Promise<void> => {
  //     // Arrange
  //     when(pullRequestComments.getCommentData(anyNumber())).thenResolve(new PullRequestCommentsData([], []))
  //     const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

  //     // Act
  //     await codeMetricsCalculator.updateComments()

  //     // Assert
  //     verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
  //   })
  // })
})
