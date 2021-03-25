// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import PullRequestCommentsData from '../../updaters/pullRequestCommentsData'

describe('pullRequestCommentsData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Assert
      expect(result.isPresent).to.equal(false)
      expect(result.threadId).to.equal(null)
      expect(result.commentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('isPresent', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.isPresent = true

      // Assert
      expect(result.isPresent).to.equal(true)
      expect(result.threadId).to.equal(null)
      expect(result.commentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('threadId', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.threadId = 1

      // Assert
      expect(result.isPresent).to.equal(false)
      expect(result.threadId).to.equal(1)
      expect(result.commentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file3.ts', 'file4.ts'])
    })
  })

  describe('commentId', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'])

      // Act
      result.commentId = 1

      // Assert
      expect(result.isPresent).to.equal(false)
      expect(result.threadId).to.equal(null)
      expect(result.commentId).to.equal(1)
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
      expect(result.isPresent).to.equal(false)
      expect(result.threadId).to.equal(null)
      expect(result.commentId).to.equal(null)
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
      expect(result.isPresent).to.equal(false)
      expect(result.threadId).to.equal(null)
      expect(result.commentId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['file1.ts', 'file2.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file5.ts'])
    })
  })
})
