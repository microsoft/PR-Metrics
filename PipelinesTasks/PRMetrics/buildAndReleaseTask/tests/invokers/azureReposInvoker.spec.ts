// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { WebApi } from 'azure-devops-node-api';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces';
import { CommentThreadStatus, GitPullRequest, GitPullRequestCommentThread, GitPullRequestIteration } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { expect } from 'chai';
import { anyNumber, anyString, anything, instance, mock, verify, when } from 'ts-mockito';
import AzureReposInvoker from '../../invokers/azureReposInvoker';
import DevOpsApiWrapper from '../../wrappers/devOpsApiWrapper';
import TaskLibWrapper from '../../wrappers/taskLibWrapper';
import { resolvableInstance } from '../utils/resolvableInstance';

const mockId = 3333;
let azureReposInvoker: AzureReposInvoker;
let taskLibWrapper: TaskLibWrapper;
let devOpsApiWrapper: DevOpsApiWrapper;

describe('azureReposInvoker.ts', function (): void {
  const mockGitPullRequest: GitPullRequest = { pullRequestId: mockId };
  const mockGitPullRequestCommentThread: GitPullRequestCommentThread = { id: mockId };
  const mockGitPullRequestIteration: GitPullRequestIteration = { id: mockId };
  let mockGitApi: IGitApi;

  beforeEach((): void => {
    process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'Test';
    process.env.SYSTEM_TEAMPROJECT = 'Test';
    process.env.BUILD_REPOSITORY_ID = 'Test';
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '3';
    process.env.SYSTEM_ACCESSTOKEN = 'Test';

    mockGitApi = mock<IGitApi>();
    const mockRequestHandler: IRequestHandler = instance(mock<IRequestHandler>());
    const mockWebApi: WebApi = mock(WebApi);

    when(mockGitApi.getPullRequestById(anyNumber(), anyString())).thenResolve(mockGitPullRequest);
    when(mockGitApi.getPullRequestThread(anyString(), anyNumber(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread);
    when(mockGitApi.getThreads(anyString(), anyNumber(), anyString())).thenResolve([mockGitPullRequestCommentThread]);
    when(mockGitApi.getPullRequestIterations(anyString(), anyNumber(), anyString())).thenResolve([mockGitPullRequestIteration]);
    when(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).thenResolve(mockGitPullRequest);
    when(mockGitApi.updateThread(anything(), anyString(), anyNumber(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread);
    when(mockGitApi.createThread(anything(), anyString(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread);
    when(mockGitApi.createComment(anything(), anyString(), anyNumber(), anyNumber(), anyString())).thenResolve(mockGitPullRequestCommentThread);
    when(mockGitApi.updatePullRequestProperties(null, anything(), anyString(), anyNumber(), anyString())).thenResolve(anything());

    when(mockWebApi.getGitApi()).thenResolve(resolvableInstance(mockGitApi) as IGitApi);

    devOpsApiWrapper = mock(DevOpsApiWrapper);
    when(devOpsApiWrapper.getPersonalAccessTokenHandler(anyString())).thenReturn(instance(mockRequestHandler));
    when(devOpsApiWrapper.getWebApiInstance(anyString(), anything())).thenReturn(instance(mockWebApi));

    taskLibWrapper = mock(TaskLibWrapper)

    azureReposInvoker = new AzureReposInvoker(instance(devOpsApiWrapper), instance(taskLibWrapper));
  });

  it('getDetails should return valid GitPullRequest', async function (): Promise<void> {
    // Act
    const result = await azureReposInvoker.getDetails();

    // Assert
    expect(result).to.deep.equal(mockGitPullRequest)
    verify(mockGitApi.getPullRequestById(anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.getDetails()')).once();
  });

  it('getIterations should return valid GitPullRequestIteration[]', async function (): Promise<void> {
    // Act
    const result = await azureReposInvoker.getIterations();

    // Assert
    expect(result).to.deep.equal([mockGitPullRequestIteration])
    verify(mockGitApi.getPullRequestIterations(anyString(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.getIterations()')).once()
  });

  it('getCommentThreads should return valid GitPullRequestCommentThread[]', async function (): Promise<void> {
    // Act
    const result = await azureReposInvoker.getCommentThreads();

    // Assert
    expect(result).to.deep.equal([mockGitPullRequestCommentThread])
    verify(mockGitApi.getThreads(anyString(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.getCommentThreads()')).once()
  });

  it('getCommentThread should return valid GitPullRequestCommentThread', async function (): Promise<void> {
    // Act
    const result = await azureReposInvoker.getCommentThread(3);

    // Assert
    expect(result).to.deep.equal(mockGitPullRequestCommentThread)
    verify(mockGitApi.getPullRequestThread(anyString(), anyNumber(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.getCommentThread()')).once()
  });

  it('setCommentThreadStatus should call the api', async function (): Promise<void> {
    // Act
    await azureReposInvoker.setCommentThreadStatus(3, CommentThreadStatus.Active);

    // Assert
    verify(mockGitApi.updateThread(anything(), anyString(), anyNumber(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.setCommentThreadStatus()')).once();
  });

  it('createCommentThread should call the api', async function (): Promise<void> {
    // Act
    await azureReposInvoker.createCommentThread('Test', 'Test', false);

    // Assert
    verify(mockGitApi.createThread(anything(), anyString(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.createCommentThread()')).once();
  });

  it('createComment should call the api', async function (): Promise<void> {
    // Act
    await azureReposInvoker.createComment(3, 3, 'Test');

    // Assert
    verify(mockGitApi.createComment(anything(), anyString(), anyNumber(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.createComment()')).once();
  });

  it('addMetadata should call the api', async function (): Promise<void> {
    // Act
    await azureReposInvoker.addMetadata({ test: 'Test' });

    // Assert
    verify(mockGitApi.updatePullRequestProperties(null, anything(), anyString(), anyNumber(), anyString())).once();
    verify(taskLibWrapper.debug('* AzureReposInvoker.addMetadata()')).once();
  });

  describe('isAccessTokenAvailable function', (): void => {
    it('should return true when token exists', function (): void {
      const result = azureReposInvoker.isAccessTokenAvailable();

      // Assert
      expect(result).to.be.true;
      verify(taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable()')).once();
    });

    it('should return false when token does not exist', function (): void {
      // Arrange
      delete process.env.SYSTEM_ACCESSTOKEN;
      const azureReposInvoker = new AzureReposInvoker(instance(devOpsApiWrapper), instance(taskLibWrapper));

      // Act
      const result = azureReposInvoker.isAccessTokenAvailable();

      // Assert
      expect(result).to.be.false;
      verify(taskLibWrapper.debug('* AzureReposInvoker.isAccessTokenAvailable()')).once();
    });
  });

  describe('setDetails function', (): void => {
    it('should not call the api when both description and title are invalid', async function (): Promise<void> {
      await azureReposInvoker.setDetails('', '');

      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).never();
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once();
    });

    it('should not call the api when both description and title are invalid', async function (): Promise<void> {
      await azureReposInvoker.setDetails('   ', '     ');

      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).never();
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once();
    });

    it('should call the api when description is valid', async function (): Promise<void> {
      await azureReposInvoker.setDetails('test', '');

      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).once();
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once();
    });

    it('should call the api when title is valid', async function (): Promise<void> {
      await azureReposInvoker.setDetails('', 'test');

      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).once();
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once();
    });

    it('should call the api when description and title are valid', async function (): Promise<void> {
      await azureReposInvoker.setDetails('test', 'test');

      verify(mockGitApi.updatePullRequest(anything(), anyString(), anyNumber(), anyString())).once();
      verify(taskLibWrapper.debug('* AzureReposInvoker.setDetails()')).once();
    });
  });
});
