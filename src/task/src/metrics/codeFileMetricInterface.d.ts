/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing a metric related to a code file.
 */
export interface CodeFileMetricInterface {
  /**
   * The name of the file.
   */
  fileName: string;

  /**
   * The number of lines added to the file.
   */
  linesAdded: number;

  /**
   * The number of lines deleted from the file.
   */
  linesDeleted: number;
}
