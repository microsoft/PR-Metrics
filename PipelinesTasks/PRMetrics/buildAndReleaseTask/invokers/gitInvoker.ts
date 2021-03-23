// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TaskLibWrapper from '../wrappers/taskLibWrapper'
import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'

/**
 * A class for invoking Git commands.
 */
class GitInvoker {
  private taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `GitInvoker` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this.taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns The diff summary.
   */
  public getDiffSummary (): string {
    this.taskLibWrapper.debug('* GitInvoker.getDiffSummary()')

    const targetBranch: string = this.getTargetBranch()
    const pullRequestId: string = this.getPullRequestId()
    return this.invokeGit(`diff --numstat origin/${targetBranch}...pull/${pullRequestId}/merge`)
  }

  private getTargetBranch (): string {
    this.taskLibWrapper.debug('* GitInvoker.getTargetBranch()')

    const variable: string | undefined = process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
    if (variable === undefined) {
      throw new Error('Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH undefined.')
    }

    const expectedStart: string = 'refs/heads/'
    if (!variable.startsWith(expectedStart)) {
      throw new Error(`Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH '${variable}' in unexpected format.`)
    }

    const startIndex: number = expectedStart.length
    return variable.substring(startIndex)
  }

  private getPullRequestId (): string {
    this.taskLibWrapper.debug('* GitInvoker.getPullRequestId()')

    const variable: string | undefined = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    if (variable === undefined) {
      throw new Error('Environment variable SYSTEM_PULLREQUEST_PULLREQUESTID undefined.')
    }

    return variable
  }

  private invokeGit (parameters: string): string {
    this.taskLibWrapper.debug('* GitInvoker.invokeGit()')

    const result: IExecSyncResult = this.taskLibWrapper.execSync('git', parameters)
    if (result.code !== 0) {
      throw result.error
    }

    return result.stdout
  }
}

export default GitInvoker
