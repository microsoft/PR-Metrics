// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { instance, mock, verify } from 'ts-mockito'
import async from 'async'
import AzureReposInvoker from '../../src/repos/azureReposInvoker'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import Logger from '../../src/utilities/logger'
import CommentData from '../../src/repos/interfaces/commentData'
import PullRequestDetails from '../../src/repos/interfaces/pullRequestDetails'
import ReposInvoker from '../../src/repos/reposInvoker'

describe('reposInvoker.ts', function (): void {
  let azureReposInvoker: AzureReposInvoker
  let gitHubReposInvoker: GitHubReposInvoker
  let logger: Logger

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker)

    gitHubReposInvoker = mock(GitHubReposInvoker)
    logger = mock(Logger)
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', (): void => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      const result: string | null = reposInvoker.isAccessTokenAvailable

      // Assert
      verify(azureReposInvoker.isAccessTokenAvailable).once()
      verify(gitHubReposInvoker.isAccessTokenAvailable).never()
      verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
      expect(result).to.equal(null)

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, (): void => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          const result: string | null = reposInvoker.isAccessTokenAvailable

          // Assert
          verify(azureReposInvoker.isAccessTokenAvailable).never()
          verify(gitHubReposInvoker.isAccessTokenAvailable).once()
          verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
          expect(result).to.equal(null)

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', (): void => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      const func: () => string | null = () => reposInvoker.isAccessTokenAvailable

      // Assert
      expect(func).to.throw('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      verify(azureReposInvoker.isAccessTokenAvailable).never()
      verify(gitHubReposInvoker.isAccessTokenAvailable).never()
      verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', (): void => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      const func: () => string | null = () => reposInvoker.isAccessTokenAvailable

      // Assert
      expect(func).to.throw('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      verify(azureReposInvoker.isAccessTokenAvailable).never()
      verify(gitHubReposInvoker.isAccessTokenAvailable).never()
      verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('getTitleAndDescription()', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      const result: PullRequestDetails = await reposInvoker.getTitleAndDescription()

      // Assert
      verify(azureReposInvoker.getTitleAndDescription()).once()
      verify(gitHubReposInvoker.getTitleAndDescription()).never()
      verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
      expect(result).to.equal(null)

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          const result: PullRequestDetails = await reposInvoker.getTitleAndDescription()

          // Assert
          verify(azureReposInvoker.getTitleAndDescription()).never()
          verify(gitHubReposInvoker.getTitleAndDescription()).once()
          verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
          expect(result).to.equal(null)

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.getTitleAndDescription()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.getTitleAndDescription()).never()
      verify(gitHubReposInvoker.getTitleAndDescription()).never()
      verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.getTitleAndDescription()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.getTitleAndDescription()).never()
      verify(gitHubReposInvoker.getTitleAndDescription()).never()
      verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('getComments()', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      const result: CommentData = await reposInvoker.getComments()

      // Assert
      verify(azureReposInvoker.getComments()).once()
      verify(gitHubReposInvoker.getComments()).never()
      verify(logger.logDebug('* ReposInvoker.getComments()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
      expect(result).to.equal(null)

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          const result: CommentData = await reposInvoker.getComments()

          // Assert
          verify(azureReposInvoker.getComments()).never()
          verify(gitHubReposInvoker.getComments()).once()
          verify(logger.logDebug('* ReposInvoker.getComments()')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
          expect(result).to.equal(null)

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.getComments()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.getComments()).never()
      verify(gitHubReposInvoker.getComments()).never()
      verify(logger.logDebug('* ReposInvoker.getComments()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.getComments()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.getComments()).never()
      verify(gitHubReposInvoker.getComments()).never()
      verify(logger.logDebug('* ReposInvoker.getComments()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      await reposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(azureReposInvoker.setTitleAndDescription(null, null)).once()
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never()
      verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          await reposInvoker.setTitleAndDescription(null, null)

          // Assert
          verify(azureReposInvoker.setTitleAndDescription(null, null)).never()
          verify(gitHubReposInvoker.setTitleAndDescription(null, null)).once()
          verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.setTitleAndDescription(null, null)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.setTitleAndDescription(null, null)).never()
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never()
      verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.setTitleAndDescription(null, null)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.setTitleAndDescription(null, null)).never()
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never()
      verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('createComment()', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      await reposInvoker.createComment('', CommentThreadStatus.Active, '', false)

      // Assert
      verify(azureReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).once()
      verify(gitHubReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).never()
      verify(logger.logDebug('* ReposInvoker.createComment()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          await reposInvoker.createComment('', CommentThreadStatus.Active, '', false)

          // Assert
          verify(azureReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).never()
          verify(gitHubReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).once()
          verify(logger.logDebug('* ReposInvoker.createComment()')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.createComment('', CommentThreadStatus.Active, '', false)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).never()
      verify(gitHubReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).never()
      verify(logger.logDebug('* ReposInvoker.createComment()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.createComment('', CommentThreadStatus.Active, '', false)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).never()
      verify(gitHubReposInvoker.createComment('', CommentThreadStatus.Active, '', false)).never()
      verify(logger.logDebug('* ReposInvoker.createComment()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('updateComment()', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      await reposInvoker.updateComment(0, null, null)

      // Assert
      verify(azureReposInvoker.updateComment(0, null, null)).once()
      verify(gitHubReposInvoker.updateComment(0, null, null)).never()
      verify(logger.logDebug('* ReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          await reposInvoker.updateComment(0, null, null)

          // Assert
          verify(azureReposInvoker.updateComment(0, null, null)).never()
          verify(gitHubReposInvoker.updateComment(0, null, null)).once()
          verify(logger.logDebug('* ReposInvoker.updateComment()')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.updateComment(0, null, null)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.updateComment(0, null, null)).never()
      verify(gitHubReposInvoker.updateComment(0, null, null)).never()
      verify(logger.logDebug('* ReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.updateComment(0, null, null)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.updateComment(0, null, null)).never()
      verify(gitHubReposInvoker.updateComment(0, null, null)).never()
      verify(logger.logDebug('* ReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('deleteCommentThread()', (): void => {
    it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

      // Act
      await reposInvoker.deleteCommentThread(20)

      // Assert
      verify(azureReposInvoker.deleteCommentThread(20)).once()
      verify(gitHubReposInvoker.deleteCommentThread(20)).never()
      verify(logger.logDebug('* ReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

          // Act
          await reposInvoker.deleteCommentThread(20)

          // Assert
          verify(azureReposInvoker.deleteCommentThread(20)).never()
          verify(gitHubReposInvoker.deleteCommentThread(20)).once()
          verify(logger.logDebug('* ReposInvoker.deleteCommentThread()')).once()
          verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should throw when the repo type is not set', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.deleteCommentThread(20)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.deleteCommentThread(20)).never()
      verify(gitHubReposInvoker.deleteCommentThread(20)).never()
      verify(logger.logDebug('* ReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
    })

    it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await reposInvoker.deleteCommentThread(20)
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureReposInvoker.deleteCommentThread(20)).never()
      verify(gitHubReposInvoker.deleteCommentThread(20)).never()
      verify(logger.logDebug('* ReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })
})
