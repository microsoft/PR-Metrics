/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Converter from "./converter.js";

/**
 * Validates that a string value is not invalid, `null`, or `undefined` and throws an `TypeError` if this condition is not met.
 * @param value The value to validate.
 * @param valueName The name of the value, for messaging purposes.
 * @param methodName The name of the calling method, for messaging purposes.
 * @returns The validated value.
 */
export const validateString = (
  value: string | null | undefined,
  valueName: string,
  methodName: string,
): string => {
  if (value === null || typeof value === "undefined" || value === "") {
    throw new TypeError(
      `'${valueName}', accessed within '${methodName}', is invalid, null, or undefined '${Converter.toString(value)}'.`,
    );
  }

  return value;
};

/**
 * Validates that an environment variable is not invalid or `undefined` and throws an `TypeError` if this condition is not met.
 * @param variableName The name of the environment variable.
 * @param methodName The name of the calling method, for messaging purposes.
 * @returns The validated value.
 */
export const validateVariable = (
  variableName: string,
  methodName: string,
): string => {
  const value: string | undefined = process.env[variableName];
  return validateString(value, variableName, methodName);
};

/**
 * Validates that a number value is not invalid, `null`, or `undefined` and throws an `TypeError` if this condition is not met.
 * @param value The value to validate.
 * @param valueName The name of the value, for messaging purposes.
 * @param methodName The name of the calling method, for messaging purposes.
 * @returns The validated value.
 */
export const validateNumber = (
  value: number | null | undefined,
  valueName: string,
  methodName: string,
): number => {
  if (
    value === null ||
    typeof value === "undefined" ||
    value === 0 ||
    isNaN(value)
  ) {
    throw new TypeError(
      `'${valueName}', accessed within '${methodName}', is invalid, null, or undefined '${Converter.toString(value)}'.`,
    );
  }

  return value;
};

/**
 * Validates that a string value is a valid GUID and throws a `TypeError` if this condition is not met.
 * @param value The value to validate.
 * @param valueName The name of the value, for messaging purposes.
 * @param methodName The name of the calling method, for messaging purposes.
 */
export const validateGuid = (
  value: string,
  valueName: string,
  methodName: string,
): void => {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
      value,
    )
  ) {
    throw new TypeError(
      `'${valueName}', accessed within '${methodName}', is not a valid GUID '${value}'.`,
    );
  }
};
