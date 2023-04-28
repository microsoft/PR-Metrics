// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anyNumber, anyString, anything, instance, mock, verify, when } from 'ts-mockito'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import * as Converter from '../../src/utilities/converter'
import * as ExpectExtensions from '../testUtilities/expectExtensions'
import * as GitHubReposInvokerConstants from './gitHubReposInvokerConstants'
import CommentData from '../../src/repos/interfaces/commentData'
import ErrorWithStatus from '../wrappers/errorWithStatus'
import GetIssueCommentsResponse from '../../src/wrappers/octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from '../../src/wrappers/octokitInterfaces/getPullResponse'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import GitInvoker from '../../src/git/gitInvoker'
import HttpError from '../testUtilities/httpError'
import Logger from '../../src/utilities/logger'
import OctokitLogObject from '../wrappers/octokitLogObject'
import OctokitWrapper from '../../src/wrappers/octokitWrapper'
import PullRequestDetails from '../../src/repos/interfaces/pullRequestDetails'
import RunnerInvoker from '../../src/runners/runnerInvoker'

describe('gitHubReposInvoker.ts', function (): void {
  let gitInvoker: GitInvoker
  let logger: Logger
  let octokitWrapper: OctokitWrapper
  let runnerInvoker: RunnerInvoker

  const expectedUserAgent: string = 'PRMetrics/v1.5.2'

  beforeEach((): void => {
    process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'
    process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/PR-Metrics'

    gitInvoker = mock(GitInvoker)
    when(gitInvoker.pullRequestId).thenReturn(12345)

    logger = mock(Logger)

    octokitWrapper = mock(OctokitWrapper)
    when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.getPullResponse)
    when(octokitWrapper.updatePull(anyString(), anyString(), anyNumber(), anyString(), anyString())).thenResolve(GitHubReposInvokerConstants.getPullResponse)
    when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), anyNumber())).thenResolve(GitHubReposInvokerConstants.listCommitsResponse)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.insufficientGitHubAccessTokenPermissions')).thenReturn('Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'repos\'.')
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.noGitHubAccessToken')).thenReturn('Could not access the Personal Access Token (PAT). Add \'PR_Metrics_Access_Token\' as a secret environment variable with access to \'repos\'.')
  })

  afterEach((): void => {
    delete process.env.PR_METRICS_ACCESS_TOKEN
    delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return null when the token exists on Azure DevOps', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return null when the token exists on GitHub', (): void => {
      // Arrange
      process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()

      // Finalization
      delete process.env.PR_METRICS_ACCESS_TOKEN
      delete process.env.GITHUB_ACTION
    })

    it('should return a string when the token does not exist', (): void => {
      // Arrange
      delete process.env.PR_METRICS_ACCESS_TOKEN
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal('Could not access the Personal Access Token (PAT). Add \'PR_Metrics_Access_Token\' as a secret environment variable with access to \'repos\'.')
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to the invalid value '${Converter.toString(variable)}' and the task is running on Azure Pipelines`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
          } else {
            process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', accessed within 'GitHubReposInvoker.initializeForAzureDevOps()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
        })
      })
    }

    it('should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to an invalid URL and the task is running on Azure Pipelines', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft'
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      await ExpectExtensions.toThrowAsync(func, 'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI \'https://github.com/microsoft\' is in an unexpected format.')
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
    })

    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_API_URL is set to the invalid value '${Converter.toString(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          delete process.env.PR_METRICS_ACCESS_TOKEN
          process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'
          process.env.GITHUB_ACTION = 'PR-Metrics'
          if (variable === undefined) {
            delete process.env.GITHUB_API_URL
          } else {
            process.env.GITHUB_API_URL = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'GITHUB_API_URL', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')).once()

          // Finalization
          delete process.env.PR_METRICS_ACCESS_TOKEN
          delete process.env.GITHUB_ACTION
          delete process.env.GITHUB_API_URL
        })
      })
    }

    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_REPOSITORY_OWNER is set to the invalid value '${Converter.toString(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          delete process.env.PR_METRICS_ACCESS_TOKEN
          process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'
          process.env.GITHUB_ACTION = 'PR-Metrics'
          process.env.GITHUB_API_URL = 'https://api.github.com'
          if (variable === undefined) {
            delete process.env.GITHUB_REPOSITORY_OWNER
          } else {
            process.env.GITHUB_REPOSITORY_OWNER = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'GITHUB_REPOSITORY_OWNER', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')).once()

          // Finalization
          delete process.env.PR_METRICS_ACCESS_TOKEN
          delete process.env.GITHUB_ACTION
          delete process.env.GITHUB_API_URL
          delete process.env.GITHUB_REPOSITORY_OWNER
        })
      })
    }

    {
      const testCases: Array<string | undefined> = [
        undefined,
        ''
      ]

      testCases.forEach((variable: string | undefined): void => {
        it(`should throw when GITHUB_REPOSITORY is set to the invalid value '${Converter.toString(variable)}' and the task is running on GitHub`, async (): Promise<void> => {
          // Arrange
          delete process.env.PR_METRICS_ACCESS_TOKEN
          process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'
          process.env.GITHUB_ACTION = 'PR-Metrics'
          process.env.GITHUB_API_URL = 'https://api.github.com'
          process.env.GITHUB_REPOSITORY_OWNER = 'microsoft'
          if (variable === undefined) {
            delete process.env.GITHUB_REPOSITORY
          } else {
            process.env.GITHUB_REPOSITORY = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

          // Assert
          await ExpectExtensions.toThrowAsync(func, `'GITHUB_REPOSITORY', accessed within 'GitHubReposInvoker.initializeForGitHub()', is invalid, null, or undefined '${Converter.toString(variable)}'.`)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')).once()

          // Finalization
          delete process.env.PR_METRICS_ACCESS_TOKEN
          delete process.env.GITHUB_ACTION
          delete process.env.GITHUB_API_URL
          delete process.env.GITHUB_REPOSITORY_OWNER
          delete process.env.GITHUB_REPOSITORY
        })
      })
    }

    it('should throw when GITHUB_REPOSITORY is in an incorrect format and the task is running on GitHub', async (): Promise<void> => {
      // Arrange
      delete process.env.PR_METRICS_ACCESS_TOKEN
      process.env.PR_METRICS_ACCESS_TOKEN = 'PAT'
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_API_URL = 'https://api.github.com'
      process.env.GITHUB_REPOSITORY_OWNER = 'microsoft'
      process.env.GITHUB_REPOSITORY = 'microsoft'
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      await ExpectExtensions.toThrowAsync(func, 'GITHUB_REPOSITORY \'microsoft\' is in an unexpected format.')
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')).once()

      // Finalization
      delete process.env.PR_METRICS_ACCESS_TOKEN
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_API_URL
      delete process.env.GITHUB_REPOSITORY_OWNER
      delete process.env.GITHUB_REPOSITORY
    })

    it('should succeed when the inputs are valid and the task is running on Azure Pipelines', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when the inputs are valid and the task is running on GitHub', async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_API_URL = 'https://api.github.com'
      process.env.GITHUB_REPOSITORY_OWNER = 'microsoft'
      process.env.GITHUB_REPOSITORY = 'microsoft/PR-Metrics'
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_API_URL
      delete process.env.GITHUB_REPOSITORY_OWNER
      delete process.env.GITHUB_REPOSITORY
    })

    it('should succeed when the inputs are valid and the URL ends with \'.git\'', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/PR-Metrics.git'
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when the inputs are valid and GitHub Enterprise is in use', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://organization.githubenterprise.com/microsoft/PR-Metrics'
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.baseUrl).to.equal('https://organization.githubenterprise.com/api/v3')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('Using Base URL \'https://organization.githubenterprise.com/api/v3\'.')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when called twice with the inputs valid', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.getTitleAndDescription()
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'PR-Metrics', 12345)).twice()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).twice()
    })

    it('should succeed when the description is null', async (): Promise<void> => {
      // Arrange
      const currentMockPullResponse: GetPullResponse = GitHubReposInvokerConstants.getPullResponse
      currentMockPullResponse.data.body = null
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenResolve(currentMockPullResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug(JSON.stringify(currentMockPullResponse))).once()
    })

    {
      const testCases: number[] = [
        401,
        403,
        404
      ]

      testCases.forEach((status: number): void => {
        it(`should throw when the PAT has insufficient access and the API call returns status '${status}'`, async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
            expect(options.auth).to.equal('PAT')
            expect(options.userAgent).to.equal(expectedUserAgent)
            expect(options.log).to.not.equal(null)
            expect(options.log.debug).to.not.equal(null)
            expect(options.log.info).to.not.equal(null)
            expect(options.log.warn).to.not.equal(null)
            expect(options.log.error).to.not.equal(null)
          })
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.status = status
          when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenThrow(error)
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

          // Act
          const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

          // Assert
          const result: any = await ExpectExtensions.toThrowAsync(func, 'Could not access the resources. Ensure the \'PR_Metrics_Access_Token\' secret environment variable has access to \'repos\'.')
          expect(result.internalMessage).to.equal('Test')
          verify(octokitWrapper.initialize(anything())).once()
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
        })
      })
    }

    it('should throw an error when an error occurs', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenThrow(Error('Error'))
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const func: () => Promise<PullRequestDetails> = async () => await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      await ExpectExtensions.toThrowAsync(func, 'Error')
      verify(octokitWrapper.initialize(anything())).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
    })

    it('should initialize log object correctly', async (): Promise<void> => {
      // Arrange
      let logObject: OctokitLogObject | undefined
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => { logObject = options.log })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))
      await gitHubReposInvoker.getTitleAndDescription()

      // Act
      logObject?.debug('Debug Message')
      logObject?.info('Info Message')
      logObject?.warn('Warning Message')
      logObject?.error('Error Message')

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
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const response: GetIssueCommentsResponse = GitHubReposInvokerConstants.getIssueCommentsResponse
      if (response.data[0] === undefined) {
        throw Error('response.data[0] is undefined')
      }

      response.data[0].body = 'PR Content'
      when(octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber())).thenResolve(response)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]?.id).to.equal(1)
      expect(result.pullRequestComments[0]?.content).to.equal('PR Content')
      expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments.length).to.equal(0)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.convertPullRequestComments()')).once()
      verify(logger.logDebug(JSON.stringify(response))).once()
    })

    it('should return the result when called with a file comment', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getReviewComments(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]?.id).to.equal(2)
      expect(result.fileComments[0]?.content).to.equal('File Content')
      expect(result.fileComments[0]?.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments[0]?.fileName).to.equal('file.ts')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.convertPullRequestComments()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getReviewCommentsResponse))).once()
    })

    it('should return the result when called with both a pull request and file comment', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const response: GetIssueCommentsResponse = GitHubReposInvokerConstants.getIssueCommentsResponse
      if (response.data[0] === undefined) {
        throw Error('response.data[0] is undefined')
      }

      response.data[0].body = 'PR Content'
      when(octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber())).thenResolve(response)
      when(octokitWrapper.getReviewComments(anyString(), anyString(), anyNumber())).thenResolve(GitHubReposInvokerConstants.getReviewCommentsResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(1)
      expect(result.pullRequestComments[0]?.id).to.equal(1)
      expect(result.pullRequestComments[0]?.content).to.equal('PR Content')
      expect(result.pullRequestComments[0]?.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments.length).to.equal(1)
      expect(result.fileComments[0]?.id).to.equal(2)
      expect(result.fileComments[0]?.content).to.equal('File Content')
      expect(result.fileComments[0]?.status).to.equal(CommentThreadStatus.Unknown)
      expect(result.fileComments[0]?.fileName).to.equal('file.ts')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.convertPullRequestComments()')).once()
      verify(logger.logDebug(JSON.stringify(response))).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getReviewCommentsResponse))).once()
    })

    it('should skip pull request comments with no body', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const response: GetIssueCommentsResponse = GitHubReposInvokerConstants.getIssueCommentsResponse
      if (response.data[0] === undefined) {
        throw Error('response.data[0] is undefined')
      }

      response.data[0].body = undefined
      when(octokitWrapper.getIssueComments(anyString(), anyString(), anyNumber())).thenResolve(response)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const result: CommentData = await gitHubReposInvoker.getComments()

      // Assert
      expect(result.pullRequestComments.length).to.equal(0)
      expect(result.fileComments.length).to.equal(0)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getIssueComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(octokitWrapper.getReviewComments('microsoft', 'PR-Metrics', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.convertPullRequestComments()')).once()
      verify(logger.logDebug(JSON.stringify(response))).once()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should succeed when the title and description are both null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).never()
    })

    it('should succeed when the title and description are both set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'PR-Metrics', 12345, 'Title', 'Description')).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug(JSON.stringify(GitHubReposInvokerConstants.getPullResponse))).once()
    })

    it('should succeed when the title is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'PR-Metrics', 12345, 'Title', undefined)).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should succeed when the description is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'PR-Metrics', 12345, undefined, 'Description')).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('createComment()', (): void => {
    it('should succeed when a file name is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should throw when the commit list is empty', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), anyNumber())).thenResolve({
        headers: {},
        status: 200,
        url: '',
        data: []
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const func: () => Promise<void> = async () => await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      await ExpectExtensions.toThrowAsync(func, '\'result.data[-1].sha\', accessed within \'GitHubReposInvoker.getCommitId()\', is invalid, null, or undefined \'undefined\'.')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
    })

    it('should succeed when there are multiple pages of commits', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 1)).thenResolve({
        headers: {
          link: '<https://api.github.com/repositories/309438703/pulls/172/commits?page=2>; rel="next", <https://api.github.com/repositories/309438703/pulls/172/commits?page=24>; rel="last"'
        },
        status: 200,
        url: '',
        data: []
      })
      when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 24)).thenResolve(GitHubReposInvokerConstants.listCommitsResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should throw when the link header does not match the expected format', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 1)).thenResolve({
        headers: {
          link: 'non-matching'
        },
        status: 200,
        url: '',
        data: []
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      const func: () => Promise<void> = async () => await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      await ExpectExtensions.toThrowAsync(func, 'The regular expression did not match \'non-matching\'.')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
    })

    it('should succeed when a file name is specified and the method is called twice', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
      verify(logger.logDebug('null')).twice()
    })

    it('should succeed when createReviewComment() returns undefined', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).thenResolve(null)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should succeed when a HTTP 422 error occurs due to having a too large path diff', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const error: HttpError = new HttpError(422, 'pull_request_review_thread.path diff too large')
      when(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).thenCall((): void => {
        throw error
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
      verify(logger.logInfo('GitHub createReviewComment() threw a 422 error related to a large diff. Ignoring as this is expected.')).once()
      verify(logger.logErrorObject(error)).once()
    })

    {
      const testCases: HttpError[] = [
        new HttpError(400, 'pull_request_review_thread.path diff too large'),
        new HttpError(422, 'Unprocessable Entity')
      ]

      testCases.forEach((error: HttpError): void => {
        it('should throw when an error occurs that is not a HTTP 422 or is not due to having a too large path diff', async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
            expect(options.auth).to.equal('PAT')
            expect(options.userAgent).to.equal(expectedUserAgent)
            expect(options.log).to.not.equal(null)
            expect(options.log.debug).to.not.equal(null)
            expect(options.log.info).to.not.equal(null)
            expect(options.log.warn).to.not.equal(null)
            expect(options.log.error).to.not.equal(null)
          })
          when(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).thenCall((): void => {
            throw error
          })
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

          // Act
          const func: () => Promise<void> = async () => await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

          // Assert
          await ExpectExtensions.toThrowAsync(func, error.message)
          verify(octokitWrapper.initialize(anything())).once()
          verify(octokitWrapper.listCommits('microsoft', 'PR-Metrics', 12345, 1)).once()
          verify(octokitWrapper.createReviewComment('microsoft', 'PR-Metrics', 12345, 'Content', 'file.ts', 'sha54321')).once()
          verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.getCommitId()')).once()
        })
      })
    }

    it('should succeed when no file name is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.createIssueComment('microsoft', 'PR-Metrics', 12345, 'Content')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('updateComment()', (): void => {
    it('should succeed when the content is null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.updateComment(54321, null, null)

      // Assert
      verify(logger.logDebug('* GitHubReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).never()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).never()
    })

    it('should succeed when the content is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.updateComment(54321, 'Content', null)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updateIssueComment('microsoft', 'PR-Metrics', 12345, 54321, 'Content')).once()
      verify(logger.logDebug('* GitHubReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('deleteCommentThread()', (): void => {
    it('should succeed', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options: any): void => {
        expect(options.auth).to.equal('PAT')
        expect(options.userAgent).to.equal(expectedUserAgent)
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(gitInvoker), instance(logger), instance(octokitWrapper), instance(runnerInvoker))

      // Act
      await gitHubReposInvoker.deleteCommentThread(54321)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.deleteReviewComment('microsoft', 'PR-Metrics', 54321)).once()
      verify(logger.logDebug('* GitHubReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')).once()
      verify(logger.logDebug('null')).once()
    })
  })
})
