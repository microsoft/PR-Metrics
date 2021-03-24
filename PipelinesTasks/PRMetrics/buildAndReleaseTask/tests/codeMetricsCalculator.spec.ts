// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetricsCalculator from '../codeMetricsCalculator'
import PullRequest from '../updaters/pullRequest'
import PullRequestComments from '../updaters/pullRequestComments'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

describe('codeMetricsCalculator.ts', (): void => {
  let pullRequest: PullRequest
  let pullRequestComments: PullRequestComments
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    pullRequest = mock(PullRequest)
    pullRequestComments = mock(PullRequestComments)
    taskLibWrapper = mock(TaskLibWrapper)
  })

  describe('isPullRequest', (): void => {
    async.each(
      [
        true,
        false
      ], (isPullRequest: boolean): void => {
        it(`should return the expected result when '${isPullRequest}'`, (): void => {
          // Arrange
          when(pullRequest.isPullRequest).thenReturn(isPullRequest)
          const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

          // Act
          const result: boolean = codeMetricsCalculator.isPullRequest

          // Assert
          expect(result).to.equal(isPullRequest)
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.isPullRequest')).once()
        })
      })
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: boolean = codeMetricsCalculator.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.isAccessTokenAvailable')).once()
    })
  })

  describe('updateDetails()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      when(pullRequest.getUpdatedDescription('TODO')).thenReturn('TODO')
      when(pullRequest.getUpdatedTitle('TODO')).thenReturn('S✔ ◾ TODO')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      codeMetricsCalculator.updateDetails()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateDetails()')).once()
    })
  })

  describe('updateComments()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      when(pullRequestComments.getCommentData()).thenReturn('TODO')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      codeMetricsCalculator.updateComments()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
    })
  })
})
