// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import PullRequestComment from '../../../src/repos/interfaces/pullRequestComment'

describe('pullRequestComment.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: PullRequestComment = new PullRequestComment()

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('')
    })

    it('should set the correct data when specified', (): void => {
      // Act
      const result: PullRequestComment = new PullRequestComment(12345, CommentThreadStatus.Active, 'Content')

      // Assert
      expect(result.id).to.equal(12345)
      expect(result.status).to.equal(CommentThreadStatus.Active)
      expect(result.content).to.equal('Content')
    })
  })

  describe('id', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestComment = new PullRequestComment()

      // Act
      result.id = 12345

      // Assert
      expect(result.id).to.equal(12345)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('')
    })
  })

  describe('status', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestComment = new PullRequestComment()

      // Act
      result.status = CommentThreadStatus.Active

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Active)
      expect(result.content).to.equal('')
    })
  })

  describe('content', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestComment = new PullRequestComment()

      // Act
      result.content = 'Content'

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('Content')
    })
  })
})
