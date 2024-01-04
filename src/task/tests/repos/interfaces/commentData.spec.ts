// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import assert from 'node:assert/strict'
import CommentData from '../../../src/repos/interfaces/commentData'
import FileCommentData from '../../../src/repos/interfaces/fileCommentData'
import PullRequestCommentData from '../../../src/repos/interfaces/pullRequestCommentData'

describe('commentData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: CommentData = new CommentData()

      // Assert
      assert.equal(result.pullRequestComments.length, 0)
      assert.equal(result.fileComments.length, 0)
    })
  })

  describe('pullRequestComments', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: CommentData = new CommentData()

      // Act
      result.pullRequestComments.push(new PullRequestCommentData(0, ''))

      // Assert
      assert.equal(result.pullRequestComments.length, 1)
      assert.equal(result.fileComments.length, 0)
    })
  })

  describe('fileComments', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: CommentData = new CommentData()

      // Act
      result.fileComments.push(new FileCommentData(0, '', ''))

      // Assert
      assert.equal(result.pullRequestComments.length, 0)
      assert.equal(result.fileComments.length, 1)
    })
  })
})
