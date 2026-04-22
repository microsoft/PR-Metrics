/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * Strings that should fail to parse as a positive numeric value. Shared by
 * tests of the numeric `Inputs` fields (base size, growth rate, test
 * factor) to cover the "fall back to the default" branch. Tests that also
 * want to cover the `Infinity` literal can spread this list and append
 * `"Infinity"`.
 */
export const invalidNumericStrings: readonly (string | null)[] = [
  null,
  "",
  " ",
  "abc",
  "===",
  "!2",
  "null",
  "undefined",
];

/**
 * Strings that reduce to an empty value after whitespace handling. Shared
 * by tests of the pattern-style `Inputs` fields (file matching patterns,
 * test matching patterns, code file extensions) to cover the "fall back
 * to the default" branch.
 */
export const invalidPatternStrings: readonly (string | null)[] = [
  null,
  "",
  " ",
  "     ",
  "\n",
];
