// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { Comment, CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { JsonPatchDocument, Operation } from 'azure-devops-node-api/interfaces/common/VSSInterfaces'
import { resolvableInstance } from '../testUtilities/resolvableInstance'
import { WebApi } from 'azure-devops-node-api'
import AzureDevOpsApiWrapper from '../../wrappers/azureDevOpsApiWrapper'
import AzureReposInvoker from '../../azureRepos/azureReposInvoker'
import IPullRequestDetails from '../../azureRepos/iPullRequestDetails'
import IPullRequestMetadata from '../../azureRepos/iPullRequestMetadata'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'

describe('azureReposInvoker.ts', function (): void {
  let gitApi: IGitApi
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper
  let taskLibWrapper: TaskLibWrapper

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

    taskLibWrapper = mock(TaskLibWrapper)
  })

  after(() => {
    delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
    delete process.env.SYSTEM_TEAMPROJECT
    delete process.env.BUILD_REPOSITORY_ID
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.SYSTEM_ACCESSTOKEN
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return true when the token exists', (): void => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: boolean = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return false when the token does not exist', (): void => {
      // Arrange
      delete process.env.SYSTEM_ACCESSTOKEN
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: boolean = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(false)
      verify(taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    it('should return the title and description when available', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title',
        description: 'Description'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: IPullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should return the title and description when available and called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title',
        description: 'Description'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.getTitleAndDescription()
      const result: IPullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getTitleAndDescription()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })

    it('should return the title when the description is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({
        title: 'Title'
      })
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: IPullRequestDetails = await azureReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestById(10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getTitleAndDescription()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should throw when the title is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestById(10, 'Project')).thenResolve({})
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await azureReposInvoker.getTitleAndDescription()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Field \'title\', accessed within \'AzureReposInvoker.getTitleAndDescription()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
    })
  })

  describe('getCurrentIteration()', (): void => {
    it('should return the iteration when one exists', async (): Promise<void> => {
      // Act
      when(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).thenResolve([{ id: 1 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: number = await azureReposInvoker.getCurrentIteration()

      // Assert
      expect(result).to.equal(1)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should return the iteration when one exists and called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).thenResolve([{ id: 1 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.getCurrentIteration()
      const result: number = await azureReposInvoker.getCurrentIteration()

      // Assert
      expect(result).to.equal(1)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })

    it('should return the last iteration when multiple exist', async (): Promise<void> => {
      // Act
      when(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).thenResolve([{ id: 1 }, { id: 2 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: number = await azureReposInvoker.getCurrentIteration()

      // Assert
      expect(result).to.equal(2)
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should throw when there are no iterations', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).thenResolve([])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await azureReposInvoker.getCurrentIteration()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('The collection of pull request iterations was of length zero.')
      }

      expect(errorThrown).to.equal(true)
    })

    it('should throw when the iteration is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitApi.getPullRequestIterations('RepoID', 10, 'Project')).thenResolve([{}])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await azureReposInvoker.getCurrentIteration()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Field \'id\', accessed within \'AzureReposInvoker.getCurrentIteration()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
    })
  })

  describe('getCommentThreads()', (): void => {
    it('should return the API result', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result: GitPullRequestCommentThread[] = await azureReposInvoker.getCommentThreads()

      // Assert
      expect(result).to.deep.equal([{ id: 1 }])
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should return the API result when called multiple times', async (): Promise<void> => {
      // Arrange
      when(gitApi.getThreads('RepoID', 10, 'Project')).thenResolve([{ id: 1 }])
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.getCommentThreads()
      const result: GitPullRequestCommentThread[] = await azureReposInvoker.getCommentThreads()

      // Assert
      expect(result).to.deep.equal([{ id: 1 }])
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.getThreads('RepoID', 10, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should not call the API when the title and description are null', async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).never()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).never()
      verify(gitApi.updatePullRequest(anything(), 'RepoID', 10, 'Project')).never()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).never()
    })

    it('should call the API when the title is valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title'
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API when the description is valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        description: 'Description'
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API when both the title and description are valid', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title',
        description: 'Description'
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setTitleAndDescription()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API when both the title and description are valid and called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedDetails: GitPullRequest = {
        title: 'Title',
        description: 'Description'
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')
      await azureReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequest(deepEqual(expectedDetails), 'RepoID', 10, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setTitleAndDescription()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })
  })

  describe('createComment()', (): void => {
    it('should call the API', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Comment Content',
        parentCommentId: 30
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.createComment('Comment Content', 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createComment(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.createComment()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedComment: Comment = {
        content: 'Comment Content',
        parentCommentId: 30
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.createComment('Comment Content', 20, 30)
      await azureReposInvoker.createComment('Comment Content', 20, 30)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createComment(deepEqual(expectedComment), 'RepoID', 10, 20, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.createComment()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })
  })

  describe('createCommentThread()', (): void => {
    it('should call the API for no file', async (): Promise<void> => {
      // Arrange
      const expectedCommentThread: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.createCommentThread('Comment Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedCommentThread), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API for no file when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedCommentThread: GitPullRequestCommentThread = {
        comments: [{ content: 'Comment Content' }],
        status: CommentThreadStatus.Active
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.createCommentThread('Comment Content', CommentThreadStatus.Active)
      await azureReposInvoker.createCommentThread('Comment Content', CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedCommentThread), 'RepoID', 10, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })

    it('should call the API for a file without lines added', async (): Promise<void> => {
      // Arrange
      const expectedCommentThread: GitPullRequestCommentThread = {
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
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.createCommentThread('Comment Content', CommentThreadStatus.Active, 'file.ts')

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedCommentThread), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API for a file with lines added', async (): Promise<void> => {
      // Arrange
      const expectedCommentThread: GitPullRequestCommentThread = {
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
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.createCommentThread('Comment Content', CommentThreadStatus.Active, 'file.ts', true)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.createThread(deepEqual(expectedCommentThread), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })
  })

  describe('setCommentThreadStatus()', (): void => {
    it('should call the API', async (): Promise<void> => {
      // Arrange
      const expectedCommentThread: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setCommentThreadStatus(20, CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateThread(deepEqual(expectedCommentThread), 'RepoID', 10, 20, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      const expectedCommentThread: GitPullRequestCommentThread = {
        status: CommentThreadStatus.Active
      }
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.setCommentThreadStatus(20, CommentThreadStatus.Active)
      await azureReposInvoker.setCommentThreadStatus(20, CommentThreadStatus.Active)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updateThread(deepEqual(expectedCommentThread), 'RepoID', 10, 20, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })
  })

  describe('addMetadata()', (): void => {
    it('should call the API', async (): Promise<void> => {
      // Arrange
      const metadata: IPullRequestMetadata[] = [
        {
          key: 'TestString',
          value: 'Test'
        },
        {
          key: 'TestNumber',
          value: 20
        },
        {
          key: 'TestBoolean',
          value: true
        }
      ]
      const expected: JsonPatchDocument = [
        {
          op: Operation.Replace,
          path: '/PRMetrics.TestString',
          value: 'Test'
        },
        {
          op: Operation.Replace,
          path: '/PRMetrics.TestNumber',
          value: '20'
        },
        {
          op: Operation.Replace,
          path: '/PRMetrics.TestBoolean',
          value: 'true'
        }
      ]
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.addMetadata(metadata)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequestProperties(null, deepEqual(expected), 'RepoID', 10, 'Project')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.addMetadata()')).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).once()
    })

    it('should call the API when called multiple times', async (): Promise<void> => {
      // Arrange
      const metadata: IPullRequestMetadata[] = [
        {
          key: 'TestString',
          value: 'Test'
        }
      ]
      const expected: JsonPatchDocument = [
        {
          op: Operation.Replace,
          path: '/PRMetrics.TestString',
          value: 'Test'
        }
      ]
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))

      // Act
      await azureReposInvoker.addMetadata(metadata)
      await azureReposInvoker.addMetadata(metadata)

      // Assert
      verify(azureDevOpsApiWrapper.getPersonalAccessTokenHandler('OAUTH')).once()
      verify(azureDevOpsApiWrapper.getWebApiInstance('https://dev.azure.com/organization', anything())).once()
      verify(gitApi.updatePullRequestProperties(null, deepEqual(expected), 'RepoID', 10, 'Project')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.addMetadata()')).twice()
      verify(taskLibWrapper.debug('* AzureReposInvoker.openConnection()')).twice()
    })

    it('should throw when the metadata array is empty', async (): Promise<void> => {
      // Arrange
      const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(instance(azureDevOpsApiWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await azureReposInvoker.addMetadata([])
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('The collection of metadata was of length zero.')
      }

      expect(errorThrown).to.equal(true)
    })
  })
})
