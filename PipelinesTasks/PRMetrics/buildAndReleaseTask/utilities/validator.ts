
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A module for performing validation.
 */
export module validator {
  /**
   * Validates that a field is not invalid, `null` or `undefined` and throws an `Error` if this condition is not met.
   * @typeParam T The value type.
   * @param value The value to validate.
   * @param fieldName The name of the field, for messaging purposes.
   */
  export function validateField<T> (value: T | null | undefined, fieldName: string): void {
    if (!value) {
      throw new Error(`Field '${fieldName}' is invalid, null, or undefined '${value}'.`)
    }
  }
}
