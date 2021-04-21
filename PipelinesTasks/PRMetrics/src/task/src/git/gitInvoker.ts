// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import stream from 'stream'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

export class GitWritableStream extends stream.Writable {
  private _message: string = ''

  public get message (): string {
    return this._message.trim()
  }

  public _write (chunk: any, _: string, callback: (error?: Error | null) => void): void {
    const currentChunk: string = chunk.toString()
    if (!currentChunk.startsWith('[command]')) {
      this._message += currentChunk
    }

    callback()
  }
}

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
   * @returns A promise containing a value indicating whether the current folder corresponds to a Git enlistment.
   */
  public async isGitEnlistment (): Promise<boolean> {
    this._taskLibWrapper.debug('* GitInvoker.isGitEnlistment()')

    const result: string = await this.invokeGit('rev-parse --is-inside-work-tree')
    return result === 'true'
  }

  /**
   * Gets a value indicating whether sufficient Git history is available to generate the PR metrics.
   * @returns A promise containing a value indicating whether sufficient Git history is available to generate the PR metrics.
   */
  public async isGitHistoryAvailable (): Promise<boolean> {
    this._taskLibWrapper.debug('* GitInvoker.isGitHistoryAvailable()')

    this.initialize()
    const result: string = await this.invokeGit(`rev-parse --branch origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`)

    return !result.startsWith(`fatal: ambiguous argument 'origin/${this._targetBranch}...pull/${this._pullRequestId}/merge': unknown revision or path not in the working tree.`)
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns A promise containing the diff summary.
   */
  public getDiffSummary (): Promise<string> {
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

  private async invokeGit (parameters: string): Promise<string> {
    this._taskLibWrapper.debug('* GitInvoker.invokeGit()')

    const outputStream: GitWritableStream = new GitWritableStream()
    const errorStream: GitWritableStream = new GitWritableStream()
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
