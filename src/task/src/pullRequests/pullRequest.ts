/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from '../utilities/validator'
import CodeMetrics from '../metrics/codeMetrics'
import Logger from '../utilities/logger'
import RunnerInvoker from '../runners/runnerInvoker'
import { injectable } from 'tsyringe'

/**
 * A class for managing pull requests.
 */
@injectable()
export default class PullRequest {
  private readonly _codeMetrics: CodeMetrics
  private readonly _logger: Logger
  private readonly _runnerInvoker: RunnerInvoker

  /**
   * Initializes a new instance of the `PullRequest` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (codeMetrics: CodeMetrics, logger: Logger, runnerInvoker: RunnerInvoker) {
    this._codeMetrics = codeMetrics
    this._logger = logger
    this._runnerInvoker = runnerInvoker
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public get isPullRequest (): boolean {
    this._logger.logDebug('* PullRequest.isPullRequest')

    return RunnerInvoker.isGitHub ? process.env.GITHUB_BASE_REF !== '' : process.env.SYSTEM_PULLREQUEST_PULLREQUESTID !== undefined
  }

  /**
   * Determines whether the task is running against a supported pull request provider.
   * @returns `true` if the task is running against a supported pull request provider, or the name of the pull request provider otherwise.
   */
  public get isSupportedProvider (): boolean | string {
    this._logger.logDebug('* PullRequest.isSupportedProvider')

    // If the action is running on GitHub, the provider is always GitHub and therefore valid.
    if (RunnerInvoker.isGitHub) {
      return true
    }

    // If the action is running on Azure DevOps, check the provider.
    const variable: string = Validator.validateVariable('BUILD_REPOSITORY_PROVIDER', 'PullRequest.isSupportedProvider')
    if (variable === 'TfsGit' || variable === 'GitHub' || variable === 'GitHubEnterprise') {
      return true
    }

    return variable
  }

  /**
   * Gets the description to which to update the pull request's current description.
   * @param currentDescription The pull request's current description.
   * @returns The value to which to update the description or `null` if the description is not to be updated.
   */
  public getUpdatedDescription (currentDescription: string | undefined): string | null {
    this._logger.logDebug('* PullRequest.getUpdatedDescription()')

    if (currentDescription !== undefined && currentDescription.trim() !== '') {
      return null
    }

    return this._runnerInvoker.loc('pullRequests.pullRequest.addDescription')
  }

  /**
   * Gets the description to which to update the pull request's current title.
   * @param currentTitle The pull request's current title.
   * @returns A promise containing value to which to update the title or `null` if the title is not to be updated.
   */
  public async getUpdatedTitle (currentTitle: string): Promise<string | null> {
    this._logger.logDebug('* PullRequest.getUpdatedTitle()')

    const sizeIndicator: string = await this._codeMetrics.getSizeIndicator()
    if (currentTitle.startsWith(this._runnerInvoker.loc('pullRequests.pullRequest.titleFormat', sizeIndicator, ''))) {
      return null
    }

    const sizeRegExp: string =
      `(${this._runnerInvoker.loc('metrics.codeMetrics.titleSizeXS')}` +
      `|${this._runnerInvoker.loc('metrics.codeMetrics.titleSizeS')}` +
      `|${this._runnerInvoker.loc('metrics.codeMetrics.titleSizeM')}` +
      `|${this._runnerInvoker.loc('metrics.codeMetrics.titleSizeL')}` +
      `|${this._runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', '\\d*')})`
    const testsRegExp: string =
      `(${this._runnerInvoker.loc('metrics.codeMetrics.titleTestsSufficient')}` +
      `|${this._runnerInvoker.loc('metrics.codeMetrics.titleTestsInsufficient')})?`
    const sizeIndicatorRegExp: string = this._runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', sizeRegExp, testsRegExp)
    const completeRegExp: string = `^${this._runnerInvoker.loc('pullRequests.pullRequest.titleFormat', sizeIndicatorRegExp, '(.*)')}$`

    const prefixRegExp: RegExp = new RegExp(completeRegExp, 'u')
    const prefixRegExpMatches: RegExpMatchArray | null = currentTitle.match(prefixRegExp)
    let originalTitle: string = currentTitle
    if (prefixRegExpMatches?.[3] !== undefined) {
      originalTitle = prefixRegExpMatches[3]
    }

    return this._runnerInvoker.loc('pullRequests.pullRequest.titleFormat', sizeIndicator, originalTitle)
  }
}
