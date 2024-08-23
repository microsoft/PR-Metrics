/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'isomorphic-fetch'
import * as Converter from '../utilities/converter'
import * as Validator from '../utilities/validator'
import { Octokit, RequestError } from 'octokit'
import BaseReposInvoker from './baseReposInvoker'
import CommentData from './interfaces/commentData'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import CreateIssueCommentResponse from '../wrappers/octokitInterfaces/createIssueCommentResponse'
import CreateReviewCommentResponse from '../wrappers/octokitInterfaces/createReviewCommentResponse'
import DeleteReviewCommentResponse from '../wrappers/octokitInterfaces/deleteReviewCommentResponse'
import FileCommentData from './interfaces/fileCommentData'
import GetIssueCommentsResponse from '../wrappers/octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import GetReviewCommentsResponse from '../wrappers/octokitInterfaces/getReviewCommentsResponse'
import GitInvoker from '../git/gitInvoker'
import ListCommitsResponse from '../wrappers/octokitInterfaces/listCommitsResponse'
import Logger from '../utilities/logger'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import OctokitWrapper from '../wrappers/octokitWrapper'
import PullRequestCommentData from './interfaces/pullRequestCommentData'
import PullRequestDetails from './interfaces/pullRequestDetails'
import RunnerInvoker from '../runners/runnerInvoker'
import { StatusCodes } from 'http-status-codes'
import UpdateIssueCommentResponse from '../wrappers/octokitInterfaces/updateIssueCommentResponse'
import UpdatePullResponse from '../wrappers/octokitInterfaces/updatePullResponse'
import { decimalRadix } from '../utilities/constants'
import { singleton } from 'tsyringe'

const octokit: Octokit = new Octokit()
type GetIssueCommentsResponseData = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.issues.listComments>[0]
type GetReviewCommentsResponseData = GetResponseDataTypeFromEndpointMethod<typeof octokit.rest.pulls.listReviewComments>[0]

/**
 * A class for invoking GitHub Repos functionality.
 */
@singleton()
export default class GitHubReposInvoker extends BaseReposInvoker {
  private readonly _gitInvoker: GitInvoker
  private readonly _logger: Logger
  private readonly _octokitWrapper: OctokitWrapper
  private readonly _runnerInvoker: RunnerInvoker

  private _isInitialized = false
  private _owner = ''
  private _repo = ''
  private _pullRequestId = 0
  private _commitId = ''

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param octokitWrapper The wrapper around the Octokit library.
   * @param runnerInvoker The runner invoker functionality.
   */
  public constructor (gitInvoker: GitInvoker, logger: Logger, octokitWrapper: OctokitWrapper, runnerInvoker: RunnerInvoker) {
    super()

    this._gitInvoker = gitInvoker
    this._logger = logger
    this._octokitWrapper = octokitWrapper
    this._runnerInvoker = runnerInvoker
  }

  public async isAccessTokenAvailable (): Promise<string | null> {
    this._logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable()')

    if (process.env.PR_METRICS_ACCESS_TOKEN === undefined) {
      return Promise.resolve(this._runnerInvoker.loc('repos.gitHubReposInvoker.noGitHubAccessToken'))
    }

    return Promise.resolve(null)
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this._logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')

    this.initialize()
    const result: GetPullResponse = await this.invokeApiCall(async (): Promise<GetPullResponse> => {
      const internalResult: GetPullResponse = await this._octokitWrapper.getPull(this._owner, this._repo, this._pullRequestId)
      this._logger.logDebug(JSON.stringify(internalResult))

      return internalResult
    })

    return {
      title: result.data.title,
      description: result.data.body ?? undefined
    }
  }

  public async getComments (): Promise<CommentData> {
    this._logger.logDebug('* GitHubReposInvoker.getComments()')

    this.initialize()

    let pullRequestComments: GetIssueCommentsResponse | undefined
    let fileComments: GetReviewCommentsResponse | undefined
    await Promise.all([
      this.invokeApiCall(async (): Promise<void> => {
        pullRequestComments = await this._octokitWrapper.getIssueComments(this._owner, this._repo, this._pullRequestId)
        this._logger.logDebug(JSON.stringify(pullRequestComments))
      }),
      this.invokeApiCall(async (): Promise<void> => {
        fileComments = await this._octokitWrapper.getReviewComments(this._owner, this._repo, this._pullRequestId)
        this._logger.logDebug(JSON.stringify(fileComments))
      })
    ])

    return this.convertPullRequestComments(pullRequestComments, fileComments)
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')

    if (title === null && description === null) {
      return
    }

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdatePullResponse = await this._octokitWrapper.updatePull(this._owner, this._repo, this._pullRequestId, title ?? undefined, description ?? undefined)
      this._logger.logDebug(JSON.stringify(result))
    })
  }

  public async createComment (content: string, _: CommentThreadStatus, fileName?: string, __?: boolean): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.createComment()')

    this.initialize()

    if (fileName !== undefined) {
      if (this._commitId === '') {
        await this.getCommitId()
      }

      await this.invokeApiCall(async (): Promise<void> => {
        try {
          const result: CreateReviewCommentResponse | null = await this._octokitWrapper.createReviewComment(this._owner, this._repo, this._pullRequestId, content, fileName, this._commitId)
          this._logger.logDebug(JSON.stringify(result))
        } catch (error: unknown) {
          if (error instanceof RequestError && error.status as StatusCodes === StatusCodes.UNPROCESSABLE_ENTITY && error.message.includes('pull_request_review_thread.path diff too large')) {
            this._logger.logInfo('GitHub createReviewComment() threw a 422 error related to a large diff. Ignoring as this is expected.')
            this._logger.logErrorObject(error)
          } else {
            throw error
          }
        }
      })
    } else {
      await this.invokeApiCall(async (): Promise<void> => {
        const result: CreateIssueCommentResponse = await this._octokitWrapper.createIssueComment(this._owner, this._repo, this._pullRequestId, content)
        this._logger.logDebug(JSON.stringify(result))
      })
    }
  }

  public async updateComment (commentThreadId: number, content: string | null, _: CommentThreadStatus | null): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.updateComment()')

    if (content === null) {
      return
    }

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdateIssueCommentResponse = await this._octokitWrapper.updateIssueComment(this._owner, this._repo, this._pullRequestId, commentThreadId, content)
      this._logger.logDebug(JSON.stringify(result))
    })
  }

  public async deleteCommentThread (commentThreadId: number): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.deleteCommentThread()')

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: DeleteReviewCommentResponse = await this._octokitWrapper.deleteReviewComment(this._owner, this._repo, commentThreadId)
      this._logger.logDebug(JSON.stringify(result))
    })
  }

  private initialize (): void {
    this._logger.logDebug('* GitHubReposInvoker.initialize()')

    if (this._isInitialized) {
      return
    }

    const options: OctokitOptions = {
      auth: process.env.PR_METRICS_ACCESS_TOKEN,
      userAgent: 'PRMetrics/v1.6.1',
      log: {
        debug: (message: string): void => this._logger.logDebug(`Octokit – ${message}`),
        info: (message: string): void => this._logger.logInfo(`Octokit – ${message}`),
        warn: (message: string): void => this._logger.logWarning(`Octokit – ${message}`),
        error: (message: string): void => this._logger.logError(`Octokit – ${message}`)
      }
    }

    if (RunnerInvoker.isGitHub) {
      options.baseUrl = this.initializeForGitHub()
    } else {
      options.baseUrl = this.initializeForAzureDevOps()
    }

    this._logger.logDebug(`Using Base URL '${Converter.toString(options.baseUrl)}'.`)
    this._octokitWrapper.initialize(options)
    this._pullRequestId = this._gitInvoker.pullRequestId
    this._isInitialized = true
  }

  private initializeForGitHub (): string {
    this._logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')

    const baseUrl: string = Validator.validateVariable('GITHUB_API_URL', 'GitHubReposInvoker.initializeForGitHub()')
    this._owner = Validator.validateVariable('GITHUB_REPOSITORY_OWNER', 'GitHubReposInvoker.initializeForGitHub()')

    const gitHubRepository: string = Validator.validateVariable('GITHUB_REPOSITORY', 'GitHubReposInvoker.initializeForGitHub()')
    const gitHubRepositoryElements: string[] = gitHubRepository.split('/')
    if (gitHubRepositoryElements[1] === undefined) {
      throw new Error(`GITHUB_REPOSITORY '${gitHubRepository}' is in an unexpected format.`)
    }

    this._repo = gitHubRepositoryElements[1]
    return baseUrl
  }

  private initializeForAzureDevOps (): string | undefined {
    this._logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')

    const sourceRepositoryUri: string = Validator.validateVariable('SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', 'GitHubReposInvoker.initializeForAzureDevOps()')
    const sourceRepositoryUriElements: string[] = sourceRepositoryUri.split('/')
    if (sourceRepositoryUriElements[2] === undefined || sourceRepositoryUriElements[3] === undefined || sourceRepositoryUriElements[4] === undefined) {
      throw new Error(`SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${sourceRepositoryUri}' is in an unexpected format.`)
    }

    // Handle GitHub Enterprise invocations.
    let baseUrl: string | undefined
    if (sourceRepositoryUriElements[2] !== 'github.com') {
      baseUrl = `https://${sourceRepositoryUriElements[2]}/api/v3`
    }

    this._owner = sourceRepositoryUriElements[3]
    this._repo = sourceRepositoryUriElements[4]
    const gitEnding = '.git'
    if (this._repo.endsWith(gitEnding)) {
      this._repo = this._repo.substring(0, this._repo.length - gitEnding.length)
    }

    return baseUrl
  }

  private convertPullRequestComments (pullRequestComments?: GetIssueCommentsResponse, fileComments?: GetReviewCommentsResponse): CommentData {
    this._logger.logDebug('* GitHubReposInvoker.convertPullRequestComments()')

    const result: CommentData = new CommentData()

    pullRequestComments?.data.forEach((value: GetIssueCommentsResponseData): void => {
      const id: number = value.id
      const content: string | undefined = value.body
      if (content === undefined) {
        return
      }

      result.pullRequestComments.push(new PullRequestCommentData(id, content))
    })

    fileComments?.data.forEach((value: GetReviewCommentsResponseData): void => {
      const id: number = value.id
      const content: string = value.body
      const file: string = value.path
      result.fileComments.push(new FileCommentData(id, content, file))
    })

    return result
  }

  private async getCommitId (): Promise<void> {
    this._logger.logDebug('* GitHubReposInvoker.getCommitId()')

    let result: ListCommitsResponse = await this.invokeApiCall(async (): Promise<ListCommitsResponse> => {
      const internalResult: ListCommitsResponse = await this._octokitWrapper.listCommits(this._owner, this._repo, this._pullRequestId, 1)
      this._logger.logDebug(JSON.stringify(internalResult))
      return internalResult
    })

    // Get the last page of commits so that the last commit can be located.
    if (result.headers.link !== undefined) {
      const commitsLink: string = result.headers.link
      const matches: RegExpMatchArray | null = /<.+>; rel="next", <.+?page=(\d+)>; rel="last"/u.exec(commitsLink)
      if (matches?.[1] === undefined) {
        throw new Error(`The regular expression did not match '${commitsLink}'.`)
      }

      const match: number = parseInt(matches[1], decimalRadix)
      result = await this.invokeApiCall(async (): Promise<ListCommitsResponse> => {
        const internalResult: ListCommitsResponse = await this._octokitWrapper.listCommits(this._owner, this._repo, this._pullRequestId, match)
        this._logger.logDebug(JSON.stringify(internalResult))
        return internalResult
      })
    }

    this._commitId = Validator.validateString(result.data[result.data.length - 1]?.sha, `result.data[${result.data.length - 1}].sha`, 'GitHubReposInvoker.getCommitId()')
  }

  protected async invokeApiCall<Response> (action: () => Promise<Response>): Promise<Response> {
    return super.invokeApiCall(action, this._runnerInvoker.loc('repos.gitHubReposInvoker.insufficientGitHubAccessTokenPermissions'))
  }
}
