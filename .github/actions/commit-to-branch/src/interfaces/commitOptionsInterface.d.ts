/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing the options controlling commit creation.
 */
export default interface CommitOptionsInterface {
  /**
   * The name of the branch to which to commit, excluding the `refs/heads/` prefix.
   */
  branch: string;

  /**
   * A value indicating whether the branch may be created from the checked out commit when it does not yet exist.
   */
  createBranch: boolean;

  /**
   * The commit message headline.
   */
  message: string;

  /**
   * The owner of the repository.
   */
  owner: string;

  /**
   * The name of the repository.
   */
  repository: string;

  /**
   * A value indicating whether all working tree changes should be staged before the index is read.
   */
  stageAll: boolean;
}
