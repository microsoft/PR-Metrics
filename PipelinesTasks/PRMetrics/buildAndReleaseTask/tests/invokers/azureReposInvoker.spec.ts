// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anyNumber, anyString, anything, instance, mock, verify, when } from 'ts-mockito'
import { CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { IPullRequestInfo, IPullRequestMetadata } from '../../models/pullRequestInterfaces'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { resolvableInstance } from '../utils/resolvableInstance'
import { WebApi } from 'azure-devops-node-api'
import AzureReposInvoker from '../../invokers/azureReposInvoker'
import DevOpsApiWrapper from '../../wrappers/devOpsApiWrapper'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'

describe('azureReposInvoker.ts', function (): void {
  const mockId = 3333
  let azureReposInvoker: AzureReposInvoker
  let taskLibWrapper: TaskLibWrapper
  let devOpsApiWrapper: DevOpsApiWrapper

  const mockGitPullRequest: GitPullRequest = {
    description: 'Test',
    title: 'Test',
    pullRequestId: mockId
  }
  const mockGitPullRequestCommentThread: GitPullRequestCommentThread = { id: mockId }
  const mockGitPullRequestIteration: GitPullRequestIteration = { id: mockId }
  let mockGitApi: IGitApi

  beforeEach((): void => {
    process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'Test'
    process.env.SYSTEM_TEAMPROJECT = 'Test'
    process.env.BUILD_REPOSITORY_ID = 'Test'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '3'
    process.env.SYSTEM_ACCESSTOKEN = 'Test'

    mockGitApi = mock<IGitApi>()
    const mockRequestHandler: IRequestHandler = instance(mock<IRequestHandler>())
    const mockWebApi: WebApi = mock(WebApi)

    when(mockGitApi.getPullRequestById(anyNumber(), anyString())).thenResolve(mockGitPullRequest)
    when(mockGitApi.getPullRequestThread(anyString(), anyNumber(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread)
    when(mockGitApi.getThreads(anyString(), anyNumber(), anyString())).thenResolve([mockGitPullRequestCommentThread])
    when(mockGitApi.getPullRequestIterations(anyString(), anyNumber(), anyString())).thenResolve([mockGitPullRequestIteration])
    when(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).thenResolve(mockGitPullRequest)
    when(mockGitApi.updateThread(anything(), anyString(), anyNumber(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread)
    when(mockGitApi.createThread(anything(), anyString(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread)
    when(mockGitApi.createComment(anything(), anyString(), anyNumber(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread)
    when(mockGitApi.updatePullRequestProperties(null, anything(), anyString(), anyNumber(), anyString())).thenResolve(anything())

    when(mockWebApi.getGitApi()).thenResolve(resolvableInstance(mockGitApi) as IGitApi)

    devOpsApiWrapper = mock(DevOpsApiWrapper)
    when(devOpsApiWrapper.getPersonalAccessTokenHandler(anyString())).thenReturn(instance(mockRequestHandler))
    when(devOpsApiWrapper.getWebApiInstance(anyString(), anything())).thenReturn(instance(mockWebApi))

    taskLibWrapper = mock(TaskLibWrapper)

    azureReposInvoker = new AzureReposInvoker(instance(devOpsApiWrapper), instance(taskLibWrapper))
  })

  after(() => {
    delete process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI
    delete process.env.SYSTEM_TEAMPROJECT
    delete process.env.BUILD_REPOSITORY_ID
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    delete process.env.SYSTEM_ACCESSTOKEN
  })

  it('getDetails should return valid IPullRequestInfo', async (): Promise<void> => {
    // Arrange
    const expectedResult = {
      description: mockGitPullRequest.description,
      title: mockGitPullRequest.title
    } as IPullRequestInfo

    // Act
    const result = await azureReposInvoker.getDetails()

    // Assert
    expect(result).to.deep.equal(expectedResult)
    verify(mockGitApi.getPullRequestById(anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.getDetails()')).once()
  })

  it('getCurrentIteration should return valid iteration id', async (): Promise<void> => {
    // Act
    const result = await azureReposInvoker.getCurrentIteration()

    // Assert
    expect(result).to.deep.equal(mockId)
    verify(mockGitApi.getPullRequestIterations(anyString(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.getCurrentIteration()')).once()
  })

  it('getCommentThreads should return valid GitPullRequestCommentThread[]', async (): Promise<void> => {
    // Act
    const result = await azureReposInvoker.getCommentThreads()

    // Assert
    expect(result).to.deep.equal([mockGitPullRequestCommentThread])
    verify(mockGitApi.getThreads(anyString(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')).once()
  })

  it('getCommentThread should return valid GitPullRequestCommentThread', async (): Promise<void> => {
    // Act
    const result = await azureReposInvoker.getCommentThread(3)

    // Assert
    expect(result).to.deep.equal(mockGitPullRequestCommentThread)
    verify(mockGitApi.getPullRequestThread(anyString(), anyNumber(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.getCommentThread()')).once()
  })

  it('setCommentThreadStatus should call the api', async (): Promise<void> => {
    // Act
    await azureReposInvoker.setCommentThreadStatus(3, CommentThreadStatus.Active)

    // Assert
    verify(mockGitApi.updateThread(anything(), anyString(), anyNumber(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')).once()
  })

  it('createCommentThread should call the api', async (): Promise<void> => {
    // Act
    await azureReposInvoker.createCommentThread('Test', 'Test', false)

    // Assert
    verify(mockGitApi.createThread(anything(), anyString(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')).once()
  })

  it('createComment should call the api', async (): Promise<void> => {
    // Act
    await azureReposInvoker.createComment(3, 3, 'Test')

    // Assert
    verify(mockGitApi.createComment(anything(), anyString(), anyNumber(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.createComment()')).once()
  })

  it('addMetadata should call the api', async (): Promise<void> => {
    // Arrange
    const mockMetadata: IPullRequestMetadata[] = [{
      key: 'TestString',
      value: 'Test'
    },
    {
      key: 'TestNumber',
      value: 3
    },
    {
      key: 'TestBoolean',
      value: true
    }]

    // Act
    await azureReposInvoker.addMetadata(mockMetadata)

    // Assert
    verify(mockGitApi.updatePullRequestProperties(null, anything(), anyString(), anyNumber(), anyString())).once()
    verify(taskLibWrapper.debug('* AzureReposInvoker.addMetadata()')).once()
  })

  describe('isAccessTokenAvailable function', (): void => {
    it('should return true when token exists', (): void => {
      const result = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return false when token does not exist', (): void => {
      // Arrange
      delete process.env.SYSTEM_ACCESSTOKEN
      const azureReposInvoker = new AzureReposInvoker(instance(devOpsApiWrapper), instance(taskLibWrapper))

      // Act
      const result = azureReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(false)
      verify(taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('setDetails function', (): void => {
    it('should not call the api when both description and title are invalid', async (): Promise<void> => {
      // Act
      await azureReposInvoker.setDetails('', '')

      // Assert
      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).never()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once()
    })

    it('should not call the api when both description and title are invalid', async (): Promise<void> => {
      // Act
      await azureReposInvoker.setDetails('   ', '     ')

      // Assert
      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).never()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once()
    })

    it('should call the api when description is valid', async (): Promise<void> => {
      // Act
      await azureReposInvoker.setDetails('test', '')

      // Assert
      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once()
    })

    it('should call the api when title is valid', async (): Promise<void> => {
      // Act
      await azureReposInvoker.setDetails('', 'test')

      // Assert
      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once()
    })

    it('should call the api when description and title are valid', async (): Promise<void> => {
      // Act
      await azureReposInvoker.setDetails('test', 'test')

      // Assert
      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).once()
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once()
    })
  })
})
