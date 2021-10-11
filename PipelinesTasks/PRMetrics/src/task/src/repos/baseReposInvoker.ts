// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import IReposInvoker from './iReposInvoker'
import PullRequestCommentGrouping from './interfaces/pullRequestCommentGrouping'
import PullRequestDetails from './interfaces/pullRequestDetails'

/**
 * A base class for invoking repository functionality.
 */
export default abstract class BaseReposInvoker implements IReposInvoker {
  public abstract isAccessTokenAvailable: string | null

  public abstract getTitleAndDescription(): Promise<PullRequestDetails>

  public abstract getComments(): Promise<PullRequestCommentGrouping>

  public abstract setTitleAndDescription(title: string | null, description: string | null): Promise<void>

  public abstract createComment(content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void>

  public abstract updateComment(content: string | null, status: CommentThreadStatus | null, commentThreadId: number): Promise<void>

  public abstract deleteCommentThread(commentThreadId: number): Promise<void>

  /**
   * Invokes an API call, augmenting any errors that may be thrown due to insufficient access.
   * @typeParam TResponse The type of the response from the API call.
   * @param action The action defining the API call to invoke.
   * @param errorMessage The error message to insert if a caught error is due to insufficient access.
   * @returns A promise containing the response from the API call.
   */
  protected async invokeApiCall<TResponse> (action: () => Promise<TResponse>, accessErrorMessage: string): Promise<TResponse> {
    try {
      return await action()
    } catch (error) {
      const accessErrorStatusCodes: number[] = [401, 403, 404]

      if (accessErrorStatusCodes.includes(error.status ?? error.statusCode)) {
        error.internalMessage = error.message
        error.message = accessErrorMessage
      }

      throw error
    }
  }
}
