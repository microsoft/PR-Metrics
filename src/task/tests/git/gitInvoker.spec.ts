// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import { GitWritableStream } from '../../src/git/gitWritableStream'
import GitInvoker from '../../src/git/gitInvoker'
import Logger from '../../src/utilities/logger'
import RunnerInvoker from '../../src/runners/runnerInvoker'

describe('gitInvoker.ts', (): void => {
  let logger: Logger
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'

    logger = mock(Logger)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.exec('git', deepEqual(['rev-parse', '--branch', 'origin/develop...pull/12345/merge']), true, anything(), anything())).thenCall(async (_: string, __: string, ___: boolean, outputStream: GitWritableStream): Promise<number> => {
      const testCommitId: string = '7235cb16e5e6ac83e3cbecae66bab557e9e2cee6'
      outputStream.write(testCommitId)
      return await Promise.resolve(0)
    })
    when(runnerInvoker.exec('git', deepEqual(['diff', '--numstat', 'origin/develop...pull/12345/merge']), true, anything(), anything())).thenCall(async (_: string, __: string, ___: boolean, outputStream: GitWritableStream): Promise<number> => {
      outputStream.write('1\t2\tFile.txt')
      return await Promise.resolve(0)
    })
  })

  afterEach((): void => {
    delete process.env.BUILD_REPOSITORY_PROVIDER
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  })

  describe('isGitRepo()', (): void => {
    {
      const testCases: string[] = [
        'true',
        'true ',
        'true\n'
      ]

      testCases.forEach((response: string): void => {
        it(`should return true when called from a Git repo returning '${response.replace(/\n/g, '\\n')}'`, async (): Promise<void> => {
          // Arrange
          when(runnerInvoker.exec('git', deepEqual(['rev-parse', '--is-inside-work-tree']), true, anything(), anything())).thenCall(async (_: string, __: string, ___: boolean, outputStream: GitWritableStream): Promise<number> => {
            outputStream.write(response)
            return await Promise.resolve(0)
          })
          const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

          // Act
          const result: boolean = await gitInvoker.isGitRepo()

          // Assert
          expect(result).to.equal(true)
          verify(logger.logDebug('* GitInvoker.isGitRepo()')).once()
          verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
        })
      })
    }

    it('should return false when not called from a Git repo', async (): Promise<void> => {
      // Arrange
      when(runnerInvoker.exec('git', deepEqual(['rev-parse', '--is-inside-work-tree']), true, anything(), anything())).thenCall(async (_: string, __: string, ___: boolean, ____: GitWritableStream, errorStream: GitWritableStream): Promise<number> => {
        errorStream.write('Failure')
        return await Promise.resolve(1)
      })
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: boolean = await gitInvoker.isGitRepo()

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* GitInvoker.isGitRepo()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })
  })

  describe('isGitHistoryAvailable()', (): void => {
    it('should return true when the Git history is available', async (): Promise<void> => {
      // Arrange
      delete process.env.GITHUB_ACTION
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return true when the Git history is available and the method is called after retrieving the pull request ID', async (): Promise<void> => {
      // Arrange
      delete process.env.GITHUB_ACTION
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result1: number = gitInvoker.pullRequestId
      const result2: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result1).to.equal(12345)
      expect(result2).to.equal(true)
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).twice()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return true when the Git history is available and the PR is using the GitHub runner', async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_BASE_REF = 'develop'
      process.env.GITHUB_REF = 'refs/pull/12345/merge'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_BASE_REF
      delete process.env.GITHUB_REF
    })

    it('should throw an error when the PR is using the GitHub runner and GITHUB_BASE_REF is undefined', async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.isGitHistoryAvailable()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'GITHUB_BASE_REF\', accessed within \'GitInvoker.targetBranch\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })

    {
      const testCases: string[] = [
        'GitHub',
        'GitHubEnterprise'
      ]

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should return true when the Git history is available and the PR is on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
          delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
          const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

          // Act
          const result: boolean = await gitInvoker.isGitHistoryAvailable()

          // Assert
          expect(result).to.equal(true)
          verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
          verify(logger.logDebug('* GitInvoker.initialize()')).once()
          verify(logger.logDebug('* GitInvoker.targetBranch')).once()
          verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
          verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
          verify(logger.logDebug('* GitInvoker.invokeGit()')).once()

          // Finalization
          delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
        })
      })
    }

    it('should return false when the Git history is unavailable', async (): Promise<void> => {
      // Arrange
      when(runnerInvoker.exec('git', deepEqual(['rev-parse', '--branch', 'origin/develop...pull/12345/merge']), true, anything(), anything())).thenCall(async (_: string, __: string, ___: boolean, ____: GitWritableStream, errorStream: GitWritableStream): Promise<number> => {
        errorStream.write('fatal: ambiguous argument \'origin/develop...pull/12345/merge\': unknown revision or path not in the working tree.\n')
        return await Promise.resolve(1)
      })
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return true when the Git history is available and the method is called twice', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result1: boolean = await gitInvoker.isGitHistoryAvailable()
      const result2: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result1).to.equal(true)
      expect(result2).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).twice()
      verify(logger.logDebug('* GitInvoker.initialize()')).twice()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).twice()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.isGitHistoryAvailable()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_TARGETBRANCH\', accessed within \'GitInvoker.targetBranch\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
    })
  })

  describe('pullRequestId', (): void => {
    it('should return the correct output when the GitHub runner is being used', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_REF = 'refs/pull/12345/merge'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: number = gitInvoker.pullRequestId

      // Assert
      expect(result).to.equal(12345)
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_REF
    })

    it('should return the correct output when the GitHub runner is being used and it is called multiple times', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_REF = 'refs/pull/12345/merge'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result1: number = gitInvoker.pullRequestId
      const result2: number = gitInvoker.pullRequestId

      // Assert
      expect(result1).to.equal(12345)
      expect(result2).to.equal(12345)
      verify(logger.logDebug('* GitInvoker.pullRequestId')).twice()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_REF
    })

    it('should throw an error when the GitHub runner is being used and GITHUB_REF is undefined', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const func: () => void = () => gitInvoker.pullRequestId

      // Assert
      expect(func).to.throw('\'GITHUB_REF\', accessed within \'GitInvoker.pullRequestIdForGitHub\', is invalid, null, or undefined \'undefined\'.')
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })

    it('should throw an error when the GitHub runner is being used and GITHUB_REF is in the incorrect format', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_REF = 'refs/pull'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const func: () => void = () => gitInvoker.pullRequestId

      // Assert
      expect(func).to.throw('GITHUB_REF \'refs/pull\' is in an unexpected format.')
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_REF
    })

    it('should return the correct output when the Azure Pipelines runner is being used', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_REF = 'refs/pull/12345/merge'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: number = gitInvoker.pullRequestId

      // Assert
      expect(result).to.equal(12345)
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_REF
    })

    it('should throw an error when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is undefined', (): void => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const func: () => void = () => gitInvoker.pullRequestId

      // Assert
      expect(func).to.throw('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'GitInvoker.pullRequestIdForAzurePipelines\', is invalid, null, or undefined \'undefined\'.')
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
    })

    it('should throw an error when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const func: () => void = () => gitInvoker.pullRequestId

      // Assert
      expect(func).to.throw('\'SYSTEM_PULLREQUEST_PULLREQUESTID\', accessed within \'GitInvoker.pullRequestIdForAzurePipelines\', is invalid, null, or undefined \'undefined\'.')
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
    })

    {
      const testCases: string[] = [
        'GitHub',
        'GitHubEnterprise'
      ]

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should throw an error when the Azure Pipelines runner is being used and the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is undefined`, (): void => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

          // Act
          const func: () => void = () => gitInvoker.pullRequestId

          // Assert
          expect(func).to.throw('\'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER\', accessed within \'GitInvoker.pullRequestIdForAzurePipelines\', is invalid, null, or undefined \'undefined\'.')
          verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
          verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
          verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })
    }

    it('should throw an error when the ID cannot be parsed as an integer', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      process.env.GITHUB_REF = 'refs/pull/PullRequestID/merge'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const func: () => void = () => gitInvoker.pullRequestId

      // Assert
      expect(func).to.throw('\'Pull Request ID\', accessed within \'GitInvoker.pullRequestId\', is invalid, null, or undefined \'NaN\'.')
      verify(logger.logDebug('* GitInvoker.pullRequestId')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForGitHub')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
      delete process.env.GITHUB_REF
    })
  })

  describe('getDiffSummary()', (): void => {
    it('should return the correct output when no error occurs', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: string = await gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal('1\t2\tFile.txt')
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return the correct output when no error occurs and the target branch is in the GitHub format', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'develop'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      const result: string = await gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal('1\t2\tFile.txt')
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return the correct output when no error occurs and the method is called twice', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))

      // Act
      await gitInvoker.getDiffSummary()
      const result: string = await gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal('1\t2\tFile.txt')
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).twice()
      verify(logger.logDebug('* GitInvoker.initialize()')).twice()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).twice()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.getDiffSummary()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_TARGETBRANCH\', accessed within \'GitInvoker.targetBranch\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
    })

    it('should throw an error when Git invocation fails', async (): Promise<void> => {
      // Arrange
      when(runnerInvoker.exec('git', deepEqual(['diff', '--numstat', 'origin/develop...pull/12345/merge']), true, anything(), anything())).thenCall(async (_: string, __: string, ___: boolean, ____: GitWritableStream, errorStream: GitWritableStream): Promise<number> => {
        errorStream.write('Failure')
        return await Promise.resolve(1)
      })
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(runnerInvoker))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.getDiffSummary()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Failure')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.targetBranch')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdInternal')).once()
      verify(logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })
  })
})
