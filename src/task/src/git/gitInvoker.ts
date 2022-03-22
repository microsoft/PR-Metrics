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
  private _pullRequestId: string = ''

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
   * Gets the ID of the pull request.
   */
  public static get pullRequestId (): string {
    return RunnerInvoker.isGitHub ? this.pullRequestIdForGitHub : this.pullRequestIdForAzureDevOps
  }

  /**
   * Gets a value indicating whether the current folder corresponds to a Git enlistment.
   * @returns A promise containing a value indicating whether the current folder corresponds to a Git enlistment.
   */
  public async isGitEnlistment (): Promise<boolean> {
    this._logger.logDebug('* GitInvoker.isGitEnlistment()')

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
      await this.invokeGit(['rev-parse', '--branch', `origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`])
      return true
    } catch {
      return false
    }
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns A promise containing the diff summary.
   */
  public getDiffSummary (): Promise<string> {
    this._logger.logDebug('* GitInvoker.getDiffSummary()')

    this.initialize()
    return this.invokeGit(['diff', '--numstat', `origin/${this._targetBranch}...pull/${this._pullRequestId}/merge`])
  }

  private initialize (): void {
    this._logger.logDebug('* GitInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    this._targetBranch = this.getTargetBranch()
    this._pullRequestId = GitInvoker.pullRequestId
    this._isInitialized = true
  }

  private static get pullRequestIdForGitHub (): string {
    const gitHubReference: string = Validator.validateVariable('GITHUB_REF', 'GitInvoker.pullRequestIdForGitHub()')
    const gitHubReferenceElements: string[] = gitHubReference.split('/')
    if (gitHubReferenceElements.length !== 4) {
      throw Error(`GITHUB_REF '${gitHubReference}' is in an unexpected format.`)
    }

    return gitHubReferenceElements[2]!
  }

  private static get pullRequestIdForAzureDevOps (): string {
    const variable: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'GitInvoker.pullRequestIdForAzureDevOps()')
    if (variable === 'GitHub' || variable === 'GitHubEnterprise') {
      return Validator.validateVariable('SYSTEM_PULLREQUEST_PULLREQUESTNUMBER', 'GitInvoker.pullRequestIdForAzureDevOps()')
    } else {
      return Validator.validateVariable('SYSTEM_PULLREQUEST_PULLREQUESTID', 'GitInvoker.pullRequestIdForAzureDevOps()')
    }
  }

  private getTargetBranch (): string {
    this._logger.logDebug('* GitInvoker.getTargetBranch()')

    if (RunnerInvoker.isGitHub) {
      return Validator.validateVariable('GITHUB_BASE_REF', 'GitInvoker.getTargetBranch()')
    }

    const variable: string = Validator.validateVariable('SYSTEM_PULLREQUEST_TARGETBRANCH', 'GitInvoker.getTargetBranch()')
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
