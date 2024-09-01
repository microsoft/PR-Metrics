/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The target object used for resolving an instance of a mock object.
 * @typeParam Type The type of the mock object.
 */
export default interface ResolvableInstanceTarget<T> {
  /**
   * A mapping from a name to a value.
   */
  [name: string]: T;
}
