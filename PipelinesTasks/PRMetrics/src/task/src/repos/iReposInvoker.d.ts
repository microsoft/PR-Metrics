// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import PullRequestCommentsThread from '../pullRequests/pullRequestCommentsThreads'
import PullRequestDetails from './pullRequestDetails'

/**
 * An interface for invoking repository functionality with any underlying repository store.
 */
export default interface IReposInvoker {
  /**
   * Gets a value indicating whether the current repository provides complete functionality.
   */
  isCommentsFunctionalityAvailable: boolean

  /**
   * Gets a value indicating whether the OAuth access token is available to the task.
   */
  isAccessTokenAvailable: boolean

  /**
   * Gets the title and description for the current pull request.
   * @returns A promise containing the title and description.
   */
  getTitleAndDescription (): Promise<PullRequestDetails>

  /**
   * Gets all comments for the current pull request.
   * @returns A promise containing the comments.
   */
  getComments (): Promise<GitPullRequestCommentThread[]>

  /**
   * Updates the title and description for the current pull request.
   * @param title The new title.
   * @param description The new description.
   * @returns A promise for awaiting the completion of the method call.
   */
  setTitleAndDescription (title: string | null, description: string | null): Promise<void>

  /**
   * Creates a new comment within the current pull request.
   * @param content The content of the new comment.
   * @param status The status to which to the set the comment thread.
   * @param fileName The file to which to add the comment. If this is unspecified, the comment will be created in the global pull request scope.
   * @param isFileDeleted A value indicating whether the file is being deleted.
   * @returns A promise for awaiting the completion of the method call.
   */
  createComment (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void>

  /**
   * Updates a comment thread within the current pull request.
   * @param content The content of the comment. If this is `null`, the contents will not be updated.
   * @param status The status to which to the set the comment thread. If this is `null`, the status will not be updated.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param parentCommentId The parent comment ID, after which to add the new comment.
   * @returns A promise for awaiting the completion of the method call.
   */
  updateComment (content: string | null, status: CommentThreadStatus | null, commentThreadId: number, commentId: number): Promise<void>

  /**
   * Deletes a comment thread within the current pull request.
   * @param commentThread The details of the comment thread to be deleted.
   * @returns A promise for awaiting the completion of the method call.
   */
  deleteCommentThread (commentThread: PullRequestCommentsThread): Promise<void>
}
