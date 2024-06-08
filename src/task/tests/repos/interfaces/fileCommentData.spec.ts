/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import FileCommentData from '../../../src/repos/interfaces/fileCommentData'
import assert from 'node:assert/strict'

describe('fileCommentData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should set the correct data when the status is not specified', (): void => {
      // Act
      const result: FileCommentData = new FileCommentData(12345, 'Content', 'file.ts')

      // Assert
      assert.equal(result.id, 12345)
      assert.equal(result.content, 'Content')
      assert.equal(result.status, CommentThreadStatus.Unknown)
      assert.equal(result.fileName, 'file.ts')
    })

    it('should set the correct data when the status is specified', (): void => {
      // Act
      const result: FileCommentData = new FileCommentData(12345, 'Content', 'file.ts', CommentThreadStatus.Active)

      // Assert
      assert.equal(result.id, 12345)
      assert.equal(result.content, 'Content')
      assert.equal(result.status, CommentThreadStatus.Active)
      assert.equal(result.fileName, 'file.ts')
    })
  })
})
