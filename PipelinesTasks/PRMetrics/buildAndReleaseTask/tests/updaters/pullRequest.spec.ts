// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import PullRequest from '../../updaters/pullRequest'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import { expect } from 'chai'
import { instance, mock, verify } from 'ts-mockito'

describe('pullRequest.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
  })

  describe('isPullRequest()', (): void => {
    it('should return true when SYSTEM_PULLREQUEST_PULLREQUESTID is defined', (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = 'refs/heads/develop'
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest()

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* PullRequest.isPullRequest()')).once()

      // Disposal
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    })

    it('should return false when SYSTEM_PULLREQUEST_PULLREQUESTID is not defined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest()

      // Assert
      expect(result).to.equal(false)
      verify(taskLibWrapper.debug('* PullRequest.isPullRequest()')).once()
    })
  })

  describe('getUpdatedDescription()', (): void => {
    it('should return null when the current description is set', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedDescription('Description')

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')).once()
    })

    it('should return the default description when the current description is empty', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedDescription('')

      // Assert
      expect(result).to.equal('❌ **Add a description.**')
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')).once()
    })
  })

  describe('getUpdatedTitle()', (): void => {
    it('should return null when the current title is set to the expected title', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedTitle('S✔ ◾ Title', 'S✔')

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')).once()
    })
  })
})
