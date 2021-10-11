// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from 'octokit'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import BaseReposInvoker from './baseReposInvoker'
import CreateIssueCommentResponse from '../wrappers/octokitInterfaces/createIssueCommentResponse'
import CreateReviewCommentResponse from '../wrappers/octokitInterfaces/createReviewCommentResponse'
import DeleteReviewCommentResponse from '../wrappers/octokitInterfaces/deleteReviewCommentResponse'
import FileComment from './interfaces/fileComment'
import GetIssueCommentsResponse from '../wrappers/octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from '../wrappers/octokitInterfaces/getReviewCommentsResponse'
import ListCommitsResponse from '../wrappers/octokitInterfaces/listCommitsResponse'
import Logger from '../utilities/logger'
import OctokitWrapper from '../wrappers/octokitWrapper'
import PullRequestComment from './interfaces/pullRequestComment'
import PullRequestCommentGrouping from './interfaces/pullRequestCommentGrouping'
import PullRequestDetails from './interfaces/pullRequestDetails'
import TaskLibWrapper from '../wrappers/taskLibWrapper'
import UpdateIssueCommentResponse from '../wrappers/octokitInterfaces/updateIssueCommentResponse'
import UpdatePullResponse from '../wrappers/octokitInterfaces/updatePullResponse'

const octokit: Octokit = new Octokit()
type GetIssueCommentsResponseData = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.issues.listComments>[0]
type GetReviewCommentsResponseData = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.pulls.listCommentsForReview>[0]

/**
 * A class for invoking GitHub Repos functionality.
 */
@singleton()
export default class GitHubReposInvoker extends BaseReposInvoker {
  private readonly _logger: Logger
  private readonly _octokitWrapper: OctokitWrapper
  private readonly _taskLibWrapper: TaskLibWrapper

  private _isInitialized: boolean = false
  private _owner: string | undefined
  private _repo: string | undefined
  private _pullRequestId: number | undefined
  private _commitId: string | undefined

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param logger The logger.
   * @param octokitWrapper The wrapper around the Octokit library.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (logger: Logger, octokitWrapper: OctokitWrapper, taskLibWrapper: TaskLibWrapper) {
    super()

    this._logger = logger
    this._octokitWrapper = octokitWrapper
    this._taskLibWrapper = taskLibWrapper
  }

  public get isAccessTokenAvailable (): string | null {
    this._logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')

    if (process.env.SYSTEM_ACCESSTOKEN === undefined) {
      return this._taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitHubAccessToken')
    }

    return null
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')

    this.initialize()
    const result: GetPullResponse = await this.invokeApiCall(async (): Promise<GetPullResponse> => {
      const result: GetPullResponse = await this._octokitWrapper.getPull(this._owner!, this._repo!, this._pullRequestId!)
      this._logger.logDebug(JSON.stringify(result))

      return result
    })

    return {
      title: result.data.title,
      description: result.data.body ?? undefined
    }
  }

  public async getComments (): Promise<PullRequestCommentGrouping> {
    this._logger.logDebug('* GitHubReposInvoker.getComments()')

    this.initialize()

    let pullRequestComments: GetIssueCommentsResponse | undefined
    let fileComments: GetReviewCommentsResponse | undefined
    await Promise.all([
      this.invokeApiCall(async (): Promise<void> => {
        pullRequestComments = await this._octokitWrapper.getIssueComments(this._owner!, this._repo!, this._pullRequestId!)
        this._logger.logDebug(JSON.stringify(pullRequestComments))
      }),
      this.invokeApiCall(async (): Promise<void> => {
        fileComments = await this._octokitWrapper.getReviewComments(this._owner!, this._repo!, this._pullRequestId!)
        this._logger.logDebug(JSON.stringify(fileComments))
      })
    ])

    return GitHubReposInvoker.convertPullRequestComments(pullRequestComments, fileComments)
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')

    if (title === null && description === null) {
      return
    }

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdatePullResponse = await this._octokitWrapper.updatePull(this._owner!, this._repo!, this._pullRequestId!, title === null ? undefined : title, description === null ? undefined : description)
      this._logger.logDebug(JSON.stringify(result))
    })
  }

  public async createComment (content: string, _: CommentThreadStatus, fileName?: string, __?: boolean): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.createComment()')

    this.initialize()

    if (fileName) {
      if (!this._commitId) {
        await this.invokeApiCall(async (): Promise<void> => {
          const result: ListCommitsResponse = await this._octokitWrapper.listCommits(this._owner!, this._repo!, this._pullRequestId!)
          this._logger.logDebug(JSON.stringify(result))
          this._commitId = Validator.validate(result.data[0]?.sha, 'result.data[0].sha', 'GitHubReposInvoker.createComment()')
        })
      }

      await this.invokeApiCall(async (): Promise<void> => {
        const result: CreateReviewCommentResponse = await this._octokitWrapper.createReviewComment(this._owner!, this._repo!, this._pullRequestId!, content, fileName, this._commitId!)
        this._logger.logDebug(JSON.stringify(result))
      })
    } else {
      await this.invokeApiCall(async (): Promise<void> => {
        const result: CreateIssueCommentResponse = await this._octokitWrapper.createIssueComment(this._owner!, this._repo!, this._pullRequestId!, content)
        this._logger.logDebug(JSON.stringify(result))
      })
    }
  }

  public async updateComment (content: string | null, _: CommentThreadStatus | null, commentThreadId: number): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.updateComment()')

    if (content === null) {
      return
    }

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdateIssueCommentResponse = await this._octokitWrapper.updateIssueComment(this._owner!, this._repo!, this._pullRequestId!, commentThreadId, content)
      this._logger.logDebug(JSON.stringify(result))
    })
  }

  public async deleteCommentThread (commentThreadId: number): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.deleteCommentThread()')

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: DeleteReviewCommentResponse = await this._octokitWrapper.deleteReviewComment(this._owner!, this._repo!, commentThreadId)
      this._logger.logDebug(JSON.stringify(result))
    })
  }

  private initialize (): void {
    this._logger.logDebug('* GitHubReposInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    const options: OctokitOptions = {
      auth: process.env.SYSTEM_ACCESSTOKEN,
      userAgent: 'PRMetrics/v1.3.0',
      log: {
        debug: (message: string): void => this._logger.logDebug(`Octokit – ${message}`),
        info: (message: string): void => this._logger.logInfo(`Octokit – ${message}`),
        warn: (message: string): void => this._logger.logWarning(`Octokit – ${message}`),
        error: (message: string): void => this._logger.logError(`Octokit – ${message}`)
      }
    }

    const sourceRepositoryUri: string = Validator.validateVariable('SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', 'GitHubReposInvoker.initialize()')
    const sourceRepositoryUriElements: string[] = sourceRepositoryUri.split('/')
    if (sourceRepositoryUriElements.length !== 5) {
      throw Error(`SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${sourceRepositoryUri}' is in an unexpected format.`)
    }

    // Handle GitHub Enterprise and GitHub AE invocations.
    if (sourceRepositoryUriElements[2] !== 'github.com') {
      options.baseUrl = `https://${sourceRepositoryUriElements[2]}/api/v3`
      this._logger.logDebug(`Using Base URL '${options.baseUrl}'.`)
    }

    this._octokitWrapper.initialize(options)

    this._owner = sourceRepositoryUriElements[3]

    this._repo = sourceRepositoryUriElements[4]
    const gitEnding: string = '.git'
    if (this._repo!.endsWith(gitEnding)) {
      this._repo = this._repo!.substring(0, this._repo!.length - gitEnding.length)
    }

    this._pullRequestId = Validator.validate(parseInt(process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER!), 'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER', 'GitHubReposInvoker.initialize()')

    this._isInitialized = true
  }

  private static convertPullRequestComments (pullRequestComments: GetIssueCommentsResponse | undefined, fileComments: GetReviewCommentsResponse | undefined): PullRequestCommentGrouping {
    const result: PullRequestCommentGrouping = new PullRequestCommentGrouping()

    pullRequestComments?.data.forEach((value: GetIssueCommentsResponseData, index: number): void => {
      const commentResult: PullRequestComment = new PullRequestComment()

      commentResult.id = value.id
      commentResult.content = Validator.validate(value.body, `pullRequestComments[${index}].body`, 'GitHubReposInvoker.convertPullRequestComments()')

      result.pullRequestComments.push(commentResult)
    })

    fileComments?.data.forEach((value: GetReviewCommentsResponseData): void => {
      const commentResult: FileComment = new FileComment()

      commentResult.id = value.id
      commentResult.file = value.path
      commentResult.content = value.body

      result.fileComments.push(commentResult)
    })

    return result
  }

  protected async invokeApiCall<TResponse> (action: () => Promise<TResponse>): Promise<TResponse> {
    return super.invokeApiCall(action, this._taskLibWrapper.loc('metrics.codeMetricsCalculator.insufficientGitHubAccessTokenPermissions'))
  }
}
