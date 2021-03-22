// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import PullRequestComments from '../../updaters/pullRequestComments'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'

describe('pullRequestComments.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.pullRequestComments.fileIgnoredComment')).thenReturn('❗ **This file may not need to be reviewed.**')
  })

  describe('getCommentData()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getCommentData()

      // Assert
      expect(result).to.equal('TODO')
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
    })
  })

  describe('getCommentThreadId()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: number | null = pullRequestComments.getCommentThreadId()

      // Assert
      expect(result).to.equal(1)
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentThreadId()')).once()
    })
  })

  describe('getMetricsComment()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getMetricsComment()

      // Assert
      expect(result).to.equal('TODO')
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
    })
  })

  describe('getMetricsCommentStatus()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getMetricsCommentStatus()

      // Assert
      expect(result).to.equal('TODO')
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')).once()
    })
  })

  describe('getIgnoredComment()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getIgnoredComment()

      // Assert
      expect(result).to.equal('❗ **This file may not need to be reviewed.**')
      verify(taskLibWrapper.debug('* PullRequestComments.getIgnoredComment()')).once()
    })
  })
})
