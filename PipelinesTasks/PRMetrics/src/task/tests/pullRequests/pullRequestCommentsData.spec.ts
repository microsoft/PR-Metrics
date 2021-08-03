// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import PullRequestCommentsData from '../../src/pullRequests/pullRequestCommentsData'

describe('pullRequestCommentsData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts', 'file4.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
    })
  })

  describe('metricsCommentThreadId', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.metricsCommentThreadId = 1

      // Assert
      expect(result.metricsCommentThreadId).to.equal(1)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts', 'file4.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
    })
  })

  describe('metricsCommentThreadStatus', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.metricsCommentThreadStatus = CommentThreadStatus.Active

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(CommentThreadStatus.Active)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts', 'file4.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
    })
  })

  describe('metricsCommentContent', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.metricsCommentContent = 'Content'

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal('Content')
      expect(result.filesNotRequiringReview).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts', 'file4.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
    })
  })

  describe('filesNotRequiringReview', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.filesNotRequiringReview = ['file5.ts']

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal(['file5.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts', 'file4.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
    })
  })

  describe('deletedFilesNotRequiringReview', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.deletedFilesNotRequiringReview = ['file5.ts']

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file5.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
    })
  })

  describe('commentThreadsRequiringDeletion', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.commentThreadsRequiringDeletion = [1, 2]

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts', 'file4.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([1, 2])
    })
  })
})
