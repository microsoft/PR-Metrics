// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import { instance, mock, verify, when } from 'ts-mockito'
import ExecSyncResult from '../wrappers/execSyncResult'
import GitInvoker from '../../src/git/gitInvoker'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('gitInvoker.ts', (): void => {
  describe('getDiffSummary()', (): void => {
    let execSyncResult: IExecSyncResult
    let taskLibWrapper: TaskLibWrapper

    beforeEach((): void => {
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = 'refs/heads/develop'
      process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '12345'

      execSyncResult = new ExecSyncResult()
      execSyncResult.stdout = '1\t2\tFile.txt'

      taskLibWrapper = mock(TaskLibWrapper)
      when(taskLibWrapper.execSync('git', 'diff --numstat origin/develop...pull/12345/merge')).thenReturn(execSyncResult)
    })

    afterEach((): void => {
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    })

    it('should returns the correct output when no error occurs', (): void => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const result: string = gitInvoker.getDiffSummary()

      // Assert
      expect(result).to.equal(execSyncResult.stdout)
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw('Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH undefined.')
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
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
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
    })

    it('should throw an error when SYSTEM_PULLREQUEST_PULLREQUESTID is undefined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw('Environment variable SYSTEM_PULLREQUEST_PULLREQUESTID undefined.')
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
    })

    it('should throw an error when Git invocation fails', (): void => {
      // Arrange
      execSyncResult.code = 1
      execSyncResult.error = new Error('Failure')
      const gitInvoker: GitInvoker = new GitInvoker(instance(taskLibWrapper))

      // Act
      const func: () => string = () => gitInvoker.getDiffSummary()

      // Assert
      expect(func).to.throw(execSyncResult.error)
      verify(taskLibWrapper.debug('* GitInvoker.getDiffSummary()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getTargetBranch()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.getPullRequestId()')).once()
      verify(taskLibWrapper.debug('* GitInvoker.invokeGit()')).once()
    })
  })
})
