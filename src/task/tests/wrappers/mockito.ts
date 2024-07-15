/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { anyString as mockitoAnyString } from "ts-mockito"

/**
 * Verifies that the argument is a `string`.
 * @returns The `string`.
 */
export const anyString: () => string = (): string =>
  mockitoAnyString() as string
