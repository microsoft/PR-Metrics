/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type FileAdditionInterface from "./fileAdditionInterface.js";

/**
 * An interface representing a request to create a commit on a branch.
 */
export default interface CommitRequestInterface {
  /**
   * The files whose contents are added or updated by the commit.
   */
  additions: readonly FileAdditionInterface[];

  /**
   * The name of the branch to which to commit, excluding the `refs/heads/` prefix.
   */
  branch: string;

  /**
   * The repository-relative paths of the files removed by the commit.
   */
  deletions: readonly string[];

  /**
   * The object ID that the branch is expected to point at, which guards against racing updates.
   */
  expectedHeadObjectId: string;

  /**
   * The commit message headline.
   */
  message: string;

  /**
   * The repository in `owner/repository` format.
   */
  nameWithOwner: string;
}
