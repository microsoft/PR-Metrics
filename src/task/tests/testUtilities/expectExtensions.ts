// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'

/**
 * Verifies that the asynchronous function call throws an error with the expected message.
 * @param func The function call to test.
 * @param errorMessage The expected error message.
 * @returns The error object.
 */
export const toThrowAsync = async (func: any, errorMessage: string): Promise<any> => {
  let error: any | null = null
  try {
    await func()
  } catch (err) {
    error = err
  }

  expect(error).to.be.an('Error')
  expect(error.message).to.equal(errorMessage)
  return error
}
