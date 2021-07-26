// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from './gitWritableStream'
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import Logger from '../utilities/logger'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for invoking Git commands.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class GitInvoker {
  private readonly _logger: Logger
  private readonly _taskLibWrapper: TaskLibWrapper

  private _isInitialized: boolean = false
  private _targetBranch: string = ''
  private _pullRequestId: string = ''

  /**
   * Initializes a new instance of the `GitInvoker` class.
   * @param logger The logger.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (logger: Logger, taskLibWrapper: TaskLibWrapper) {
    this._logger = logger
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets a value indicating whether the current folder corresponds to a Git enlistment.
   * @returns A promise containing a value indicating whether the current folder corresponds to a Git enlistment.
   */
  public async isGitEnlistment (): Promise<boolean> {
    this._logger.logDebug('* GitInvoker.isGitEnlistment()')

    const result: string = await this.invokeGit('rev-parse --is-inside-work-tree')
    return result.startsWith('true')
  }

  /**
   * Gets a value indicating whether sufficient Git history is available to generate the PR metrics.
   * @returns A promise containing a value indicating whether sufficient Git history is available to generate the PR metrics.
   */
  public async isGitHistoryAvailable (): Promise<boolean> {
    this._logger.logDebug('* GitInvoker.isGitHistoryAvailable()')

    this.initialize()
    const result: string = await this.invokeGit(`rev-parse --branch origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`)

    return !result.startsWith(`fatal: ambiguous argument 'origin/${this._targetBranch}...pull/${this._pullRequestId}/merge': unknown revision or path not in the working tree.`)
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns A promise containing the diff summary.
   */
  public getDiffSummary (): Promise<string> {
    this._logger.logDebug('* GitInvoker.getDiffSummary()')

    this.initialize()
    return this.invokeGit(`diff --numstat origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`)
  }

  private initialize (): void {
    this._logger.logDebug('* GitInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    this._targetBranch = this.getTargetBranch()
    this._pullRequestId = this.getPullRequestId()
    this._isInitialized = true
  }

  private getTargetBranch (): string {
    this._logger.logDebug('* GitInvoker.getTargetBranch()')

    const variable: string = Validator.validate(process.env.SYSTEM_PULLREQUEST_TARGETBRANCH, 'SYSTEM_PULLREQUEST_TARGETBRANCH', 'GitInvoker.getTargetBranch()')
    const expectedStart: string = 'refs/heads/'
    if (variable.startsWith(expectedStart)) {
      const startIndex: number = expectedStart.length
      return variable.substring(startIndex)
    } else {
      return variable
    }
  }

  private getPullRequestId (): string {
    this._logger.logDebug('* GitInvoker.getPullRequestId()')

    if (process.env.BUILD_REPOSITORY_PROVIDER === 'GitHub') {
      return Validator.validate(process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER, 'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER', 'GitInvoker.getPullRequestId()')
    } else {
      return Validator.validate(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID, 'SYSTEM_PULLREQUEST_PULLREQUESTID', 'GitInvoker.getPullRequestId()')
    }
  }

  private async invokeGit (parameters: string): Promise<string> {
    this._logger.logDebug('* GitInvoker.invokeGit()')

    const outputStream: GitWritableStream = new GitWritableStream(this._logger)
    const errorStream: GitWritableStream = new GitWritableStream(this._logger)
    const execOption: IExecOptions = {
      failOnStdErr: true,
      outStream: outputStream,
      errStream: errorStream
    }

    const result: number = await this._taskLibWrapper.exec('git', parameters, execOption)
    if (result !== 0) {
      throw Error(errorStream.message)
    }

    return outputStream.message
  }
}
