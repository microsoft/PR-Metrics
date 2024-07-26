/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from '../utilities/validator'
import ExecOutput from '../runners/execOutput'
import Logger from '../utilities/logger'
import RunnerInvoker from '../runners/runnerInvoker'
import { decimalRadix } from '../utilities/constants'
import { singleton } from 'tsyringe'

/**
 * A class for invoking Git commands.
 * @remarks This class should not be used in a multithreaded context as it could lead to the initialization logic being invoked repeatedly.
 */
@singleton()
export default class GitInvoker {
  private readonly logger: Logger
  private readonly runnerInvoker: RunnerInvoker

  private isInitialized = false
  private targetBranchInternal = ''
  private pullRequestIdInternal = 0
  private pullRequestIdStringInternal = ''

  /**
   * Initializes a new instance of the `GitInvoker` class.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (logger: Logger, runnerInvoker: RunnerInvoker) {
    this.logger = logger
    this.runnerInvoker = runnerInvoker
  }

  /**
   * Gets the ID of the pull request.
   * @returns The ID of the pull request.
   */
  public get pullRequestId (): number {
    this.logger.logDebug('* GitInvoker.pullRequestId')

    if (this.pullRequestIdInternal !== 0) {
      return this.pullRequestIdInternal
    }

    this.pullRequestIdInternal = Validator.validateNumber(parseInt(this.pullRequestIdString, decimalRadix), 'Pull Request ID', 'GitInvoker.pullRequestId')
    return this.pullRequestIdInternal
  }

  private get pullRequestIdString (): string {
    this.logger.logDebug('* GitInvoker.pullRequestIdString')

    if (this.pullRequestIdStringInternal !== '') {
      return this.pullRequestIdStringInternal
    }

    this.pullRequestIdStringInternal = RunnerInvoker.isGitHub ? this.pullRequestIdForGitHub : this.pullRequestIdForAzurePipelines
    return this.pullRequestIdStringInternal
  }

  private get pullRequestIdForGitHub (): string {
    this.logger.logDebug('* GitInvoker.pullRequestIdForGitHub')

    const gitHubReference: string | undefined = process.env.GITHUB_REF
    if (gitHubReference === undefined) {
      this.logger.logWarning('\'GITHUB_REF\' is undefined.')
      return ''
    }

    const gitHubReferenceElements: string[] = gitHubReference.split('/')
    if (gitHubReferenceElements[2] === undefined) {
      this.logger.logWarning(`'GITHUB_REF' is in an incorrect format '${gitHubReference}'.`)
      return ''
    }

    return gitHubReferenceElements[2]
  }

  private get pullRequestIdForAzurePipelines (): string {
    this.logger.logDebug('* GitInvoker.pullRequestIdForAzurePipelines')

    const variable: string | undefined = process.env.BUILD_REPOSITORY_PROVIDER
    if (variable === undefined) {
      this.logger.logWarning('\'BUILD_REPOSITORY_PROVIDER\' is undefined.')
      return ''
    }

    if (variable === 'GitHub' || variable === 'GitHubEnterprise') {
      const result: string | undefined = process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
      if (result === undefined) {
        this.logger.logWarning('\'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER\' is undefined.')
        return ''
      }

      return result
    }

    const result: string | undefined = process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    if (result === undefined) {
      this.logger.logWarning('\'SYSTEM_PULLREQUEST_PULLREQUESTID\' is undefined.')
      return ''
    }

    return result
  }

  private get targetBranch (): string {
    this.logger.logDebug('* GitInvoker.targetBranch')

    if (RunnerInvoker.isGitHub) {
      return Validator.validateVariable('GITHUB_BASE_REF', 'GitInvoker.targetBranch')
    }

    const variable: string = Validator.validateVariable('SYSTEM_PULLREQUEST_TARGETBRANCH', 'GitInvoker.targetBranch')
    const expectedStart = 'refs/heads/'
    if (variable.startsWith(expectedStart)) {
      const startIndex: number = expectedStart.length
      return variable.substring(startIndex)
    }

    return variable
  }

  /**
   * Gets a value indicating whether the current folder corresponds to a Git repo.
   * @returns A promise containing a value indicating whether the current folder corresponds to a Git repo.
   */
  public async isGitRepo (): Promise<boolean> {
    this.logger.logDebug('* GitInvoker.isGitRepo()')

    try {
      await this.invokeGit('rev-parse --is-inside-work-tree')
      return true
    } catch {
      return false
    }
  }

  /**
   * Gets a value indicating whether the pull request ID is available.
   * @returns A value indicating whether the pull request ID is available.
   */
  public isPullRequestIdAvailable (): boolean {
    this.logger.logDebug('* GitInvoker.isPullRequestIdAvailable()')

    return !isNaN(parseInt(this.pullRequestIdString, decimalRadix))
  }

  /**
   * Gets a value indicating whether sufficient Git history is available to generate the PR metrics.
   * @returns A promise containing a value indicating whether sufficient Git history is available to generate the PR metrics.
   */
  public async isGitHistoryAvailable (): Promise<boolean> {
    this.logger.logDebug('* GitInvoker.isGitHistoryAvailable()')

    this.initialize()

    try {
      await this.invokeGit(`rev-parse --branch origin/${this.targetBranchInternal}...pull/${this.pullRequestIdStringInternal}/merge`)
      return true
    } catch {
      return false
    }
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns A promise containing the diff summary.
   */
  public async getDiffSummary (): Promise<string> {
    this.logger.logDebug('* GitInvoker.getDiffSummary()')

    this.initialize()
    return this.invokeGit(`diff --numstat --ignore-all-space origin/${this.targetBranchInternal}...pull/${this.pullRequestIdStringInternal}/merge`)
  }

  private initialize (): void {
    this.logger.logDebug('* GitInvoker.initialize()')

    if (this.isInitialized) {
      return
    }

    this.targetBranchInternal = this.targetBranch
    this.pullRequestIdStringInternal = this.pullRequestIdString
    this.isInitialized = true
  }

  private async invokeGit (parameters: string): Promise<string> {
    this.logger.logDebug('* GitInvoker.invokeGit()')

    const result: ExecOutput = await this.runnerInvoker.exec('git', parameters)
    if (result.exitCode !== 0) {
      throw new Error(result.stderr)
    }

    return result.stdout
  }
}
