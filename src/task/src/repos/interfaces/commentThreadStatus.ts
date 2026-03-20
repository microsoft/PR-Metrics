/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The status of a pull request comment thread.
 */
export enum CommentThreadStatus {
  /**
   * The comment thread status is unknown.
   */
  Unknown = 0,

  /**
   * The comment thread is active.
   */
  Active = 1,

  /**
   * The comment thread is closed.
   */
  Closed = 2,
}
