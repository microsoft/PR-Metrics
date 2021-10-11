// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import FileComment from '../../../src/repos/interfaces/fileComment'
import PullRequestComment from '../../../src/repos/interfaces/pullRequestComment'
import PullRequestCommentGrouping from '../../../src/repos/interfaces/pullRequestCommentGrouping'

describe('pullRequestCommentGrouping.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: PullRequestCommentGrouping = new PullRequestCommentGrouping()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(0)
    })
  })

  describe('pullRequestComments', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentGrouping = new PullRequestCommentGrouping()

      // Act
      result.pullRequestComments.push(new PullRequestComment())

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.fileComments.length).to.equal(0)
    })
  })

  describe('fileComments', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: PullRequestCommentGrouping = new PullRequestCommentGrouping()

      // Act
      result.fileComments.push(new FileComment())

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(1)
    })
  })
})
