// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import PullRequestDetails from './pullRequestDetails'
import PullRequestMetadata from './pullRequestMetadata'

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
   * Gets the current iteration for the current pull request.
   * @returns A promise containing the current iteration.
   */
  getCurrentIteration (): Promise<number>

  /**
   * Gets all comment threads for the current pull request.
   * @returns A promise containing the comment threads.
   */
  getCommentThreads (): Promise<GitPullRequestCommentThread[]>

  /**
   * Updates the title and description for the current pull request.
   * @param title The new title.
   * @param description The new description.
   * @returns A promise for awaiting the completion of the method call.
   */
  setTitleAndDescription (title: string | null, description: string | null): Promise<void>

  /**
   * Creates a new comment within the current pull request.
   * @param commentContent The text of the new comment.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param parentCommentId The parent comment ID, after which to add the new comment.
   * @returns A promise for awaiting the completion of the method call.
   */
  createComment (commentContent: string, commentThreadId: number, parentCommentId: number): Promise<void>

  /**
   * Creates a new comment thread within the current pull request.
   * @param commentContent The text of the new comment.
   * @param status The status to which to the set the comment thread.
   * @param fileName The file to which to add the comment. If this is unspecified, the comment will be created in the global pull request scope.
   * @param isFileDeleted A value indicating whether the file is being deleted.
   * @returns A promise for awaiting the completion of the method call.
   */
  createCommentThread (commentContent: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void>

  /**
   * Updates the status of a comment thread within the current pull request.
   * @param commentThreadId The comment thread ID to which to add the comment.
   * @param status The status to which to the set the comment thread.
   * @returns A promise for awaiting the completion of the method call.
   */
  setCommentThreadStatus (commentThreadId: number, status: CommentThreadStatus): Promise<void>

  /**
   * Adds metadata to the current pull request.
   * @param metadata The metadata to be added.
   * @returns A promise for awaiting the completion of the method call.
   */
  addMetadata (metadata: PullRequestMetadata[]): Promise<void>
}
