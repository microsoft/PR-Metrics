// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { injectable } from 'tsyringe'
import CodeMetrics from '../metrics/codeMetrics'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests.
 */
@injectable()
export default class PullRequest {
  private readonly _codeMetrics: CodeMetrics
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `PullRequest` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (codeMetrics: CodeMetrics, taskLibWrapper: TaskLibWrapper) {
    this._codeMetrics = codeMetrics
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public get isPullRequest (): boolean {
    this._taskLibWrapper.debug('* PullRequest.isPullRequest')

    return process.env.SYSTEM_PULLREQUEST_PULLREQUESTID !== undefined
  }

  /**
   * Gets the description to which to update the pull request's current description.
   * @param currentDescription The pull request's current description.
   * @returns The value to which to update the description or `null` if the description is not to be updated.
   */
  public getUpdatedDescription (currentDescription: string | undefined): string | null {
    this._taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')

    if (currentDescription?.trim()) {
      return null
    }

    return this._taskLibWrapper.loc('pullRequests.pullRequest.addDescription')
  }

  /**
   * Gets the description to which to update the pull request's current title.
   * @param currentTitle The pull request's current title.
   * @returns The value to which to update the title or `null` if the title is not to be updated.
   */
  public getUpdatedTitle (currentTitle: string): string | null {
    this._taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')

    const sizeIndicator: string = this._codeMetrics.sizeIndicator
    if (currentTitle.startsWith(`${sizeIndicator} ◾ `)) {
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

    return `${sizeIndicator} ◾ ${originalTitle}`
  }
}
