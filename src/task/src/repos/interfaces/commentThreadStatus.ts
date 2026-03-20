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
  unknown = 0,

  /**
   * The comment thread is active.
   */
  active = 1,

  /**
   * The comment thread is closed.
   */
  closed = 2,
}
