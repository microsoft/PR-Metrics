// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import { instance, mock, verify, when } from 'ts-mockito'
import * as os from 'os'
import async from 'async'
import ExecSyncResult from '../wrappers/execSyncResult'
import GitInvoker from '../../src/git/gitInvoker'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('gitInvoker.ts', (): void => {
  let revParseWorkTreeExecSyncResult: IExecSyncResult
  let revParseBranchExecSyncResult: IExecSyncResult
  let diffExecSyncResult: IExecSyncResult
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'

    revParseWorkTreeExecSyncResult = new ExecSyncResult()
    revParseWorkTreeExecSyncResult.stdout = 'true'

    revParseBranchExecSyncResult = new ExecSyncResult()
    revParseBranchExecSyncResult.stdout = '7235cb16e5e6ac83e3cbecae66bab557e9e2cee6'

    diffExecSyncResult = new ExecSyncResult()
    diffExecSyncResult.stdout = '1\t2\tFile.txt'

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.execSync('git', 'rev-parse --is-inside-work-tree')).thenReturn(revParseWorkTreeExecSyncResult)
    when(taskLibWrapper.execSync('git', 'rev-parse --branch origin/develop...pull/12345/merge')).thenReturn(revParseBranchExecSyncResult)
    when(taskLibWrapper.execSync('git', 'diff --numstat origin/develop...pull/12345/merge')).thenReturn(diffExecSyncResult)
  })

  afterEach((): void => {
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  })

  describe('isGitEnlistment', (): void => {
    async.each(
      [
        'true',
        'true ',
        `true${os.EOL}`
      ], (response: string): void => {
        it(`should return true when called from a Git enlistment returning '${response.replace(/\n/g, '\\n')}'`, (): void => {
        // Arrange
          diffExecSyncResult.stdout = response
          const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

          // Act
          const result: boolean = gitInvoker.isGitEnlistment

          // Assert
          expect(result).to.equal(true)
          verify(taskLibWrapper.debug('* GitInvoker.isGitEnlistment')).once()
          verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
        })
      })

    it('should return false when not called from a Git enlistment', (): void => {
      // Arrange
      diffExecSyncResult.stdout = ''
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const result: boolean = gitInvoker.isGitEnlistment

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* GitInvoker.isGitEnlistment')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })

    it('should throw an error when Git invocation fails', (): void => {
      // Arrange
      revParseWorkTreeExecSyncResult.code = 1
      revParseWorkTreeExecSyncResult.error = new Error('Failure')
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => boolean = () => gitInvoker.isGitEnlistment

      // Assert
      expect(func).to.throw(revParseWorkTreeExecSyncResult.error)
      verify(taskLibWrapper.debug('* GitInvoker.isGitEnlistment')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })
  })

  describe('isGitHistoryAvailable', (): void => {
    it('should return true when the Git history is available', (): void => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const result: boolean = gitInvoker.isGitHistoryAvailable

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })

    it('should return true when the Git history is unavailable', (): void => {
      // Arrange
      revParseBranchExecSyncResult.stdout = `fatal: ambiguous argument 'origin/develop...pull/12345/merge': unknown revision or path not in the working tree.${os.EOL}`
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const result: boolean = gitInvoker.isGitHistoryAvailable

      // Assert
      expect(result).to.equal(false)
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })

    it('should return true when the Git history is available and the method is called twice', (): void => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const result1: boolean = gitInvoker.isGitHistoryAvailable
      const result2: boolean = gitInvoker.isGitHistoryAvailable

      // Assert
      expect(result1).to.equal(true)
      expect(result2).to.equal(true)
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).twice()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).twice()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).twice()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => boolean = () => gitInvoker.isGitHistoryAvailable

      // Assert
      expect(func).to.throw('\'SYSTEM_PULLREQUEST_TARGETBRANCH\', accessed within \'GitInvoker.getTargetBranch()\', is invalid, null, or undefined \'undefined\'.')
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is in an unexpected format', (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/head/develop'
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => boolean = () => gitInvoker.isGitHistoryAvailable

      // Assert
      expect(func).to.throw('Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH \'refs/head/develop\' in unexpected format.')
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_PULLREQUESTID is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => boolean = () => gitInvoker.isGitHistoryAvailable

      // Assert
      expect(func).to.throw('\'SYSTEM_PULLREQUEST_PULLREQUESTID\', accessed within \'GitInvoker.getPullRequestId()\', is invalid, null, or undefined \'undefined\'.')
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
    })

    it('should throw an error when Git invocation fails', (): void => {
      // Arrange
      revParseBranchExecSyncResult.code = 1
      revParseBranchExecSyncResult.error = new Error('Failure')
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => boolean = () => gitInvoker.isGitHistoryAvailable

      // Assert
      expect(func).to.throw(revParseBranchExecSyncResult.error)
      verify(taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })
  })

  describe('getDiffSummary()', (): void => {
    it('should return the correct output when no error occurs', (): void => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const result: string = gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal(diffExecSyncResult.stdout)
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })

    it('should return the correct output when no error occurs and the method is called twice', (): void => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      gitInvoker.getDiffSummary()
      const result: string = gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal(diffExecSyncResult.stdout)
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).twice()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).twice()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).twice()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw('\'SYSTEM_PULLREQUEST_TARGETBRANCH\', accessed within \'GitInvoker.getTargetBranch()\', is invalid, null, or undefined \'undefined\'.')
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is in an unexpected format', (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/head/develop'
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw('Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH \'refs/head/develop\' in unexpected format.')
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_PULLREQUESTID is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw('\'SYSTEM_PULLREQUEST_PULLREQUESTID\', accessed within \'GitInvoker.getPullRequestId()\', is invalid, null, or undefined \'undefined\'.')
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
    })

    it('should throw an error when Git invocation fails', (): void => {
      // Arrange
      diffExecSyncResult.code = 1
      diffExecSyncResult.error = new Error('Failure')
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw(diffExecSyncResult.error)
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.initialize()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })
  })
})
