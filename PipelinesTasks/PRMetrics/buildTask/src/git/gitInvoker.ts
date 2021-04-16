// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for invoking Git commands.
 */
@singleton()
export default class GitInvoker {
  private readonly _taskLibWrapper: TaskLibWrapper

  private _isInitialized: boolean = false
  private _targetBranch: string = ''
  private _pullRequestId: string = ''

  /**
   * Initializes a new instance of the `GitInvoker` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets a value indicating whether the current folder corresponds to a Git enlistment.
   * @returns A value indicating whether the current folder corresponds to a Git enlistment.
   */
  public get isGitEnlistment (): boolean {
    this._taskLibWrapper.debug('* GitInvoker.isGitEnlistment')

    const result: string = this.invokeGit('rev-parse --is-inside-work-tree')
    return result.trim() === 'true'
  }

  /**
   * Gets a value indicating whether sufficient Git history is available to generate the PR metrics.
   * @returns A value indicating whether sufficient Git history is available to generate the PR metrics.
   */
  public get isGitHistoryAvailable (): boolean {
    this._taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable')

    this.initialize()
    const result: string = this.invokeGit(`rev-parse --branch origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`)

    return !result.startsWith(`fatal: ambiguous argument 'origin/${this._targetBranch}...pull/${this._pullRequestId}/merge': unknown revision or path not in the working tree.`)
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns The diff summary.
   */
  public getDiffSummary (): string {
    this._taskLibWrapper.debug('* GitInvoker.getDiffSummary()')

    this.initialize()
    return this.invokeGit(`diff --numstat origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`)
  }

  private initialize (): void {
    this._taskLibWrapper.debug('* GitInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    this._targetBranch = this.getTargetBranch()
    this._pullRequestId = this.getPullRequestId()
    this._isInitialized = true
  }

  private getTargetBranch (): string {
    this._taskLibWrapper.debug('* GitInvoker.getTargetBranch()')

    const variable: string = Validator.validate(process.env.SYSTEM_PULLREQUEST_TARGETBRANCH, 'SYSTEM_PULLREQUEST_TARGETBRANCH', 'GitInvoker.getTargetBranch()')
    const expectedStart: string = 'refs/heads/'
    if (!variable.startsWith(expectedStart)) {
      throw Error(`Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH '${variable}' in unexpected format.`)
    }

    const startIndex: number = expectedStart.length
    return variable.substring(startIndex)
  }

  private getPullRequestId (): string {
    this._taskLibWrapper.debug('* GitInvoker.getPullRequestId()')

    return Validator.validate(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID, 'SYSTEM_PULLREQUEST_PULLREQUESTID', 'GitInvoker.getPullRequestId()')
  }

  private invokeGit (parameters: string): string {
    this._taskLibWrapper.debug('* GitInvoker.invokeGit()')

    const result: IExecSyncResult = this._taskLibWrapper.execSync('git', parameters)
    if (result.code !== 0) {
      throw result.error
    }

    return result.stdout
  }
}
