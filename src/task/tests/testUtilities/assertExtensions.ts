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
export const toThrowAsync = async (func: any, errorMessage: string): Promise<any> => {
  let error: any = null
  try {
    await func()
  } catch (err) {
    error = err
  }

  assert(error instanceof Error)
  assert.equal(error.message, errorMessage)
  return error
}
