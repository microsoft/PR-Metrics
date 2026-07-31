/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The exact argument vector used to stage all working tree changes.
 */
export const stageAllArgs: readonly string[] = ["add", "-A"];

/**
 * The exact argument vector used to resolve the checked out commit.
 */
export const headArgs: readonly string[] = ["rev-parse", "HEAD"];

/**
 * The exact argument vector used to read the staged changes.
 */
export const stagedChangesArgs: readonly string[] = [
  "-c",
  "core.quotePath=false",
  "diff-index",
  "--cached",
  "--no-renames",
  "-z",
  "HEAD",
  "--",
];

/**
 * Builds the exact argument vector used to read a blob from the object store.
 * @param objectId The object ID of the blob.
 * @returns The argument vector.
 */
export const blobArgs = (objectId: string): readonly string[] => [
  "cat-file",
  "blob",
  objectId,
];
