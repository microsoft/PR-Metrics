/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

const objectIdLength = 40;

/**
 * The all zero object ID used by Git to denote a missing side of a change.
 */
export const emptyObjectId: string = "0".repeat(objectIdLength);

/**
 * An arbitrary object ID used to represent staged content.
 */
export const objectIdOne: string = "1".repeat(objectIdLength);

/**
 * A second arbitrary object ID used to represent staged content.
 */
export const objectIdTwo: string = "2".repeat(objectIdLength);

/**
 * A third arbitrary object ID used to represent staged content.
 */
export const objectIdThree: string = "3".repeat(objectIdLength);

/**
 * An arbitrary object ID used to represent the checked out commit.
 */
export const headObjectId: string = "f".repeat(objectIdLength);

/**
 * An arbitrary object ID used to represent a newly created commit.
 */
export const commitObjectId: string = "e".repeat(objectIdLength);

/**
 * Builds a single NUL delimited record in the raw output format of `git diff-index`.
 * @param metadata The metadata field, excluding the trailing NUL.
 * @param path The path field, which may contain arbitrary bytes.
 * @returns The bytes of the record.
 */
export const buildRecord = (metadata: string, path: Buffer | string): Buffer =>
  Buffer.concat([
    Buffer.from(`${metadata}\0`, "utf8"),
    typeof path === "string" ? Buffer.from(path, "utf8") : path,
    Buffer.from("\0", "utf8"),
  ]);

/**
 * Builds the raw output of `git diff-index` from a set of records.
 * @param records The records to concatenate.
 * @returns The bytes of the output.
 */
export const buildOutput = (records: readonly Buffer[]): Buffer =>
  Buffer.concat([...records]);

/**
 * Builds a record representing the addition of a regular file.
 * @param objectId The object ID of the staged blob.
 * @param path The path of the file.
 * @returns The bytes of the record.
 */
export const buildAddition = (
  objectId: string,
  path: Buffer | string,
): Buffer => buildRecord(`:000000 100644 ${emptyObjectId} ${objectId} A`, path);

/**
 * Builds a record representing the modification of a regular file.
 * @param objectId The object ID of the staged blob.
 * @param path The path of the file.
 * @returns The bytes of the record.
 */
export const buildModification = (
  objectId: string,
  path: Buffer | string,
): Buffer => buildRecord(`:100644 100644 ${objectIdOne} ${objectId} M`, path);

/**
 * Builds a record representing the deletion of a regular file.
 * @param path The path of the file.
 * @returns The bytes of the record.
 */
export const buildDeletion = (path: Buffer | string): Buffer =>
  buildRecord(`:100644 000000 ${objectIdOne} ${emptyObjectId} D`, path);
