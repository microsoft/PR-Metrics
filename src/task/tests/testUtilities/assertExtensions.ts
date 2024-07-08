/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import assert from 'node:assert/strict'

/**
 * Asserts that the asynchronous function call throws an error with the expected message.
 * @param func The function call to test.
 * @param errorMessage The expected error message.
 * @returns The error object.
 */
export const toThrowAsync = async (func: () => Promise<unknown>, errorMessage: string): Promise<Error> => {
  let error: unknown = null
  try {
    await func()
  } catch (err: unknown) {
    error = err
  }

  assert(error instanceof Error)
  assert.equal(error.message, errorMessage)
  return error
}
