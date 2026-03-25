/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { OctokitOptions } from "@octokit/core";
import { Octokit } from "octokit";
import { singleton } from "tsyringe";
import type OctokitGitDiffParser from "../git/octokitGitDiffParser.js";
import type CreateIssueCommentResponse from "./octokitInterfaces/createIssueCommentResponse.js";
import type CreateReviewCommentResponse from "./octokitInterfaces/createReviewCommentResponse.js";
import type DeleteReviewCommentResponse from "./octokitInterfaces/deleteReviewCommentResponse.js";
import type GetIssueCommentsResponse from "./octokitInterfaces/getIssueCommentsResponse.js";
import type GetPullResponse from "./octokitInterfaces/getPullResponse.js";
import type GetReviewCommentsResponse from "./octokitInterfaces/getReviewCommentsResponse.js";
import type ListCommitsResponse from "./octokitInterfaces/listCommitsResponse.js";
import type UpdateIssueCommentResponse from "./octokitInterfaces/updateIssueCommentResponse.js";
import type UpdatePullResponse from "./octokitInterfaces/updatePullResponse.js";

/* eslint-disable @typescript-eslint/naming-convention -- Required for alignment with Octokit. */

/**
 * A wrapper around the Octokit (GitHub) API, to facilitate testability.
 */
@singleton()
export default class OctokitWrapper {
  private readonly _octokitGitDiffParser: OctokitGitDiffParser;

  private _octokit: Octokit | null = null;

  /**
   * Initializes a new instance of the `OctokitWrapper` class.
   * @param octokitGitDiffParser The parser for Git diffs read via Octokit.
   */
  public constructor(octokitGitDiffParser: OctokitGitDiffParser) {
    this._octokitGitDiffParser = octokitGitDiffParser;
  }

  /**
   * Initializes a new instance of the `OctokitWrapper` class.
   * @param options The Octokit options including the authentication details.
   */
  public initialize(options: OctokitOptions): void {
    if (this._octokit !== null) {
      throw new Error(
        "OctokitWrapper was already initialized prior to calling OctokitWrapper.initialize().",
      );
    }

    this._octokit = new Octokit(options);
  }

  /**
   * Gets the details associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getPull(
    owner: string,
    repo: string,
    pullRequestId: number,
  ): Promise<GetPullResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.getPull().",
      );
    }

    return this._octokit.rest.pulls.get({
      owner,
      pull_number: pullRequestId,
      repo,
    });
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
  public async updatePull(
    owner: string,
    repo: string,
    pullRequestId: number,
    title: string | null,
    description: string | null,
  ): Promise<UpdatePullResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.updatePull().",
      );
    }

    const request: Parameters<typeof this._octokit.rest.pulls.update>[0] = {
      owner,
      pull_number: pullRequestId,
      repo,
    };

    if (title !== null) {
      request.title = title;
    }

    if (description !== null) {
      request.body = description;
    }

    return this._octokit.rest.pulls.update(request);
  }

  /**
   * Gets the comments associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getIssueComments(
    owner: string,
    repo: string,
    pullRequestId: number,
  ): Promise<GetIssueCommentsResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.getIssueComments().",
      );
    }

    return this._octokit.rest.issues.listComments({
      issue_number: pullRequestId,
      owner,
      repo,
    });
  }

  /**
   * Gets the comments associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @returns The response from the API call.
   */
  public async getReviewComments(
    owner: string,
    repo: string,
    pullRequestId: number,
  ): Promise<GetReviewCommentsResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.getReviewComments().",
      );
    }

    return this._octokit.rest.pulls.listReviewComments({
      owner,
      pull_number: pullRequestId,
      repo,
    });
  }

  /**
   * Creates a comment associated with a pull request.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param content The content of the comment.
   * @returns The response from the API call.
   */
  public async createIssueComment(
    owner: string,
    repo: string,
    pullRequestId: number,
    content: string,
  ): Promise<CreateIssueCommentResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.createIssueComment().",
      );
    }

    return this._octokit.rest.issues.createComment({
      body: content,
      issue_number: pullRequestId,
      owner,
      repo,
    });
  }

  /**
   * Lists the commits associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param pullRequestId The numeric ID of the pull request.
   * @param page The commit page number.
   * @returns The response from the API call.
   */
  public async listCommits(
    owner: string,
    repo: string,
    pullRequestId: number,
    page: number,
  ): Promise<ListCommitsResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.listCommits().",
      );
    }

    return this._octokit.rest.pulls.listCommits({
      owner,
      page,
      pull_number: pullRequestId,
      repo,
    });
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
  public async createReviewComment(
    owner: string,
    repo: string,
    pullRequestId: number,
    content: string,
    fileName: string,
    commitId: string,
  ): Promise<CreateReviewCommentResponse | null> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.createReviewComment().",
      );
    }

    const lineNumber: number | null =
      await this._octokitGitDiffParser.getFirstChangedLine(
        this,
        owner,
        repo,
        pullRequestId,
        fileName,
      );
    if (lineNumber === null) {
      return null;
    }

    return this._octokit.rest.pulls.createReviewComment({
      body: content,
      commit_id: commitId,
      line: lineNumber,
      owner,
      path: fileName,
      pull_number: pullRequestId,
      repo,
    });
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
  public async updateIssueComment(
    owner: string,
    repo: string,
    pullRequestId: number,
    commentThreadId: number,
    content: string,
  ): Promise<UpdateIssueCommentResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.updateIssueComment().",
      );
    }

    return this._octokit.rest.issues.updateComment({
      body: content,
      comment_id: commentThreadId,
      issue_number: pullRequestId,
      owner,
      repo,
    });
  }

  /**
   * Deletes a comment associated with a pull request review.
   * @param owner The repo owner.
   * @param repo The repo name.
   * @param commentThreadId The ID of the comment to be deleted.
   * @returns The response from the API call.
   */
  public async deleteReviewComment(
    owner: string,
    repo: string,
    commentThreadId: number,
  ): Promise<DeleteReviewCommentResponse> {
    if (this._octokit === null) {
      throw new Error(
        "OctokitWrapper was not initialized prior to calling OctokitWrapper.deleteReviewComment().",
      );
    }

    return this._octokit.rest.pulls.deleteReviewComment({
      comment_id: commentThreadId,
      owner,
      repo,
    });
  }
}

/* eslint-enable @typescript-eslint/naming-convention */
