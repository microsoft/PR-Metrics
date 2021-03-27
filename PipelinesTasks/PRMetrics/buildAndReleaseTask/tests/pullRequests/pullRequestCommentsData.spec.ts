// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import PullRequestCommentsData from '../../src/pullRequests/pullRequestCommentsData'

describe('pullRequestCommentsData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('isPresent', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.isMetricsCommentPresent = true

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(true)
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('threadId', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.metricsCommentThreadId = 1

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(1)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('commentId', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.metricsCommentId = 1

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(1)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('ignoredFilesWithLinesAdded', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.ignoredFilesWithLinesAdded = ['file5.ts']

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file5.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('ignoredFilesWithoutLinesAdded', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.ignoredFilesWithoutLinesAdded = ['file5.ts']

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file5.ts'])
    })
  })
})
