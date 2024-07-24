/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'isomorphic-fetch'
import * as Converter from '../utilities/converter'
import * as Validator from '../utilities/validator'
import BaseReposInvoker from './baseReposInvoker'
import CommentData from './interfaces/commentData'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import CreateIssueCommentResponse from '../wrappers/octokitInterfaces/createIssueCommentResponse'
import CreateReviewCommentResponse from '../wrappers/octokitInterfaces/createReviewCommentResponse'
import { DecimalRadix } from '../utilities/constants'
import DeleteReviewCommentResponse from '../wrappers/octokitInterfaces/deleteReviewCommentResponse'
import FileCommentData from './interfaces/fileCommentData'
import GetIssueCommentsResponse from '../wrappers/octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from '../wrappers/octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from '../wrappers/octokitInterfaces/getReviewCommentsResponse'
import GitInvoker from '../git/gitInvoker'
import ListCommitsResponse from '../wrappers/octokitInterfaces/listCommitsResponse'
import Logger from '../utilities/logger'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import OctokitWrapper from '../wrappers/octokitWrapper'
import PullRequestCommentData from './interfaces/pullRequestCommentData'
import PullRequestDetails from './interfaces/pullRequestDetails'
import { RequestError } from 'octokit'
import RunnerInvoker from '../runners/runnerInvoker'
import UpdateIssueCommentResponse from '../wrappers/octokitInterfaces/updateIssueCommentResponse'
import UpdatePullResponse from '../wrappers/octokitInterfaces/updatePullResponse'
import { singleton } from 'tsyringe'

/**
 * A class for invoking GitHub Repos functionality.
 */
@singleton()
export default class GitHubReposInvoker extends BaseReposInvoker {
  private readonly gitInvoker: GitInvoker
  private readonly logger: Logger
  private readonly octokitWrapper: OctokitWrapper
  private readonly runnerInvoker: RunnerInvoker

  private isInitialized = false
  private owner = ''
  private repo = ''
  private pullRequestId = 0
  private commitId = ''

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param octokitWrapper The wrapper around the Octokit library.
   * @param runnerInvoker The runner invoker functionality.
   */
  public constructor (gitInvoker: GitInvoker, logger: Logger, octokitWrapper: OctokitWrapper, runnerInvoker: RunnerInvoker) {
    super()

    this.gitInvoker = gitInvoker
    this.logger = logger
    this.octokitWrapper = octokitWrapper
    this.runnerInvoker = runnerInvoker
  }

  public isAccessTokenAvailable (): Promise<string | null> {
    this.logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable()')

    if (process.env.PR_METRICS_ACCESS_TOKEN === undefined) {
      return Promise.resolve(this.runnerInvoker.loc('repos.gitHubReposInvoker.noGitHubAccessToken'))
    }

    return Promise.resolve(null)
  }

  public async getTitleAndDescription (): Promise<PullRequestDetails> {
    this.logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')

    this.initialize()
    const result: GetPullResponse = await this.invokeApiCall(async (): Promise<GetPullResponse> => {
      const internalResult: GetPullResponse = await this.octokitWrapper.getPull(this.owner, this.repo, this.pullRequestId)
      this.logger.logDebug(JSON.stringify(internalResult))

      return internalResult
    })

    return {
      description: result.data.body ?? undefined,
      title: result.data.title,
    }
  }

  public async getComments (): Promise<CommentData> {
    this.logger.logDebug('* GitHubReposInvoker.getComments()')

    this.initialize()

    let pullRequestComments: GetIssueCommentsResponse | undefined
    let fileComments: GetReviewCommentsResponse | undefined
    await Promise.all([
      this.invokeApiCall(async (): Promise<void> => {
        pullRequestComments = await this.octokitWrapper.getIssueComments(this.owner, this.repo, this.pullRequestId)
        this.logger.logDebug(JSON.stringify(pullRequestComments))
      }),
      this.invokeApiCall(async (): Promise<void> => {
        fileComments = await this.octokitWrapper.getReviewComments(this.owner, this.repo, this.pullRequestId)
        this.logger.logDebug(JSON.stringify(fileComments))
      }),
    ])

    return this.convertPullRequestComments(pullRequestComments, fileComments)
  }

  public async setTitleAndDescription (title: string | null, description: string | null): Promise<void> {
    this.logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')

    if (title === null && description === null) {
      return
    }

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdatePullResponse = await this.octokitWrapper.updatePull(this.owner, this.repo, this.pullRequestId, title ?? undefined, description ?? undefined)
      this.logger.logDebug(JSON.stringify(result))
    })
  }

  public async createComment (content: string, _status: CommentThreadStatus, fileName?: string, _isFileDeleted?: boolean): Promise<void> {
    this.logger.logDebug('* GitHubReposInvoker.createComment()')

    this.initialize()

    if (fileName === undefined) {
      await this.invokeApiCall(async (): Promise<void> => {
        const result: CreateIssueCommentResponse = await this.octokitWrapper.createIssueComment(this.owner, this.repo, this.pullRequestId, content)
        this.logger.logDebug(JSON.stringify(result))
      })
    } else {
      if (this.commitId === '') {
        await this.getCommitId()
      }

      await this.invokeApiCall(async (): Promise<void> => {
        try {
          const result: CreateReviewCommentResponse | null = await this.octokitWrapper.createReviewComment(this.owner, this.repo, this.pullRequestId, content, fileName, this.commitId)
          this.logger.logDebug(JSON.stringify(result))
        } catch (error: unknown) {
          if (error instanceof RequestError && error.status === 422 && error.message.includes('pull_request_review_thread.path diff too large')) {
            this.logger.logInfo('GitHub createReviewComment() threw a 422 error related to a large diff. Ignoring as this is expected.')
            this.logger.logErrorObject(error)
          } else {
            throw error
          }
        }
      })
    }
  }

  public async updateComment (commentThreadId: number, content: string | null, _status: CommentThreadStatus | null): Promise<void> {
    this.logger.logDebug('* GitHubReposInvoker.updateComment()')

    if (content === null) {
      return
    }

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdateIssueCommentResponse = await this.octokitWrapper.updateIssueComment(this.owner, this.repo, this.pullRequestId, commentThreadId, content)
      this.logger.logDebug(JSON.stringify(result))
    })
  }

  public async deleteCommentThread (commentThreadId: number): Promise<void> {
    this.logger.logDebug('* GitHubReposInvoker.deleteCommentThread()')

    this.initialize()

    await this.invokeApiCall(async (): Promise<void> => {
      const result: DeleteReviewCommentResponse = await this.octokitWrapper.deleteReviewComment(this.owner, this.repo, commentThreadId)
      this.logger.logDebug(JSON.stringify(result))
    })
  }

  private initialize (): void {
    this.logger.logDebug('* GitHubReposInvoker.initialize()')

    if (this.isInitialized) {
      return
    }

    const options: OctokitOptions = {
      auth: process.env.PR_METRICS_ACCESS_TOKEN,
      log: {
        debug: (message: string): void => { this.logger.logDebug(`Octokit – ${message}`) },
        error: (message: string): void => { this.logger.logError(`Octokit – ${message}`) },
        info: (message: string): void => { this.logger.logInfo(`Octokit – ${message}`) },
        warn: (message: string): void => { this.logger.logWarning(`Octokit – ${message}`) },
      },
      userAgent: 'PRMetrics/v1.6.0',
    }

    if (RunnerInvoker.isGitHub) {
      options.baseUrl = this.initializeForGitHub()
    } else {
      options.baseUrl = this.initializeForAzureDevOps()
    }

    this.logger.logDebug(`Using Base URL '${Converter.toString(options.baseUrl)}'.`)
    this.octokitWrapper.initialize(options)
    this.pullRequestId = this.gitInvoker.pullRequestId
    this.isInitialized = true
  }

  private initializeForGitHub (): string {
    this.logger.logDebug('* GitHubReposInvoker.initializeForGitHub()')

    const baseUrl: string = Validator.validateVariable('GITHUB_API_URL', 'GitHubReposInvoker.initializeForGitHub()')
    this.owner = Validator.validateVariable('GITHUB_REPOSITORY_OWNER', 'GitHubReposInvoker.initializeForGitHub()')

    const gitHubRepository: string = Validator.validateVariable('GITHUB_REPOSITORY', 'GitHubReposInvoker.initializeForGitHub()')
    const gitHubRepositoryElements: string[] = gitHubRepository.split('/')
    if (gitHubRepositoryElements[1] === undefined) {
      throw new Error(`GITHUB_REPOSITORY '${gitHubRepository}' is in an unexpected format.`)
    }

    [, this.repo] = gitHubRepositoryElements
    return baseUrl
  }

  private initializeForAzureDevOps (): string | undefined {
    this.logger.logDebug('* GitHubReposInvoker.initializeForAzureDevOps()')

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

    [, , , this.owner, this.repo] = sourceRepositoryUriElements
    const gitEnding = '.git'
    if (this.repo.endsWith(gitEnding)) {
      this.repo = this.repo.substring(0, this.repo.length - gitEnding.length)
    }

    return baseUrl
  }

  private convertPullRequestComments (pullRequestComments?: GetIssueCommentsResponse, fileComments?: GetReviewCommentsResponse): CommentData {
    this.logger.logDebug('* GitHubReposInvoker.convertPullRequestComments()')

    const result: CommentData = new CommentData()

    if (pullRequestComments) {
      for (const value of pullRequestComments.data) {
        const id: number = value.id
        const content: string | undefined = value.body
        if (content === undefined) {
          break
        }

        result.pullRequestComments.push(new PullRequestCommentData(id, content))
      }
    }

    if (fileComments) {
      for (const value of fileComments.data) {
        const id: number = value.id
        const content: string = value.body
        const file: string = value.path
        result.fileComments.push(new FileCommentData(id, content, file))
      }
    }

    return result
  }

  private async getCommitId (): Promise<void> {
    this.logger.logDebug('* GitHubReposInvoker.getCommitId()')

    let result: ListCommitsResponse = await this.invokeApiCall(async (): Promise<ListCommitsResponse> => {
      const internalResult: ListCommitsResponse = await this.octokitWrapper.listCommits(this.owner, this.repo, this.pullRequestId, 1)
      this.logger.logDebug(JSON.stringify(internalResult))
      return internalResult
    })

    // Get the last page of commits so that the last commit can be located.
    if (result.headers.link !== undefined) {
      const commitsLink: string = result.headers.link
      const matches: RegExpMatchArray | null = /<.+>; rel="next", <.+?page=(?<pageNumber>\d+)>; rel="last"/u.exec(commitsLink)
      if (matches?.groups?.pageNumber === undefined) {
        throw new Error(`The regular expression did not match '${commitsLink}'.`)
      }

      const match: number = parseInt(matches.groups.pageNumber, DecimalRadix)
      result = await this.invokeApiCall(async (): Promise<ListCommitsResponse> => {
        const internalResult: ListCommitsResponse = await this.octokitWrapper.listCommits(this.owner, this.repo, this.pullRequestId, match)
        this.logger.logDebug(JSON.stringify(internalResult))
        return internalResult
      })
    }

    this.commitId = Validator.validateString(result.data[result.data.length - 1]?.sha, `result.data[${(result.data.length - 1).toString()}].sha`, 'GitHubReposInvoker.getCommitId()')
  }

  protected async invokeApiCall<Response> (action: () => Promise<Response>): Promise<Response> {
    return super.invokeApiCall(action, this.runnerInvoker.loc('repos.gitHubReposInvoker.insufficientGitHubAccessTokenPermissions'))
  }
}
