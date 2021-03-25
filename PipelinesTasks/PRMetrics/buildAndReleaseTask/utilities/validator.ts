
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A module for performing validation.
 */
export module Validator {
  /**
   * Validates that a field is not invalid, `null` or `undefined` and throws an `TypeError` if this condition is not met.
   * @typeParam T The value type.
   * @param value The value to validate.
   * @param fieldName The name of the field, for messaging purposes.
   * @param methodName The name of the calling method, for messaging purposes.
   * @returns The validated value.
   */
  export function validateField<T> (value: T | null | undefined, fieldName: string, methodName: string): T {
    if (!value) {
      throw TypeError(`Field '${fieldName}', accessed within '${methodName}', is invalid, null, or undefined '${value}'.`)
    }

    return value
  }
}
