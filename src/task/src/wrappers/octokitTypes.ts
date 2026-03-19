/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { Endpoints } from "@octokit/types";

/** Response from creating an issue comment on a GitHub pull request. */
export type CreateIssueCommentResponse =
  Endpoints["POST /repos/{owner}/{repo}/issues/{issue_number}/comments"]["response"];

/** Response from creating a review comment on a GitHub pull request. */
export type CreateReviewCommentResponse =
  Endpoints["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"];

/** Response from deleting a review comment on a GitHub pull request. */
export type DeleteReviewCommentResponse =
  Endpoints["DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"]["response"];

/** Response from listing issue comments on a GitHub pull request. */
export type GetIssueCommentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"]["response"];

/** Response from getting a GitHub pull request. */
export type GetPullResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"];

/** Response from listing review comments on a GitHub pull request. */
export type GetReviewCommentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"]["response"];

/** Response from listing commits on a GitHub pull request. */
export type ListCommitsResponse =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"]["response"];

/** Response from updating an issue comment on a GitHub pull request. */
export type UpdateIssueCommentResponse =
  Endpoints["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"]["response"];

/** Response from updating a GitHub pull request. */
export type UpdatePullResponse =
  Endpoints["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"]["response"];
