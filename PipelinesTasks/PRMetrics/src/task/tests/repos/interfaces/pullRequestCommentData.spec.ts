// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import PullRequestCommentData from '../../../src/repos/interfaces/pullRequestCommentData'

describe('pullRequestCommentData.ts', (): void => {
  describe('constructor()', (): void => {
    describe('constructor()', (): void => {
      it('should set the correct data when the status is not specified', (): void => {
        // Act
        const result: PullRequestCommentData = new PullRequestCommentData(12345, 'Content')

        // Assert
        expect(result.id).to.equal(12345)
        expect(result.content).to.equal('Content')
        expect(result.status).to.equal(CommentThreadStatus.Unknown)
      })

      it('should set the correct data when the status is specified', (): void => {
        // Act
        const result: PullRequestCommentData = new PullRequestCommentData(12345, 'Content', CommentThreadStatus.Active)

        // Assert
        expect(result.id).to.equal(12345)
        expect(result.content).to.equal('Content')
        expect(result.status).to.equal(CommentThreadStatus.Active)
      })
    })
  })
})
