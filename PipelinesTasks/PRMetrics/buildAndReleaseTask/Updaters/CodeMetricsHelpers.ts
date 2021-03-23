// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export function isNullOrWhitespace (input: string | null) {
  return !input || !input.trim()
}
