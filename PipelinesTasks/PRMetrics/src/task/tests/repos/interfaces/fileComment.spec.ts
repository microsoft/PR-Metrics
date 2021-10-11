// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import FileComment from '../../../src/repos/interfaces/fileComment'

describe('fileComment.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data', (): void => {
      // Act
      const result: FileComment = new FileComment()

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('')
      expect(result.file).to.equal('')
    })

    it('should set the correct data when specified', (): void => {
      // Act
      const result: FileComment = new FileComment(12345, CommentThreadStatus.Active, 'Content', 'file.ts')

      // Assert
      expect(result.id).to.equal(12345)
      expect(result.status).to.equal(CommentThreadStatus.Active)
      expect(result.content).to.equal('Content')
      expect(result.file).to.equal('file.ts')
    })
  })

  describe('id', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: FileComment = new FileComment()

      // Act
      result.id = 12345

      // Assert
      expect(result.id).to.equal(12345)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('')
      expect(result.file).to.equal('')
    })
  })

  describe('status', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: FileComment = new FileComment()

      // Act
      result.status = CommentThreadStatus.Active

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Active)
      expect(result.content).to.equal('')
      expect(result.file).to.equal('')
    })
  })

  describe('content', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: FileComment = new FileComment()

      // Act
      result.content = 'Content'

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('Content')
      expect(result.file).to.equal('')
    })
  })

  describe('file', (): void => {
    it('should set the correct data', (): void => {
      // Arrange
      const result: FileComment = new FileComment()

      // Act
      result.file = 'file.ts'

      // Assert
      expect(result.id).to.equal(0)
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.content).to.equal('')
      expect(result.file).to.equal('file.ts')
    })
  })
})
