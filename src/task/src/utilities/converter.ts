/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

interface StringConvertible {
  toString: () => string
}

/**
 * Converts an object that can be null or undefined to a string.
 * @param value The value to convert.
 * @returns The converted value.
 */
export const toString = (value: StringConvertible | null | undefined): string => {
  if (value === null) {
    return 'null'
  } else if (value === undefined) {
    return 'undefined'
  }

  return value.toString()
}
