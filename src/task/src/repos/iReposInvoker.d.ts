// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import CommentData from './interfaces/commentData'
import PullRequestDetails from './interfaces/pullRequestDetails'

/**
 * An interface for invoking repository functionality with any underlying repository store.
 */
export default interface IReposInvoker {
  /**
   * Gets a value indicating whether the Personal Access Token (PAT) can be accessed by the task.
   */
  isAccessTokenAvailable: string | null

  /**
   * Gets the title and description for the current pull request.
   * @returns A promise containing the title and description.
   */
  getTitleAndDescription: () => Promise<PullRequestDetails>

  /**
   * Gets all comments for the current pull request.
   * @returns A promise containing the comments.
   */
  getComments: () => Promise<CommentData>

  /**
   * Updates the title and description for the current pull request.
   * @param title The new title.
   * @param description The new description.
   * @returns A promise for awaiting the completion of the method call.
   */
  setTitleAndDescription: (title: string | null, description: string | null) => Promise<void>

  /**
   * Creates a new comment within the current pull request. Note that calling this method asynchronously can cause
   * problems with the GitHub APIs.
   * @param content The content of the new comment.
   * @param status The status to which to the set the comment thread.
   * @param fileName The file to which to add the comment. If this is unspecified, the comment will be created in the global pull request scope.
   * @param isFileDeleted A value indicating whether the file is being deleted.
   * @returns A promise for awaiting the completion of the method call.
   */
  createComment: (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean) => Promise<void>

  /**
   * Updates a comment thread within the current pull request.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param content The content of the comment. If this is `null`, the contents will not be updated.
   * @param status The status to which to the set the comment thread. If this is `null`, the status will not be updated.
   * @returns A promise for awaiting the completion of the method call.
   */
  updateComment: (commentThreadId: number, content: string | null, status: CommentThreadStatus | null) => Promise<void>

  /**
   * Deletes a comment thread within the current pull request.
   * @param commentThreadId The ID of the comment thread to be deleted.
   * @returns A promise for awaiting the completion of the method call.
   */
  deleteCommentThread: (commentThreadId: number) => Promise<void>
}
