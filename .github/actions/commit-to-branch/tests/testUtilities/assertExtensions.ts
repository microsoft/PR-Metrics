/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import assert from "node:assert/strict";

/**
 * Asserts that the asynchronous function call throws an error with the expected message.
 * @param func The function call to test.
 * @param errorMessage The expected error message.
 * @returns A promise for awaiting the completion of the method call.
 */
export const toThrowAsync = async (
  func: () => Promise<unknown>,
  errorMessage: string,
): Promise<void> => {
  let error: unknown = null;
  try {
    await func();
  } catch (err: unknown) {
    error = err;
  }

  assert(error instanceof Error);
  assert.equal(error.message, errorMessage);
};

/**
 * Asserts that the function call throws an error with the expected message.
 * @param func The function call to test.
 * @param errorMessage The expected error message.
 */
export const toThrow = (func: () => unknown, errorMessage: string): void => {
  let error: unknown = null;
  try {
    func();
  } catch (err: unknown) {
    error = err;
  }

  assert(error instanceof Error);
  assert.equal(error.message, errorMessage);
};
