// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Octokit } from 'octokit'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import { RequestParameters } from '@octokit/types'
import { singleton } from 'tsyringe'
import BasePullRequest from './octokitInterfaces/basePullRequest'
import GetIssueCommentsRequest from './octokitInterfaces/getIssueCommentsRequest'
import GetIssueCommentsResponse from './octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from './octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from './octokitInterfaces/getReviewCommentsResponse'
import UpdatePullRequest from './octokitInterfaces/updatePullRequest'
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
   * @param request The request to send to the API.
   * @returns The response from the API call.
   */
  public async getPull (request: RequestParameters & BasePullRequest): Promise<GetPullResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getPull().')
    }

    return this._octokit.rest.pulls.get(request)
  }

  /**
   * Updates the details associated with a pull request.
   * @param request The request to send to the API.
   * @returns The response from the API call.
   */
  public async updatePull (request: RequestParameters & UpdatePullRequest): Promise<UpdatePullResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updatePull().')
    }

    return this._octokit.rest.pulls.update(request)
  }

  /**
   * Gets the comments associated with a pull request.
   * @param request The request to send to the API.
   * @returns The response from the API call.
   */
  public async getIssueComments (request: RequestParameters & GetIssueCommentsRequest): Promise<GetIssueCommentsResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getIssueComments().')
    }

    return this._octokit.rest.issues.listComments(request)
  }

  /**
   * Gets the comments associated with a pull request review.
   * @param request The request to send to the API.
   * @returns The response from the API call.
   */
  public async getReviewComments (request: RequestParameters & BasePullRequest): Promise<GetReviewCommentsResponse> {
    if (!this._octokit) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getReviewComments().')
    }

    return this._octokit.rest.pulls.listReviewComments(request)
  }
}
