// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * An interface defining the format of JSON resources (.resjson) files.
 */
export default interface ResourcesJson {
  /**
   * A mapping from a resource name to a resource value.
   */
  [name: string]: string
}
