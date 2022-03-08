// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anyNumber, anyString, anything, instance, mock, verify, when } from 'ts-mockito'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import async from 'async'
import CommentData from '../../src/repos/interfaces/commentData'
import ErrorWithStatus from '../wrappers/errorWithStatus'
import GetIssueCommentsResponse from '../../src/wrappers/octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from '../../src/wrappers/octokitInterfaces/getPullResponse'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import GitHubReposInvokerConstants from './gitHubReposInvokerConstants'
import Logger from '../../src/utilities/logger'
import OctokitLogObject from '../wrappers/octokitLogObject'
import OctokitWrapper from '../../src/wrappers/octokitWrapper'
import PullRequestDetails from '../../src/repos/interfaces/pullRequestDetails'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('gitHubReposInvoker.ts', function (): void {
  let logger: Logger
  let octokitWrapper: OctokitWrapper
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'
    process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = '12345'
    logger = mock(Logger)

    octokitWrapper = mock(OctokitWrapper)
    when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.getPullResponse)
    when(octokitWrapper.updatePull(anyString(), anyString(), anyNumber(), anyString(), anyString())).thenResolve(GitHubReposInvokerConstants.getPullResponse)
    when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.listCommitsResponse)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.insufficientGitHubAccessTokenPermissions')).thenReturn('Could not access the resources. Ensure \'System.AccessToken\' has access to \'repos\'.')
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitHubAccessToken')).thenReturn('Could not access the Personal Access Token (PAT). Add \'System.AccessToken\' as a secret environment variable with access to \'repos\'.')
  })

  afterEach((): void => {
    delete process.env.SYSTEM_ACCESSTOKEN
    delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return null when the token exists', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return a string when the token does not exist', (): void => {
      // Arrange
      delete process.env.SYSTEM_ACCESSTOKEN
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal('Could not access the Personal Access Token (PAT). Add \'System.AccessToken\' as a secret environment variable with access to \'repos\'.')
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
          } else {
            process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', accessed within 'GitHubReposInvoker.initialize()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    async.each(
      [
        'https://github.com/microsoft',
        'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions/git'
      ], (variable: string): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to an invalid URL '${variable}'`, async (): Promise<void> => {
          // Arrange
          process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = variable
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${variable}' is in an unexpected format.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    async.each(
      [
        undefined,
        '',
        'abc',
        'abc1'
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
          } else {
            process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER\', accessed within \'GitHubReposInvoker.initialize()\', is invalid, null, or undefined \'NaN\'.')
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    it('should succeed when the inputs are valid', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when the inputs are valid and the URL ends with \'.git\'', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions.git'
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when the inputs are valid and GitHub Enterprise is in use', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://organization.githubenterprise.com/microsoft/OMEX-Azure-DevOps-Extensions'
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.baseUrl).to.equal('https://organization.githubenterprise.com/api/v3')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('Using Base URL \'https://organization.githubenterprise.com/api/v3\'.')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when called twice with the inputs valid', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.getTitleAndDescription()
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).twice()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).twice()
    })

    it('should succeed when the description is null', async (): Promise<void> => {
      // Arrange
      const currentMockPullResponse: GetPullResponse = GitHubReposInvokerConstants.getPullResponse
      currentMockPullResponse.data.body = null
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenResolve(currentMockPullResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(currentMockPullResponse))).once()
    })

    async.each(
      [
        401,
        403,
        404
      ], (status: number): void => {
        it(`should throw when the PAT has insufficient access and the API call returns status '${status}'`, async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
            expect(options.auth).to.equal('OAUTH')
            expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
            expect(options.log).to.not.equal(null)
            expect(options.log.debug).to.not.equal(null)
            expect(options.log.info).to.not.equal(null)
            expect(options.log.warn).to.not.equal(null)
            expect(options.log.error).to.not.equal(null)
          })
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.status = status
          when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenThrow(error)
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('Could not access the resources. Ensure \'System.AccessToken\' has access to \'repos\'.')
            expect(error.internalMessage).to.equal('Test')
          }

          expect(errorThrown).to.equal(true)
          verify(octokitWrapper.initialize(anything())).once()
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    it('should throw an error when an error occurs', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenThrow(Error('Error'))
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getTitleAndDescription()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Error')
      }

      expect(errorThrown).to.equal(true)
      verify(octokitWrapper.initialize(anything())).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
    })

    it('should initialize log object correctly', async (): Promise<void> => {
      // Arrange
      let logObject: OctokitLogObject
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => { logObject = options.log })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      await gitHubReposInvoker.getTitleAndDescription()

      // Act
      logObject!.debug('Debug Message')
      logObject!.info('Info Message')
      logObject!.warn('Warning Message')
      logObject!.error('Error Message')

      // Assert
      verify(logger.logDebug('Octokit – Debug Message')).once()
      verify(logger.logInfo('Octokit – Info Message')).once()
      verify(logger.logWarning('Octokit – Warning Message')).once()
      verify(logger.logError('Octokit – Error Message')).once()
    })
  })

  describe('getComments()', (): void => {
    it('should return the result when called with a pull request comment', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const response: GetIssueCommentsResponse = GitHubReposInvokerConstants.getIssueCommentsResponse
      response.data[0]!.body = 'PR Content'
      when(octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber())).thenResolve(response)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]!.id).to.equal(1)
      expect(result.pullRequestComments[0]!.content).to.equal('PR Content')
      expect(result.pullRequestComments[0]!.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments.length).to.equal(0)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(response))).once()
    })

    it('should return the result when called with a file comment', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getReviewComments(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]!.id).to.equal(2)
      expect(result.fileComments[0]!.content).to.equal('File Content')
      expect(result.fileComments[0]!.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments[0]!.fileName).to.equal('file.ts')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getReviewCommentsResponse))).once()
    })

    it('should return the result when called with both a pull request and file comment', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const response: GetIssueCommentsResponse = GitHubReposInvokerConstants.getIssueCommentsResponse
      response.data[0]!.body = 'PR Content'
      when(octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber())).thenResolve(response)
      when(octokitWrapper.getReviewComments(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]!.id).to.equal(1)
      expect(result.pullRequestComments[0]!.content).to.equal('PR Content')
      expect(result.pullRequestComments[0]!.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]!.id).to.equal(2)
      expect(result.fileComments[0]!.content).to.equal('File Content')
      expect(result.fileComments[0]!.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments[0]!.fileName).to.equal('file.ts')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(response))).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getReviewCommentsResponse))).once()
    })

    it('should skip pull request comments with no body', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const response: GetIssueCommentsResponse = GitHubReposInvokerConstants.getIssueCommentsResponse
      response.data[0]!.body = undefined
      when(octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber())).thenResolve(response)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(0)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(response))).once()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should succeed when the title and description are both null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).never()
    })

    it('should succeed when the title and description are both set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Title', 'Description')).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when the title is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Title', undefined)).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should succeed when the description is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, undefined, 'Description')).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('createComment()', (): void => {
    it('should succeed when a file name is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should succeed when a file name is specified and a 422 status is returned', async (): Promise<void> => {
      // Arrange
      const error: ErrorWithStatus = new ErrorWithStatus('Test')
      error.status = 422
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).thenThrow(error)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
      verify(logger.logDebug('Error – status: 422')).once()
      verify(logger.logDebug('Error – message: Test')).once()
    })

    it('should throw when the commit list is empty', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber())).thenResolve({
        headers: {},
        status: 200,
        url: '',
        data: []
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'result.data[0].sha\', accessed within \'GitHubReposInvoker.createComment()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
    })

    it('should throw when a file name is specified and a non-422 error status is returned', async (): Promise<void> => {
      // Arrange
      const error: ErrorWithStatus = new ErrorWithStatus('Test')
      error.status = 423
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).thenThrow(error)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'result.data[0].sha\', accessed within \'GitHubReposInvoker.createComment()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
    })

    it('should succeed when a file name is specified and the method is called twice', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug('null')).twice()
    })

    it('should succeed when no file name is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.createIssueComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('updateComment()', (): void => {
    it('should succeed when the content is null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.updateComment(54321, null, null)

      // Assert
      verify(logger.logDebug('* GitHubReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).never()
    })

    it('should succeed when the content is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.updateComment(54321, 'Content', null)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updateIssueComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 54321, 'Content')).once()
      verify(logger.logDebug('* GitHubReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('deleteCommentThread()', (): void => {
    it('should succeed', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.deleteCommentThread(54321)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.deleteReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 54321)).once()
      verify(logger.logDebug('* GitHubReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })
})
