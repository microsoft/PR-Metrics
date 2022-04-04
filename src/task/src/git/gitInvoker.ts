// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GitWritableStream } from './gitWritableStream'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import Logger from '../utilities/logger'
import RunnerInvoker from '../runners/runnerInvoker'

/**
 * A class for invoking Git commands.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class GitInvoker {
  private readonly _logger: Logger
  private readonly _runnerInvoker: RunnerInvoker

  private _isInitialized: boolean = false
  private _targetBranch: string = ''
  private _pullRequestId: number = 0
  private _pullRequestIdInternal: string = ''

  /**
   * Initializes a new instance of the `GitInvoker` class.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (logger: Logger, runnerInvoker: RunnerInvoker) {
    this._logger = logger
    this._runnerInvoker = runnerInvoker
  }

  /**
   * Gets a value indicating whether the current folder corresponds to a Git repo.
   * @returns A promise containing a value indicating whether the current folder corresponds to a Git repo.
   */
  public async isGitRepo (): Promise<boolean> {
    this._logger.logDebug('* GitInvoker.isGitRepo()')

    try {
      await this.invokeGit(['rev-parse', '--is-inside-work-tree'])
      return true
    } catch {
      return false
    }
  }

  /**
   * Gets a value indicating whether sufficient Git history is available to generate the PR metrics.
   * @returns A promise containing a value indicating whether sufficient Git history is available to generate the PR metrics.
   */
  public async isGitHistoryAvailable (): Promise<boolean> {
    this._logger.logDebug('* GitInvoker.isGitHistoryAvailable()')

    this.initialize()

    try {
      await this.invokeGit(['rev-parse', '--branch', `origin/${this._targetBranch}...pull/${this._pullRequestIdInternal}/merge`])
      return true
    } catch {
      return false
    }
  }

  /**
   * Gets the ID of the pull request.
   * @returns The ID of the pull request.
   */
  public get pullRequestId (): number {
    this._logger.logDebug('* GitInvoker.pullRequestId')

    if (this._pullRequestId !== 0) {
      return this._pullRequestId
    }

    this._pullRequestId = Validator.validate(parseInt(this.pullRequestIdInternal), 'Pull Request ID', 'GitInvoker.pullRequestId')
    return this._pullRequestId
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns A promise containing the diff summary.
   */
  public getDiffSummary (): Promise<string> {
    this._logger.logDebug('* GitInvoker.getDiffSummary()')

    this.initialize()
    return this.invokeGit(['diff', '--numstat', `origin/${this._targetBranch}...pull/${this._pullRequestIdInternal}/merge`])
  }

  private initialize (): void {
    this._logger.logDebug('* GitInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    this._targetBranch = this.targetBranch
    this._pullRequestIdInternal = this.pullRequestIdInternal
    this._isInitialized = true
  }

  private get pullRequestIdInternal (): string {
    this._logger.logDebug('* GitInvoker.pullRequestIdInternal')

    if (this._pullRequestIdInternal) {
      return this._pullRequestIdInternal
    }

    this._pullRequestIdInternal = RunnerInvoker.isGitHub ? this.pullRequestIdForGitHub : this.pullRequestIdForAzurePipelines
    return this._pullRequestIdInternal
  }

  private get pullRequestIdForGitHub (): string {
    this._logger.logDebug('* GitInvoker.pullRequestIdForGitHub')

    const gitHubReference: string = Validator.validateVariable('GITHUB_REF', 'GitInvoker.pullRequestIdForGitHub')
    const gitHubReferenceElements: string[] = gitHubReference.split('/')
    if (gitHubReferenceElements.length !== 4) {
      throw Error(`GITHUB_REF '${gitHubReference}' is in an unexpected format.`)
    }

    return gitHubReferenceElements[2]!
  }

  private get pullRequestIdForAzurePipelines (): string {
    this._logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')

    const variable: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'GitInvoker.pullRequestIdForAzurePipelines')
    if (variable === 'GitHub' || variable === 'GitHubEnterprise') {
      return Validator.validateVariable('SYSTEM_PULLREQUEST_PULLREQUESTNUMBER', 'GitInvoker.pullRequestIdForAzurePipelines')
    } else {
      return Validator.validateVariable('SYSTEM_PULLREQUEST_PULLREQUESTID', 'GitInvoker.pullRequestIdForAzurePipelines')
    }
  }

  private get targetBranch (): string {
    this._logger.logDebug('* GitInvoker.targetBranch')

    if (RunnerInvoker.isGitHub) {
      return Validator.validateVariable('GITHUB_BASE_REF', 'GitInvoker.targetBranch')
    }

    const variable: string = Validator.validateVariable('SYSTEM_PULLREQUEST_TARGETBRANCH', 'GitInvoker.targetBranch')
    const expectedStart: string = 'refs/heads/'
    if (variable.startsWith(expectedStart)) {
      const startIndex: number = expectedStart.length
      return variable.substring(startIndex)
    } else {
      return variable
    }
  }

  private async invokeGit (parameters: string[]): Promise<string> {
    this._logger.logDebug('* GitInvoker.invokeGit()')

    const outputStream: GitWritableStream = new GitWritableStream(this._logger)
    const errorStream: GitWritableStream = new GitWritableStream(this._logger)
    const result: number = await this._runnerInvoker.exec('git', parameters, true, outputStream, errorStream)

    if (result !== 0) {
      throw Error(errorStream.message)
    }

    return outputStream.message
  }
}
