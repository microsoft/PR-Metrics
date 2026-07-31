/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * Reads a value from a GraphQL response payload without ever assuming its shape.
 * @param source The payload from which to read.
 * @param path The property names to traverse.
 * @returns The value, or `null` when any element of the path is absent.
 */
export const readValue = (
  source: unknown,
  path: readonly string[],
): unknown => {
  let current: unknown = source;
  for (const key of path) {
    if (current === null || typeof current !== "object") {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current ?? null;
};

/**
 * Reads a string from a GraphQL response payload.
 * @param source The payload from which to read.
 * @param path The property names to traverse.
 * @returns The value.
 */
export const readString = (
  source: unknown,
  path: readonly string[],
): string => {
  const value: unknown = readValue(source, path);
  if (typeof value !== "string") {
    throw new Error(
      `The GitHub GraphQL API response did not include '${path.join(".")}'.`,
    );
  }

  return value;
};
