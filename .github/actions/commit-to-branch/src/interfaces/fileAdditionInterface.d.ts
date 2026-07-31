/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing a file whose contents are added or updated by a commit.
 */
export default interface FileAdditionInterface {
  /**
   * The Base64 encoding of the raw bytes of the file.
   */
  contents: string;

  /**
   * The repository-relative path of the file.
   */
  path: string;
}
