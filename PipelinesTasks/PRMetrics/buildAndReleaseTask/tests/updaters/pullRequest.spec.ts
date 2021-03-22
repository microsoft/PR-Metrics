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
})
