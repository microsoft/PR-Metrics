
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as Converter from './converter'

/**
* Validates that an environment variable is not invalid or `undefined` and throws an `TypeError` if this condition is not met.
* @param variableName The name of the environment variable.
* @param methodName The name of the calling method, for messaging purposes.
* @returns The validated value.
*/
export function validateVariable (variableName: string, methodName: string): string {
  const value: string | undefined = process.env[variableName]
  return validateString(value, variableName, methodName)
}

/**
* Validates that a string value is not invalid, `null`, or `undefined` and throws an `TypeError` if this condition is not met.
* @param value The value to validate.
* @param valueName The name of the value, for messaging purposes.
* @param methodName The name of the calling method, for messaging purposes.
* @returns The validated value.
*/
export function validateString (value: string | null | undefined, valueName: string, methodName: string): string {
  if (value === null || value === undefined || value === '') {
    throw TypeError(`'${valueName}', accessed within '${methodName}', is invalid, null, or undefined '${Converter.toString(value)}'.`)
  }

  return value
}

/**
* Validates that a number value is not invalid, `null`, or `undefined` and throws an `TypeError` if this condition is not met.
* @param value The value to validate.
* @param valueName The name of the value, for messaging purposes.
* @param methodName The name of the calling method, for messaging purposes.
* @returns The validated value.
*/
export function validateNumber (value: number | null | undefined, valueName: string, methodName: string): number {
  if (value === null || value === undefined || value === 0 || isNaN(value)) {
    throw TypeError(`'${valueName}', accessed within '${methodName}', is invalid, null, or undefined '${Converter.toString(value)}'.`)
  }

  return value
}
