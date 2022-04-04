
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A module for performing validation.
 */
export module Validator {
  /**
   * Validates that an environment variable is not invalid or `undefined` and throws an `TypeError` if this condition is not met.
   * @param variableName The name of the environment variable.
   * @param methodName The name of the calling method, for messaging purposes.
   * @returns The validated value.
   */
  export function validateVariable (variableName: string, methodName: string): string {
    const value: string | undefined = process.env[variableName]
    return validate(value, variableName, methodName)
  }

  /**
   * Validates that a value is not invalid, `null`, or `undefined` and throws an `TypeError` if this condition is not met.
   * @typeParam T The value type.
   * @param value The value to validate.
   * @param valueName The name of the value, for messaging purposes.
   * @param methodName The name of the calling method, for messaging purposes.
   * @returns The validated value.
   */
  export function validate<T> (value: T | null | undefined, valueName: string, methodName: string): T {
    if (!value) {
      throw TypeError(`'${valueName}', accessed within '${methodName}', is invalid, null, or undefined '${value}'.`)
    }

    return value
  }
}
