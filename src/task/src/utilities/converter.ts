
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

interface StringConvertible {
  toString: () => string
}

/**
 * Converts an object that can be null or undefined to a string.
 * @typeParam Type The type of the object, which must be convertible to a string.
 * @param value The value to convert.
 * @returns The converted value.
 */
export function toString<Type extends StringConvertible> (value: Type | null | undefined): string {
  if (value === null) {
    return 'null'
  } else if (value === undefined) {
    return 'undefined'
  } else {
    return value.toString()
  }
}
