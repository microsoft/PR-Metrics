// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import PullRequestCommentsThread from '../../src/pullRequests/pullRequestCommentsThread'

describe('pullRequestCommentsThread.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: PullRequestCommentsThread = new PullRequestCommentsThread(1)

      // Assert
      expect(result.threadId).to.equal(1)
      expect(result.commentIds).to.deep.equal([])
    })
  })

  describe('commentIds', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsThread = new PullRequestCommentsThread(1)

      // Act
      result.commentIds = [2, 3]

      // Assert
      expect(result.threadId).to.equal(1)
      expect(result.commentIds).to.deep.equal([2, 3])
    })
  })
})
