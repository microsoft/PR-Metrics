// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import FileCommentData from '../../../src/repos/interfaces/fileCommentData'
import PullRequestCommentData from '../../../src/repos/interfaces/pullRequestCommentData'
import CommentData from '../../../src/repos/interfaces/commentData'

describe('commentData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: CommentData = new CommentData()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(0)
    })
  })

  describe('pullRequestComments', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: CommentData = new CommentData()

      // Act
      result.pullRequestComments.push(new PullRequestCommentData(0, ''))

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.fileComments.length).to.equal(0)
    })
  })

  describe('fileComments', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: CommentData = new CommentData()

      // Act
      result.fileComments.push(new FileCommentData(0, '', ''))

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(1)
    })
  })
})
