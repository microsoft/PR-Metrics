/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import CommentData from './interfaces/commentData'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import IReposInvoker from './iReposInvoker'
import PullRequestDetails from './interfaces/pullRequestDetails'
import { StatusCodes } from 'http-status-codes'

/**
 * A base class for invoking repository functionality.
 */
export default abstract class BaseReposInvoker implements IReposInvoker {
  public abstract isAccessTokenAvailable (): Promise<string | null>

  public abstract getTitleAndDescription (): Promise<PullRequestDetails>

  public abstract getComments (): Promise<CommentData>

  public abstract setTitleAndDescription (title: string | null, description: string | null): Promise<void>

  public abstract createComment (content: string, status: CommentThreadStatus, fileName?: string, isFileDeleted?: boolean): Promise<void>

  public abstract updateComment (commentThreadId: number, content: string | null, status: CommentThreadStatus | null): Promise<void>

  public abstract deleteCommentThread (commentThreadId: number): Promise<void>

  /**
   * Invokes an API call, augmenting any errors that may be thrown due to insufficient access.
   * @typeParam Response The type of the response from the API call.
   * @param action The action defining the API call to invoke.
   * @param accessErrorMessage The error message to insert if a caught error is due to insufficient access.
   * @returns A promise containing the response from the API call.
   */
  protected async invokeApiCall<Response> (action: () => Promise<Response>, accessErrorMessage: string): Promise<Response> {
    try {
      return await action()
    } catch (error: any) {
      const accessErrorStatusCodes: number[] = [StatusCodes.UNAUTHORIZED, StatusCodes.FORBIDDEN, StatusCodes.NOT_FOUND]
      if (accessErrorStatusCodes.includes(error.status ?? error.statusCode)) {
        error.internalMessage = error.message
        error.message = accessErrorMessage
      }

      throw error
    }
  }
}
