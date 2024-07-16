/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ReposError from '../../src/repos/interfaces/reposError'

/**
 * A class representing a test repos error.
 */
export default class TestReposError extends Error implements ReposError {
  /**
   * Initializes a new instance of the `TestReposError` class.
   * @param message The error message.
   */
  public constructor(message: string) {
    super()

    this.message = message
  }

  /**
   * Gets the name of the object type.
   */
  public name = 'TestReposError'

  /**
   * The error status code accessed via `status`.
   */
  public status: number | undefined

  /**
   * The error status code accessed via `statusCode`.
   */
  public statusCode: number | undefined

  /**
   * The internal error message.
   */
  public internalMessage = ''
}
