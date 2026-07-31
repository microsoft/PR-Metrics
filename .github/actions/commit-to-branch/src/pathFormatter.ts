/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * Formats a path for inclusion in log output, so that hostile file names can never inject workflow commands.
 * @param path The path to format.
 * @returns The quoted path, with all control characters escaped.
 */
export const formatPath = (path: string): string => JSON.stringify(path);
