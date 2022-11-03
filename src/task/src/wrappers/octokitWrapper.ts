// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AddedFile, AnyFileChange, ChangedFile, GitDiff, RenamedFile } from 'parse-git-diff/build/types'
import { Octokit } from 'octokit'
import { OctokitOptions } from '@octokit/core/dist-types/types'
import { singleton } from 'tsyringe'
import axios, { AxiosResponse } from 'axios'
import CreateIssueCommentResponse from './octokitInterfaces/createIssueCommentResponse'
import CreateReviewCommentResponse from './octokitInterfaces/createReviewCommentResponse'
import DeleteReviewCommentResponse from './octokitInterfaces/deleteReviewCommentResponse'
import GetIssueCommentsResponse from './octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from './octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from './octokitInterfaces/getReviewCommentsResponse'
import ListCommitsResponse from './octokitInterfaces/listCommitsResponse'
import parseGitDiff from 'parse-git-diff'
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
  public initialize (options: OctokitOptions): void {
    if (this._octokit !== undefined) {
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
  public async getPull (owner: string, repo: string, pullRequestId: number): Promise<GetPullResponse> {
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getPull().')
    }

    return await this._octokit.rest.pulls.get({
      owner,
      repo,
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
  public async updatePull (owner: string, repo: string, pullRequestId: number, title: string | undefined, description: string | undefined): Promise<UpdatePullResponse> {
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updatePull().')
    }

    return await this._octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: pullRequestId,
      title,
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getIssueComments().')
    }

    return await this._octokit.rest.issues.listComments({
      owner,
      repo,
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.getReviewComments().')
    }

    return await this._octokit.rest.pulls.listReviewComments({
      owner,
      repo,
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.createIssueComment().')
    }

    return await this._octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pullRequestId,
      body: content
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.listCommits().')
    }

    return await this._octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: pullRequestId,
      page
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.createReviewComment().')
    }

    // TODO
    const test: any = await this._octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullRequestId
    })

    // Note bug where multiple files are not picked up if the first diff is too large. Consider an alternative library.
    const diffResponse: AxiosResponse<string, string> = await axios.get(test.data.diff_url) // 'https://patch-diff.githubusercontent.com/raw/microsoft/PR-Metrics/pull/290.diff')
    const diffResponses: string[] = diffResponse.data.split(/^diff --git/gm)
    const parsableDiffResponses: string[] = []
    for (let i: number = 1; i < diffResponses.length; i += 2) {
      console.log('diffResponse: ' + diffResponses[i])
      console.log('previousDiffResponse: ' + diffResponses[i - 1])
      parsableDiffResponses.push(diffResponses[i - 1]! + diffResponses[i]!)
    }

    let line: number = -1
    console.log('Iterations: ' + parsableDiffResponses.length)
    for (let i: number = 0; i < parsableDiffResponses.length && line === -1; i++) {
      console.log('Current Iteration: ' + i)
      console.log('Current Iteration Contents: ' + parsableDiffResponses[i]!)

      const diffParsed: GitDiff = parseGitDiff(parsableDiffResponses[i]!)

      console.log('File Count: ' + diffParsed.files.length)
      if (diffParsed.files.length !== 1) {
        throw Error('Multiple files were found in the diff.' + i + ' ' + diffParsed.files.length + ' ' + parsableDiffResponses[i]!)
      }

      console.log('File to Match: ' + fileName)

      diffParsed.files.forEach((file: AnyFileChange): void => {
        if (file.type === 'AddedFile' || file.type === 'ChangedFile') {
          const fileCasted: AddedFile | ChangedFile = file as AddedFile | ChangedFile

          console.log('File Type: ' + fileCasted.type)
          console.log('File Path: ' + fileCasted.path)
          console.log('Start Line: ' + fileCasted.chunks[0]?.toFileRange.start)
          console.log()

          if (fileCasted.path === fileName) {
            console.log('Setting Line Number')
            line = fileCasted.chunks[0]?.toFileRange.start!
          }
        } else if (file.type === 'RenamedFile') {
          const fileCasted: RenamedFile = file as RenamedFile

          console.log('File Type: ' + fileCasted.type)
          console.log('File Path: ' + fileCasted.pathAfter)
          console.log('Start Line: ' + fileCasted.chunks[0]?.toFileRange.start)
          console.log()

          if (fileCasted.pathAfter === fileName) {
            console.log('Setting Line Number')
            line = fileCasted.chunks[0]?.toFileRange.start!
          }
        } else {
          console.log('Unexpected File Type: ' + file.type)
        }
      })
    }

    if (line === -1) {
      throw Error('Cannot find line number of file.')
    }

    return await this._octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullRequestId,
      body: content,
      path: fileName,
      line,
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.updateIssueComment().')
    }

    return await this._octokit.rest.issues.updateComment({
      owner,
      repo,
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
    if (this._octokit === undefined) {
      throw Error('OctokitWrapper was not initialized prior to calling OctokitWrapper.deleteReviewComment().')
    }

    return await this._octokit.rest.pulls.deleteReviewComment({
      owner,
      repo,
      comment_id: commentThreadId
    })
  }
}
