/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import PullRequestCommentData from '../../../src/repos/interfaces/pullRequestCommentData'
import assert from 'node:assert/strict'

describe('pullRequestCommentData.ts', (): void => {
  describe('constructor()', (): void => {
    describe('constructor()', (): void => {
      it('should set the correct data when the status is not specified', (): void => {
        // Act
        const result: PullRequestCommentData = new PullRequestCommentData(12345, 'Content')

        // Assert
        assert.equal(result.id, 12345)
        assert.equal(result.content, 'Content')
        assert.equal(result.status, CommentThreadStatus.Unknown)
      })

      it('should set the correct data when the status is specified', (): void => {
        // Act
        const result: PullRequestCommentData = new PullRequestCommentData(12345, 'Content', CommentThreadStatus.Active)

        // Assert
        assert.equal(result.id, 12345)
        assert.equal(result.content, 'Content')
        assert.equal(result.status, CommentThreadStatus.Active)
      })
    })
  })
})
