/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import PullRequestCommentData from "./pullRequestCommentData.js";

/**
 * A class representing a file comment.
 */
export default class FileCommentData extends PullRequestCommentData {
  /**
   * The full file name and path associated with the comment.
   */
  public readonly fileName: string;

  /**
   * Initializes a new instance of the `FileCommentData` class.
   * @param id The comment ID.
   * @param content The content (i.e., the text) associated with the comment.
   * @param fileName The full file name and path associated with the comment.
   * @param status The status associated with the comment.
   */
  public constructor(
    id: number,
    content: string,
    fileName: string,
    status?: CommentThreadStatus,
  ) {
    super(id, content, status);

    this.fileName = fileName;
  }
}
