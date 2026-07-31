/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing the remote state of a branch within a repository.
 */
export default interface BranchStateInterface {
  /**
   * The object ID at the tip of the branch, or `null` when the branch does not exist.
   */
  branchObjectId: string | null;

  /**
   * The node ID of the repository.
   */
  repositoryId: string;
}
