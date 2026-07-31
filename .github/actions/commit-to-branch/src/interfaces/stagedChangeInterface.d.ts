/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing a single file change present in the Git index.
 */
export default interface StagedChangeInterface {
  /**
   * The Git object ID of the staged blob, or `null` when the file is staged for deletion. The content associated with
   * this object ID is authoritative, as the working tree may have diverged from the index.
   */
  objectId: string | null;

  /**
   * The repository-relative path of the file, exactly as reported by Git and treated purely as data.
   */
  path: string;
}
