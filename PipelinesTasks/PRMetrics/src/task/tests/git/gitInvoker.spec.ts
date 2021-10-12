// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anything, instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import async from 'async'
import GitInvoker from '../../src/git/gitInvoker'
import Logger from '../../src/utilities/logger'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('gitInvoker.ts', (): void => {
  let logger: Logger
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'

    logger = mock(Logger)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.exec('git', 'rev-parse --is-inside-work-tree', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
      options.outStream!.write('true')
      return Promise.resolve(0)
    })
    when(taskLibWrapper.exec('git', 'rev-parse --branch origin/develop...pull/12345/merge', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
      options.outStream!.write('7235cb16e5e6ac83e3cbecae66bab557e9e2cee6')
      return Promise.resolve(0)
    })
    when(taskLibWrapper.exec('git', 'diff --numstat origin/develop...pull/12345/merge', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
      options.outStream!.write('1\t2\tFile.txt')
      return Promise.resolve(0)
    })
  })

  afterEach((): void => {
    delete process.env.BUILD_REPOSITORY_PROVIDER
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  })

  describe('isGitEnlistment()', (): void => {
    async.each(
      [
        'true',
        'true ',
        'true\n'
      ], (response: string): void => {
        it(`should return true when called from a Git enlistment returning '${response.replace(/\n/g, '\\n')}'`, async (): Promise<void> => {
          // Arrange
          when(taskLibWrapper.exec('git', 'rev-parse --is-inside-work-tree', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
            options.outStream!.write(response)
            return Promise.resolve(0)
          })
          const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

          // Act
          const result: boolean = await gitInvoker.isGitEnlistment()

          // Assert
          expect(result).to.equal(true)
          verify(logger.logDebug('* GitInvoker.isGitEnlistment()')).once()
          verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
        })
      })

    it('should return false when not called from a Git enlistment', async (): Promise<void> => {
      // Arrange
      when(taskLibWrapper.exec('git', 'rev-parse --is-inside-work-tree', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
        options.errStream!.write('Failure')
        return Promise.resolve(1)
      })
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      const result: boolean = await gitInvoker.isGitEnlistment()

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* GitInvoker.isGitEnlistment()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })
  })

  describe('isGitHistoryAvailable()', (): void => {
    it('should return true when the Git history is available', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should return true when the Git history is available and the PR is on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
          delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
          const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

          // Act
          const result: boolean = await gitInvoker.isGitHistoryAvailable()

          // Assert
          expect(result).to.equal(true)
          verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
          verify(logger.logDebug('* GitInvoker.initialize()')).once()
          verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
          verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
          verify(logger.logDebug('* GitInvoker.invokeGit()')).once()

          // Finalization
          delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
        })
      })

    it('should return false when the Git history is unavailable', async (): Promise<void> => {
      // Arrange
      when(taskLibWrapper.exec('git', 'rev-parse --branch origin/develop...pull/12345/merge', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
        options.errStream!.write('fatal: ambiguous argument \'origin/develop...pull/12345/merge\': unknown revision or path not in the working tree.\n')
        return Promise.resolve(1)
      })
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return true when the Git history is available and the method is called twice', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      const result1: boolean = await gitInvoker.isGitHistoryAvailable()
      const result2: boolean = await gitInvoker.isGitHistoryAvailable()

      // Assert
      expect(result1).to.equal(true)
      expect(result2).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).twice()
      verify(logger.logDebug('* GitInvoker.initialize()')).twice()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).twice()
    })

    it('should throw an error when BUILD_REPOSITORY_PROVIDER is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.isGitHistoryAvailable()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'GitInvoker.getPullRequestId()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.isGitHistoryAvailable()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_TARGETBRANCH\', accessed within \'GitInvoker.getTargetBranch()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_PULLREQUESTID is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.isGitHistoryAvailable()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_PULLREQUESTID\', accessed within \'GitInvoker.getPullRequestId()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
    })

    async.each(
      [
        'GitHub',
        'GitHubEnterprise'
      ], (buildRepositoryProvider: string): void => {
        it(`should throw an error when the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is undefined`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider
          const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitInvoker.isGitHistoryAvailable()
          } catch (error: any) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER\', accessed within \'GitInvoker.getPullRequestId()\', is invalid, null, or undefined \'undefined\'.')
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitInvoker.isGitHistoryAvailable()')).once()
          verify(logger.logDebug('* GitInvoker.initialize()')).once()
          verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
          verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })
  })

  describe('getDiffSummary()', (): void => {
    it('should return the correct output when no error occurs', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      const result: string = await gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal('1\t2\tFile.txt')
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return the correct output when no error occurs and the target branch is in the GitHub format', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'develop'
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      const result: string = await gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal('1\t2\tFile.txt')
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })

    it('should return the correct output when no error occurs and the method is called twice', async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))

      // Act
      await gitInvoker.getDiffSummary()
      const result: string = await gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal('1\t2\tFile.txt')
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).twice()
      verify(logger.logDebug('* GitInvoker.initialize()')).twice()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).twice()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.getDiffSummary()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_TARGETBRANCH\', accessed within \'GitInvoker.getTargetBranch()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_PULLREQUESTID is undefined', async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitInvoker.getDiffSummary()
      } catch (error: any) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_PULLREQUESTID\', accessed within \'GitInvoker.getPullRequestId()\', is invalid, null, or undefined \'undefined\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitInvoker.getDiffSummary()')).once()
      verify(logger.logDebug('* GitInvoker.initialize()')).once()
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
    })

    it('should throw an error when Git invocation fails', async (): Promise<void> => {
      // Arrange
      when(taskLibWrapper.exec('git', 'diff --numstat origin/develop...pull/12345/merge', anything())).thenCall((_: string, __: string, options: IExecOptions): Promise<number> => {
        options.errStream!.write('Failure')
        return Promise.resolve(1)
      })
      const gitInvoker: GitInvoker = new GitInvoker(instance(logger), instance(taskLibWrapper))
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
      verify(logger.logDebug('* GitInvoker.getTargetBranch()')).once()
      verify(logger.logDebug('* GitInvoker.getPullRequestId()')).once()
      verify(logger.logDebug('* GitInvoker.invokeGit()')).once()
    })
  })
})
