// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces.js'
import { expect } from 'chai'
import FileCommentData from '../../../src/repos/interfaces/fileCommentData.js'

describe('fileCommentData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data when the status is not specified', (): void => {
      // Act
      const result: FileCommentData = new FileCommentData(12345, 'Content', 'file.ts')

      // Assert
      expect(result.id).to.equal(12345)
      expect(result.content).to.equal('Content')
      expect(result.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileName).to.equal('file.ts')
    })

    it('should set the correct data when the status is specified', (): void => {
      // Act
      const result: FileCommentData = new FileCommentData(12345, 'Content', 'file.ts', CommentThreadStatus.Active)

      // Assert
      expect(result.id).to.equal(12345)
      expect(result.content).to.equal('Content')
      expect(result.status).to.equal(CommentThreadStatus.Active)
      expect(result.fileName).to.equal('file.ts')
    })
  })
})
