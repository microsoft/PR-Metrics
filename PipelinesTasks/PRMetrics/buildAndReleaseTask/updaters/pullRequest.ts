// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests.
 */
class PullRequest {
  private readonly _taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the `PullRequest` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public isPullRequest (): boolean {
    this._taskLibWrapper.debug('* PullRequest.isPullRequest()')

    return process.env.SYSTEM_PULLREQUEST_PULLREQUESTID !== undefined
  }

  /**
   * Gets the description to which to update the pull request's current description.
   * @param currentDescription The pull request's current description.
   * @returns The value to which to update the description or `null` if the description is not to be updated.
   */
  public getUpdatedDescription (currentDescription: string): string | null {
    this._taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')

    if (currentDescription) {
      return null
    }

    return this._taskLibWrapper.loc('updaters.pullRequest.addDescription')
  }

  /**
   * Gets the description to which to update the pull request's current title.
   * @param currentTitle The pull request's current title.
   * @param sizeIndicator The size indicator with which to prefix the title.
   * @returns The value to which to update the title or `null` if the title is not to be updated.
   */
  public getUpdatedTitle (currentTitle: string, sizeIndicator: string): string | null {
    this._taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')

    if (currentTitle.startsWith(`${sizeIndicator} ◾ `)) {
      return null
    }

    const sizeRegExp: string =
      `(${this._taskLibWrapper.loc('updaters.pullRequest.titleSizeXS')}` +
      `|${this._taskLibWrapper.loc('updaters.pullRequest.titleSizeS')}` +
      `|${this._taskLibWrapper.loc('updaters.pullRequest.titleSizeM')}` +
      `|${this._taskLibWrapper.loc('updaters.pullRequest.titleSizeL')}` +
      `|${this._taskLibWrapper.loc('updaters.pullRequest.titleSizeXL', '\\d*')})`
    const testsRegExp: string =
      `(${this._taskLibWrapper.loc('updaters.pullRequest.titleTestsSufficient')}` +
      `|${this._taskLibWrapper.loc('updaters.pullRequest.titleTestsInsufficient')})?`
    const sizeIndicatorRegExp: string = this._taskLibWrapper.loc('updaters.pullRequest.titleSizeIndicatorFormat', sizeRegExp, testsRegExp)
    const completeRegExp: string = `^${this._taskLibWrapper.loc('updaters.pullRequest.titleFormat', sizeIndicatorRegExp, '(.*)')}$`

    const prefixRegExp: RegExp = new RegExp(completeRegExp, 'u')
    const prefixRegExpMatches: RegExpMatchArray | null = currentTitle.match(prefixRegExp)
    let originalTitle: string = currentTitle
    if (prefixRegExpMatches !== null) {
      originalTitle = prefixRegExpMatches[3]!
    }

    return `${sizeIndicator} ◾ ${originalTitle}`
  }

  /**
   * Gets the current iteration of the pull request.
   * @returns The current iteration of the pull request.
   */
  public getCurrentIteration (): number {
    this._taskLibWrapper.debug('* PullRequest.getCurrentIteration()')

    return 1 // TODO: Update once dependencies are added
  }
}

export default PullRequest
