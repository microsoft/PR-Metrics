// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Octokit } from 'octokit'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import { singleton } from 'tsyringe'
import CreateIssueCommentResponse from './octokitInterfaces/createIssueCommentResponse'
import CreateReviewCommentResponse from './octokitInterfaces/createReviewCommentResponse'
import DeleteReviewCommentResponse from './octokitInterfaces/deleteReviewCommentResponse'
import GetIssueCommentsResponse from './octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from './octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from './octokitInterfaces/getReviewCommentsResponse'
import ListCommitsResponse from './octokitInterfaces/listCommitsResponse'
import UpdateIssueCommentResponse from './octokitInterfaces/updateIssueCommentResponse'
import UpdatePullResponse from './octokitInterfaces/updatePullResponse'

/**
 * A wrapper around the Octokit (GitHub) API, to facilitate testability.
 */
@singleton()
export default class OctokitWrapper {
  private _octokit: Octokit | undefined

  /**
   * Initializes a new instance of the `OctokitWrapper` class.
   * @param options The Octokit options including the authentication details.
   */
  public initialize (options?: OctokitOptions | undefined): void {
    if (this._octokit) {
      throw Error('OctokitWrapper was already initialized prior to calling OctokitWrapper.initialize().')
    }

    this._octokit = new Octokit(options)
  }

  /**
   * Gets the details associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getPull(owner: string, repo: string, pullRequestId: number): Promise<GetPullResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getPull().')
    }

    return this._octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: pullRequestId
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
  public async updatePull(owner: string, repo: string, pullRequestId: number, title: string | undefined, description: string | undefined): Promise<UpdatePullResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updatePull().')
    }

    return this._octokit.rest.pulls.update({
      owner: owner,
      repo: repo,
      pull_number: pullRequestId,
      title: title,
      body: description
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
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getIssueComments().')
    }

    return this._octokit.rest.issues.listComments({
      owner: owner,
      repo: repo,
      issue_number: pullRequestId
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
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getReviewComments().')
    }

    return this._octokit.rest.pulls.listReviewComments({
      owner: owner,
      repo: repo,
      pull_number: pullRequestId
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
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.createIssueComment().')
    }

    return this._octokit.rest.issues.createComment({
      owner: owner,
      repo: repo,
      issue_number: pullRequestId,
      body: content
    })
  }

  /**
   * Lists the commits associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async listCommits (owner: string, repo: string, pullRequestId: number): Promise<ListCommitsResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.listCommits().')
    }

    return this._octokit.rest.pulls.listCommits({
      owner: owner,
      repo: repo,
      pull_number: pullRequestId
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
  public async createReviewComment (owner: string, repo: string, pullRequestId: number, content: string, fileName: string, commitId: string): Promise<CreateReviewCommentResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.createReviewComment().')
    }

    return this._octokit.rest.pulls.createReviewComment({
      owner: owner,
      repo: repo,
      pull_number: pullRequestId,
      body: content,
      path: fileName,
      position: 1,
      commit_id: commitId
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
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updateIssueComment().')
    }

    return this._octokit.rest.issues.updateComment({
      owner: owner,
      repo: repo,
      issue_number: pullRequestId,
      comment_id: commentThreadId,
      body: content
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
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.deleteReviewComment().')
    }

    return this._octokit.rest.pulls.deleteReviewComment({
      owner: owner,
      repo: repo,
      comment_id: commentThreadId
    })
  }
}
