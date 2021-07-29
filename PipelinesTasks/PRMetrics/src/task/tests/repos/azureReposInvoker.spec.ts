// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anyNumber, anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { Comment, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { resolvableInstance } from '../testUtilities/resolvableInstance'
import { WebApi } from 'azure-devops-node-api'
import async from 'async'
import AzureDevOpsApiWrapper from '../../src/wrappers/azureDevOpsApiWrapper'
import AzureReposInvoker from '../../src/repos/azureReposInvoker'
import Logger from '../../src/utilities/logger'
import PullRequestCommentsThread from '../../src/pullRequests/pullRequestCommentsThread'
import PullRequestDetails from '../../src/repos/pullRequestDetails'

describe('azureReposInvoker.ts', function (): void {
  let gitApi: IGitApi
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  let logger: Logger

  beforeEach((): void => {
    process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/organization'
    process.env.SYSTEM_TEAMPROJECT = 'Project'
    process.env.BUILD_REPOSITORY_ID = 'RepoID'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '10'
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'

    gitApi = mock<IGitApi>()
    const requestHandler: IRequestHandler = mock<IRequestHandler>()
    const webApi: WebApi = mock(WebApi)
    when(webApi.getGitApi()).thenResolve(resolvableInstance(gitApi))

    azureDevOpsApiWrapper = mock(AzureDevOpsApiWrapper)
    when(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).thenReturn(instance(requestHandler))
    when(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', deepEqual(instance(requestHandler)))).thenReturn(instance(webApi))

    logger = mock(Logger)
  })

  after(() => {
    delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
    delete process.env.SYSTEM_TEAMPROJECT
    delete process.env.BUILD_REPOSITORY_ID
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.SYSTEM_ACCESSTOKEN
  })

  describe('isCommentsFunctionalityAvailable', (): void => {
    it('should return true', (): void => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      const result: boolean = azureReposInvoker.isCommentsFunctionalityAvailable

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* AzureReposInvoker.isCommentsFunctionalityAvailable')).once()
    })
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return true when the token exists', (): void => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      const result: boolean = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return false when the token does not exist', (): void => {
      // Arrange
      delete process.env.SYSTEM_ACCESSTOKEN
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      const result: boolean = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_TEAMPROJECT is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_TEAMPROJECT
          } else {
            process.env.SYSTEM_TEAMPROJECT = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))
          let errorThrown: boolean = false

          try {
            // Act
            await azureReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'SYSTEM_TEAMPROJECT', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })

    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when BUILD_REPOSITORY_ID is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.BUILD_REPOSITORY_ID
          } else {
            process.env.BUILD_REPOSITORY_ID = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))
          let errorThrown: boolean = false

          try {
            // Act
            await azureReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'BUILD_REPOSITORY_ID', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })

    async.each(
      [
        undefined,
        '',
        'A'
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_PULLREQUESTID is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
          } else {
            process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))
          let errorThrown: boolean = false

          try {
            // Act
            await azureReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_PULLREQUESTID\', accessed within \'AzureReposInvoker.getGitApi()\', is invalid, null, or undefined \'NaN\'.')
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })

    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_ACCESSTOKEN is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_ACCESSTOKEN
          } else {
            process.env.SYSTEM_ACCESSTOKEN = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))
          let errorThrown: boolean = false

          try {
            // Act
            await azureReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'SYSTEM_ACCESSTOKEN', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
        })
      })

    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_TEAMFOUNDATIONCOLLECTIONURI is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
          } else {
            process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = variable
          }

          const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))
          let errorThrown: boolean = false

          try {
            // Act
            await azureReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'SYSTEM_TEAMFOUNDATIONCOLLECTIONURI', accessed within 'AzureReposInvoker.getGitApi()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
          verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
        })
      })

    it('should return the title and description when available', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title',
        description: 'Description'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      const result: PullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{"title":"Title","description":"Description"}')).once()
    })

    it('should return the title and description when available and called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title',
        description: 'Description'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.getTitleAndDescription()
      const result: PullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{"title":"Title","description":"Description"}')).twice()
    })

    it('should return the title when the description is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      const result: PullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{"title":"Title"}')).once()
    })

    it('should throw when the title is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))
      let errorThrown: boolean = false

      try {
        // Act
        await azureReposInvoker.getTitleAndDescription()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'title\', accessed within \'AzureReposInvoker.getTitleAndDescription()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })
  })

  describe('getComments()', (): void => {
    it('should return the API result', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      const result: GitPullRequestCommentThread[] = await azureReposInvoker.getComments()

      // Assert
      expect(result).to.deep.equal([{ id: 1 }])
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('[{"id":1}]')).once()
    })

    it('should return the API result when called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.getComments()
      const result: GitPullRequestCommentThread[] = await azureReposInvoker.getComments()

      // Assert
      expect(result).to.deep.equal([{ id: 1 }])
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getComments()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('[{"id":1}]')).twice()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should not call the API when the title and description are null', async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).never()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).never()
      verify(gitApi.updatePullRequest(anything(), 'RepoID', 10, 'Project')).never()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).never()
    })

    it('should call the API when the title is valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when the description is valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        description: 'Description'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when both the title and description are valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title',
        description: 'Description'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when both the title and description are valid and called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title',
        description: 'Description'
      }
      when(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.setTitleAndDescription()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{}')).twice()
    })
  })

  describe('createComment()', (): void => {
    it('should call the API for no file', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API for no file when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active)
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{}')).twice()
    })

    it('should call the API for a file', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active,
        threadContext: {
          filePath: '/file.ts',
          rightFileStart: {
            line: 1,
            offset: 1
          },
          rightFileEnd: {
            line: 1,
            offset: 2
          }
        }
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active, 'file.ts')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API for a deleted file', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active,
        threadContext: {
          filePath: '/file.ts',
          leftFileStart: {
            line: 1,
            offset: 1
          },
          leftFileEnd: {
            line: 1,
            offset: 2
          }
        }
      }
      when(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.createComment('Comment Content', CommentThreadStatus.Active, 'file.ts', true)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedComment), 'RepoID', 10, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.createComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })
  })

  describe('updateComment()', (): void => {
    it('should call the APIs when both the comment content and the thread status are updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Content'
      }
      when(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 30, 'Project')).thenResolve({})
      const expectedCommentThread: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      when(gitApi.updateThread(deepEqual(expectedCommentThread), 'RepoID', 10, 20, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.updateComment('Content', CommentThreadStatus.Active, 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 30, 'Project')).once()
      verify(gitApi.updateThread(deepEqual(expectedCommentThread), 'RepoID', 10, 20, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).twice()
    })

    it('should call the API when the comment content is updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Content'
      }
      when(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 30, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.updateComment('Content', null, 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 30, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call the API when the thread status is updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      when(gitApi.updateThread(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.updateComment(null, CommentThreadStatus.Active, 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateThread(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
      verify(logger.logDebug('{}')).once()
    })

    it('should call no APIs when neither the comment content nor the thread status are updated', async (): Promise<void> => {
      // Arrange
      const expectedComment: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      when(gitApi.updateThread(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.updateComment(null, null, 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).never()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).never()
      verify(gitApi.updateComment(anything(), 'RepoID', 10, 20, 30, 'Project')).never()
      verify(gitApi.updateThread(anything(), 'RepoID', 10, 20, 'Project')).never()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).never()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Content'
      }
      when(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 30, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.updateComment('Content', null, 20, 30)
      await azureReposInvoker.updateComment('Content', null, 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateComment(deepEqual(expectedComment), 'RepoID', 10, 20, 30, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.updateComment()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
      verify(logger.logDebug('{}')).twice()
    })
  })

  describe('deleteCommentThread()', (): void => {
    it('should call the API for a single comment', async (): Promise<void> => {
      // Arrange
      const commentThread: PullRequestCommentsThread = new PullRequestCommentsThread(20)
      commentThread.commentIds.push(30)
      when(gitApi.deleteComment('RepoID', 10, 20, 30, 'Project')).thenResolve()
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.deleteCommentThread(commentThread)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 30, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
    })

    it('should call the API for a single comment', async (): Promise<void> => {
      // Arrange
      const commentThread: PullRequestCommentsThread = new PullRequestCommentsThread(20)
      commentThread.commentIds.push(30, 40, 50)
      when(gitApi.deleteComment('RepoID', 10, 20, anyNumber(), 'Project')).thenResolve()
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.deleteCommentThread(commentThread)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 30, 'Project')).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 40, 'Project')).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 50, 'Project')).once()
      verify(logger.logDebug('* AzureReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).once()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      const commentThread: PullRequestCommentsThread = new PullRequestCommentsThread(20)
      commentThread.commentIds.push(30)
      when(gitApi.deleteComment('RepoID', 10, 20, 30, 'Project')).thenResolve()
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(logger))

      // Act
      await azureReposInvoker.deleteCommentThread(commentThread)
      await azureReposInvoker.deleteCommentThread(commentThread)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.deleteComment('RepoID', 10, 20, 30, 'Project')).twice()
      verify(logger.logDebug('* AzureReposInvoker.deleteCommentThread()')).twice()
      verify(logger.logDebug('* AzureReposInvoker.getGitApi()')).twice()
    })
  })
})
