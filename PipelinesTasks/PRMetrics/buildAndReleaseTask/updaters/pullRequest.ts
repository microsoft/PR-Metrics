// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for managing pull requests
 */
class PullRequest {
  private taskLibWrapper: TaskLibWrapper;

  /**
   * Initializes a new instance of the PullRequest class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this.taskLibWrapper = taskLibWrapper
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public isPullRequest (): boolean {
    this.taskLibWrapper.debug('* PullRequest.isPullRequest()')

    return process.env.SYSTEM_PULLREQUEST_PULLREQUESTID !== undefined
  }

  /**
   * Gets the description to which to update the pull request's current description.
   * @param currentDescription The pull request's current description.
   * @returns The value to which to update the description or `null` if the description is not to be updated.
   */
  public getUpdatedDescription (currentDescription: string): string | null {
    this.taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')

    if (currentDescription) {
      return null
    }

    return '❌ **Add a description.**'
  }

  /**
   * Gets the description to which to update the pull request's current title.
   * @param currentTitle The pull request's current title.
   * @param sizeIndicator The size indicator with which to prefix the title.
   * @returns The value to which to update the title or `null` if the title is not to be updated.
   */
  public getUpdatedTitle (currentTitle: string, sizeIndicator: string): string | null {
    this.taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')

    if (currentTitle.startsWith(`${sizeIndicator} ◾ `)) {
      return null
    }

    const prefixRegExp: RegExp = /^(XS|S|M|L|XL|\d+XL)(✔|⚠️)\s◾\s/u
    const originalTitle: string = currentTitle.replace(prefixRegExp, '')
    return `${sizeIndicator} ◾ ${originalTitle}`
  }
}

export default PullRequest
