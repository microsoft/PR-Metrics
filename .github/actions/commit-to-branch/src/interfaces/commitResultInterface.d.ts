/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing the outcome of commit creation.
 */
export default interface CommitResultInterface {
  /**
   * A value indicating whether a commit was created.
   */
  committed: boolean;

  /**
   * The object ID of the created commit, or `null` when no commit was created.
   */
  objectId: string | null;
}
