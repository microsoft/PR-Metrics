// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { injectable } from 'tsyringe'
import { Validator } from '../utilities/validator'
import CodeMetrics from '../metrics/codeMetrics'
import Logger from '../utilities/logger'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests.
 */
@injectable()
export default class PullRequest {
  private readonly _codeMetrics: CodeMetrics
  private readonly _logger: Logger
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `PullRequest` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param logger The logger.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (codeMetrics: CodeMetrics, logger: Logger, taskLibWrapper: TaskLibWrapper) {
    this._codeMetrics = codeMetrics
    this._logger = logger
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public get isPullRequest (): boolean {
    this._logger.logDebug('* PullRequest.isPullRequest')

    return process.env.SYSTEM_PULLREQUEST_PULLREQUESTID !== undefined
  }

  /**
   * Determines whether the task is running against a supported pull request provider.
   * @returns `true` if the task is running against a supported pull request provider, or the name of the pull request provider otherwise.
   */
  public get isSupportedProvider (): boolean | string {
    this._logger.logDebug('* PullRequest.isSupportedProvider')

    const variable: string = Validator.validate(process.env.BUILD_REPOSITORY_PROVIDER, 'BUILD_REPOSITORY_PROVIDER', 'PullRequest.isSupportedProvider')
    if (variable === 'TfsGit' || variable === 'GitHub') {
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

    if (currentDescription?.trim()) {
      return null
    }

    return this._taskLibWrapper.loc('pullRequests.pullRequest.addDescription')
  }

  /**
   * Gets the description to which to update the pull request's current title.
   * @param currentTitle The pull request's current title.
   * @returns A promise containing value to which to update the title or `null` if the title is not to be updated.
   */
  public async getUpdatedTitle (currentTitle: string): Promise<string | null> {
    this._logger.logDebug('* PullRequest.getUpdatedTitle()')

    const sizeIndicator: string = await this._codeMetrics.getSizeIndicator()
    if (currentTitle.startsWith(this._taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', sizeIndicator, ''))) {
      return null
    }

    const sizeRegExp: string =
      `(${this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeXS')}` +
      `|${this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeS')}` +
      `|${this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeM')}` +
      `|${this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeL')}` +
      `|${this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', '\\d*')})`
    const testsRegExp: string =
      `(${this._taskLibWrapper.loc('metrics.codeMetrics.titleTestsSufficient')}` +
      `|${this._taskLibWrapper.loc('metrics.codeMetrics.titleTestsInsufficient')})?`
    const sizeIndicatorRegExp: string = this._taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', sizeRegExp, testsRegExp)
    const completeRegExp: string = `^${this._taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', sizeIndicatorRegExp, '(.*)')}$`

    const prefixRegExp: RegExp = new RegExp(completeRegExp, 'u')
    const prefixRegExpMatches: RegExpMatchArray | null = currentTitle.match(prefixRegExp)
    let originalTitle: string = currentTitle
    if (prefixRegExpMatches !== null) {
      originalTitle = prefixRegExpMatches[3]!
    }

    return this._taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', sizeIndicator, originalTitle)
  }
}
