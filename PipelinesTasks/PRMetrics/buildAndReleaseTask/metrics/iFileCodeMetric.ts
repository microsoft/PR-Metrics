// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface representing a code metric related to a file.
 */
export interface IFileCodeMetric {
  /**
   * The name of the file.
   */
  fileName: string

  /**
   * The value of the metric
   */
  value: string
}
