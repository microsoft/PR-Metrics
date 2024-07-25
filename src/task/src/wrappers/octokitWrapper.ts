/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import CreateIssueCommentResponse from './octokitInterfaces/createIssueCommentResponse'
import CreateReviewCommentResponse from './octokitInterfaces/createReviewCommentResponse'
import DeleteReviewCommentResponse from './octokitInterfaces/deleteReviewCommentResponse'
import GetIssueCommentsResponse from './octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from './octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from './octokitInterfaces/getReviewCommentsResponse'
import ListCommitsResponse from './octokitInterfaces/listCommitsResponse'
import { Octokit } from 'octokit'
import OctokitGitDiffParser from '../git/octokitGitDiffParser'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import UpdateIssueCommentResponse from './octokitInterfaces/updateIssueCommentResponse'
import UpdatePullResponse from './octokitInterfaces/updatePullResponse'
import { singleton } from 'tsyringe'

/**
 * A wrapper around the Octokit (GitHub) API, to facilitate testability.
 */
@singleton()
export default class OctokitWrapper {
  private readonly octokitGitDiffParser: OctokitGitDiffParser

  private octokit: Octokit | undefined

  /**
   * Initializes a new instance of the `OctokitWrapper` class.
   * @param octokitGitDiffParser The parser for Git diffs read via Octokit.
   */
  public constructor (octokitGitDiffParser: OctokitGitDiffParser) {
    this.octokitGitDiffParser = octokitGitDiffParser
  }

  /**
   * Initializes a new instance of the `OctokitWrapper` class.
   * @param options The Octokit options including the authentication details.
   */
  public initialize (options: OctokitOptions): void {
    if (this.octokit !== undefined) {
      throw new Error('OctokitWrapper was already initialized prior to calling OctokitWrapper.initialize().')
    }

    this.octokit = new Octokit(options)
  }

  /**
   * Gets the details associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getPull (owner: string, repo: string, pullRequestId: number): Promise<GetPullResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getPull().')
    }

    return this.octokit.rest.pulls.get({
      owner,
      pull_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      repo,
    })
  }

  /**
   * Updates the details associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param title The title of the pull request.
   * @param description The description of the pull request.
   * @returns The response from the API call.
   */
  public async updatePull (owner: string, repo: string, pullRequestId: number, title: string | undefined, description: string | undefined): Promise<UpdatePullResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updatePull().')
    }

    return this.octokit.rest.pulls.update({
      body: description,
      owner,
      pull_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      repo,
      title,
    })
  }

  /**
   * Gets the comments associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getIssueComments (owner: string, repo: string, pullRequestId: number): Promise<GetIssueCommentsResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getIssueComments().')
    }

    return this.octokit.rest.issues.listComments({
      issue_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      owner,
      repo,
    })
  }

  /**
   * Gets the comments associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getReviewComments (owner: string, repo: string, pullRequestId: number): Promise<GetReviewCommentsResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getReviewComments().')
    }

    return this.octokit.rest.pulls.listReviewComments({
      owner,
      pull_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      repo,
    })
  }

  /**
   * Creates a comment associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param content The content of the comment.
   * @returns The response from the API call.
   */
  public async createIssueComment (owner: string, repo: string, pullRequestId: number, content: string): Promise<CreateIssueCommentResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.createIssueComment().')
    }

    return this.octokit.rest.issues.createComment({
      body: content,
      issue_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      owner,
      repo,
    })
  }

  /**
   * Lists the commits associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param page The commit page number.
   * @returns The response from the API call.
   */
  public async listCommits (owner: string, repo: string, pullRequestId: number, page: number): Promise<ListCommitsResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.listCommits().')
    }

    return this.octokit.rest.pulls.listCommits({
      owner,
      page,
      pull_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      repo,
    })
  }

  /**
   * Creates a comment associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param content The content of the comment.
   * @param fileName The file to which to add the comment.
   * @param commitId The ID of the commit.
   * @returns The response from the API call.
   */
  public async createReviewComment (owner: string, repo: string, pullRequestId: number, content: string, fileName: string, commitId: string): Promise<CreateReviewCommentResponse | null> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.createReviewComment().')
    }

    const lineNumber: number | null = await this.octokitGitDiffParser.getFirstChangedLine(this, owner, repo, pullRequestId, fileName)
    if (lineNumber === null) {
      return null
    }

    return this.octokit.rest.pulls.createReviewComment({
      body: content,
      commit_id: commitId,        // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      line: lineNumber,
      owner,
      path: fileName,
      pull_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      repo,
    })
  }

  /**
   * Updates a comment associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param commentThreadId The ID of the comment to be updated.
   * @param content The content of the comment.
   * @returns The response from the API call.
   */
  public async updateIssueComment (owner: string, repo: string, pullRequestId: number, commentThreadId: number, content: string): Promise<UpdateIssueCommentResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updateIssueComment().')
    }

    return this.octokit.rest.issues.updateComment({
      body: content,
      comment_id: commentThreadId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      issue_number: pullRequestId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      owner,
      repo,
    })
  }

  /**
   * Deletes a comment associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param commentThreadId The ID of the comment to be deleted.
   * @returns The response from the API call.
   */
  public async deleteReviewComment (owner: string, repo: string, commentThreadId: number): Promise<DeleteReviewCommentResponse> {
    if (this.octokit === undefined) {
      throw new Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.deleteReviewComment().')
    }

    return this.octokit.rest.pulls.deleteReviewComment({
      comment_id: commentThreadId, // eslint-disable-line camelcase, @typescript-eslint/naming-convention -- Required for alignment with Octokit.
      owner,
      repo,
    })
  }
}
