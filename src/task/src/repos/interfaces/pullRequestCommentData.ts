/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";

/**
 * A class representing a pull request comment.
 */
export default class PullRequestCommentData {
  /**
   * The ID associated with the comment.
   */
  public readonly id: number;

  /**
   * The content (i.e., the text) associated with the comment.
   */
  public readonly content: string;

  /**
   * The status associated with the comment.
   */
  public readonly status: CommentThreadStatus;

  /**
   * The numeric ID of the principal who created the comment, or `null` if the repository provider does not expose
   * the author details.
   */
  public readonly authorId: number | null;

  /**
   * The type of the principal who created the comment, such as `User` or `Bot`, or `null` if the repository
   * provider does not expose the author details.
   */
  public readonly authorType: string | null;

  /**
   * Initializes a new instance of the `PullRequestCommentData` class.
   * @param id The optional comment ID.
   * @param content The optional content (i.e., the text) associated with the comment.
   * @param status The optional status associated with the comment.
   * @param authorId The optional numeric ID of the principal who created the comment.
   * @param authorType The optional type of the principal who created the comment.
   */
  public constructor(
    id: number,
    content: string,
    status?: CommentThreadStatus,
    authorId?: number | null,
    authorType?: string | null,
  ) {
    this.id = id;
    this.content = content;
    this.status = status ?? CommentThreadStatus.Unknown;
    this.authorId = authorId ?? null;
    this.authorType = authorType ?? null;
  }
}
