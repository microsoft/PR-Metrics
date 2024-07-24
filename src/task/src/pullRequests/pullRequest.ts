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
  private readonly codeMetrics: CodeMetrics
  private readonly logger: Logger
  private readonly runnerInvoker: RunnerInvoker

  /**
   * Initializes a new instance of the `PullRequest` class.
   * @param codeMetrics The code metrics calculation logic.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(codeMetrics: CodeMetrics, logger: Logger, runnerInvoker: RunnerInvoker) {
    this.codeMetrics = codeMetrics
    this.logger = logger
    this.runnerInvoker = runnerInvoker
  }

  /**
   * Determines whether the task is running against a pull request.
   * @returns A value indicating whether the task is running against a pull request.
   */
  public get isPullRequest(): boolean {
    this.logger.logDebug('* PullRequest.isPullRequest')

    return RunnerInvoker.isGitHub ? process.env.GITHUB_BASE_REF !== '' : process.env.SYSTEM_PULLREQUEST_PULLREQUESTID !== undefined
  }

  /**
   * Determines whether the task is running against a supported pull request provider.
   * @returns `true` if the task is running against a supported pull request provider, or the name of the pull request provider otherwise.
   */
  public get isSupportedProvider(): boolean | string {
    this.logger.logDebug('* PullRequest.isSupportedProvider')

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
  public getUpdatedDescription(currentDescription: string | undefined): string | null {
    this.logger.logDebug('* PullRequest.getUpdatedDescription()')

    if (currentDescription !== undefined && currentDescription.trim() !== '') {
      return null
    }

    return this.runnerInvoker.loc('pullRequests.pullRequest.addDescription')
  }

  /**
   * Gets the description to which to update the pull request's current title.
   * @param currentTitle The pull request's current title.
   * @returns A promise containing value to which to update the title or `null` if the title is not to be updated.
   */
  public async getUpdatedTitle(currentTitle: string): Promise<string | null> {
    this.logger.logDebug('* PullRequest.getUpdatedTitle()')

    const sizeIndicator: string = await this.codeMetrics.getSizeIndicator()
    if (currentTitle.startsWith(this.runnerInvoker.loc('pullRequests.pullRequest.titleFormat', sizeIndicator, ''))) {
      return null
    }

    const sizeRegExp: string =
      `(?:${this.runnerInvoker.loc('metrics.codeMetrics.titleSizeXS')}` +
      `|${this.runnerInvoker.loc('metrics.codeMetrics.titleSizeS')}` +
      `|${this.runnerInvoker.loc('metrics.codeMetrics.titleSizeM')}` +
      `|${this.runnerInvoker.loc('metrics.codeMetrics.titleSizeL')}` +
      `|${this.runnerInvoker.loc('metrics.codeMetrics.titleSizeXL', '\\d*')})`
    const testsRegExp: string =
      `(?:${this.runnerInvoker.loc('metrics.codeMetrics.titleTestsSufficient')}` +
      `|${this.runnerInvoker.loc('metrics.codeMetrics.titleTestsInsufficient')})?`
    const sizeIndicatorRegExp: string = this.runnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', sizeRegExp, testsRegExp)
    const completeRegExp = `^${this.runnerInvoker.loc('pullRequests.pullRequest.titleFormat', sizeIndicatorRegExp, '(?<originalTitle>.*)')}$`

    const prefixRegExp = new RegExp(completeRegExp, 'u')
    const prefixRegExpMatches: RegExpMatchArray | null = currentTitle.match(prefixRegExp)
    let { originalTitle } = prefixRegExpMatches?.groups ?? {}
    if (originalTitle === undefined) {
      originalTitle = currentTitle
    }

    return this.runnerInvoker.loc('pullRequests.pullRequest.titleFormat', sizeIndicator, originalTitle)
  }
}
