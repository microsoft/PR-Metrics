/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'

/**
 * A class representing a pull request comment.
 */
export default class PullRequestCommentData {
  private readonly idInternal: number
  private readonly contentInternal: string
  private readonly statusInternal: CommentThreadStatus

  /**
   * Initializes a new instance of the `PullRequestCommentData` class.
   * @param id The optional comment ID.
   * @param content The optional content (i.e., the text) associated with the comment.
   * @param status The optional status associated with the comment.
   */
  public constructor (id: number, content: string, status?: CommentThreadStatus) {
    this.idInternal = id
    this.contentInternal = content
    this.statusInternal = status ?? CommentThreadStatus.Unknown
  }

  /**
   * Gets the ID associated with the comment.
   * @returns The comment ID.
   */
  public get id (): number {
    return this.idInternal
  }

  /**
   * Gets the content (i.e., the text) associated with the comment.
   * @returns The comment content.
   */
  public get content (): string {
    return this.contentInternal
  }

  /**
   * Gets the status associated with the comment.
   * @returns The comment status.
   */
  public get status (): CommentThreadStatus {
    return this.statusInternal
  }
}
