/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * Augments the built-in `ErrorConstructor` with `isError()` from Node 24.
 * This can be removed once TypeScript ships native `Error.isError()` typings.
 */
interface ErrorConstructor {
  isError: (value: unknown) => value is Error;
}
