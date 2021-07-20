// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { instance, mock, verify } from 'ts-mockito'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import Logger from '../../src/utilities/logger'
import PullRequestMetadata from '../../src/repos/pullRequestMetadata'

describe('gitHubReposInvoker.ts', function (): void {
  let logger: Logger

  beforeEach((): void => {
    logger = mock(Logger)
  })

  describe('isFunctionalityComplete', (): void => {
    it('should return false', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))

      // Act
      const result: boolean = gitHubReposInvoker.isFunctionalityComplete

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* GitHubReposInvoker.isFunctionalityComplete')).once()
    })
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should throw an exception', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))

      // Act
      const func: () => boolean = () => gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(func).to.throw('GitHub functionality not yet implemented.')
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getTitleAndDescription()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
    })
  })

  describe('getCurrentIteration()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getCurrentIteration()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.getCurrentIteration()')).once()
    })
  })

  describe('getCommentThreads()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getCommentThreads()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.getCommentThreads()')).once()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.setTitleAndDescription(null, null)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
    })
  })

  describe('createComment()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.createComment('', 0, 1)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
    })
  })

  describe('createCommentThread()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.createCommentThread('', CommentThreadStatus.Active)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.createCommentThread()')).once()
    })
  })

  describe('setCommentThreadStatus()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.setCommentThreadStatus()')).once()
    })
  })

  describe('addMetadata()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const metadata: PullRequestMetadata[] = [
        {
          key: '',
          value: ''
        }
      ]
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.addMetadata(metadata)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHub functionality not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.addMetadata()')).once()
    })
  })
})
