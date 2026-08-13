/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";

/**
 * An interface representing the creation of a comment within a pull request.
 */
export interface CommentCreationInterface {
  /**
   * The operation to be performed.
   */
  operation: "create";

  /**
   * The content of the comment to be created.
   */
  content: string;

  /**
   * The file to which the comment is to be added, or `null` for a comment in the global pull request scope.
   */
  fileName: string | null;

  /**
   * The status to which to set the comment thread.
   */
  status: CommentThreadStatus;

  /**
   * A value indicating whether the file to which the comment is to be added is being deleted.
   */
  isFileDeleted: boolean;
}

/**
 * An interface representing the update of a comment within a pull request.
 */
export interface CommentUpdateInterface {
  /**
   * The operation to be performed.
   */
  operation: "update";

  /**
   * The ID of the comment thread to be updated.
   */
  commentThreadId: number;

  /**
   * The content to which to set the comment, or `null` if the content is unchanged.
   */
  content: string | null;

  /**
   * The status to which to set the comment thread, or `null` if the status is unchanged.
   */
  status: CommentThreadStatus | null;
}

/**
 * An interface representing the deletion of a comment thread within a pull request.
 */
export interface CommentDeletionInterface {
  /**
   * The operation to be performed.
   */
  operation: "delete";

  /**
   * The ID of the comment thread to be deleted.
   */
  commentThreadId: number;
}

/**
 * A type representing a single modification to the comments within a pull request.
 */
type CommentMutationInterface =
  | CommentCreationInterface
  | CommentDeletionInterface
  | CommentUpdateInterface;
export default CommentMutationInterface;
