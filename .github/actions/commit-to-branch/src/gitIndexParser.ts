/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type StagedChangeInterface from "./interfaces/stagedChangeInterface.js";
import { formatPath } from "./pathFormatter.js";

const fieldsPerRecord = 2;
const nulCharacter = 0;
const metadataExpression =
  /^:(?<sourceMode>\d{6}) (?<destinationMode>\d{6}) (?<sourceObjectId>(?:[0-9a-f]{40}|[0-9a-f]{64})) (?<destinationObjectId>(?:[0-9a-f]{40}|[0-9a-f]{64})) (?<status>[A-Z]\d*)$/u;
const emptyObjectIdExpression = /^0+$/u;
const regularFileModes: string[] = ["100644"];
const additionStatuses: string[] = ["A", "M"];
const deletionStatus = "D";
const unmergedStatus = "U";
const decoder = new TextDecoder("utf-8", {
  fatal: true,
  ignoreBOM: true,
});

const splitOnNul = (output: Buffer): Buffer[] => {
  const result: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < output.length; index += 1) {
    if (output[index] === nulCharacter) {
      result.push(output.subarray(start, index));
      start = index + 1;
    }
  }

  return result;
};

const decodePath = (field: Buffer): string => {
  let path: string;
  try {
    path = decoder.decode(field);
  } catch {
    throw new Error("The Git index contains a path that is not valid UTF-8.");
  }

  if (path === "") {
    throw new Error("The Git index contains a record with an empty path.");
  }

  return path;
};

const parseRecord = (
  metadataField: Buffer,
  pathField: Buffer,
): StagedChangeInterface => {
  const metadata: string = metadataField.toString("utf8");
  const path: string = decodePath(pathField);
  const groups: Partial<Record<string, string>> | undefined =
    metadataExpression.exec(metadata)?.groups;
  if (typeof groups === "undefined") {
    throw new Error(
      `The Git index record ${formatPath(metadata)} could not be parsed.`,
    );
  }

  const status: string = groups.status ?? "";
  if (status === unmergedStatus) {
    throw new Error(
      `The Git index contains the unmerged entry ${formatPath(path)}.`,
    );
  }

  const isDeletion: boolean = status === deletionStatus;
  if (!isDeletion && !additionStatuses.includes(status)) {
    throw new Error(
      `The Git index record for ${formatPath(path)} uses the unsupported change type '${status}'.`,
    );
  }

  const mode: string =
    (isDeletion ? groups.sourceMode : groups.destinationMode) ?? "";
  if (!regularFileModes.includes(mode)) {
    throw new Error(
      `The Git index record for ${formatPath(path)} uses the unsupported file mode '${mode}'.`,
    );
  }

  if (isDeletion) {
    return { objectId: null, path };
  }

  const objectId: string = groups.destinationObjectId ?? "";
  if (emptyObjectIdExpression.test(objectId)) {
    throw new Error(
      `The Git index record for ${formatPath(path)} has no staged object ID.`,
    );
  }

  return { objectId, path };
};

/**
 * Parses the raw, NUL delimited output of `git diff-index --cached -z --no-renames HEAD`. Paths are never split on
 * whitespace or newlines, and are never interpreted as anything other than data.
 * @param output The raw bytes written to standard output by Git.
 * @returns The staged changes.
 */
export const parseStagedChanges = (output: Buffer): StagedChangeInterface[] => {
  if (output.length === 0) {
    return [];
  }

  if (output[output.length - 1] !== nulCharacter) {
    throw new Error(
      "The Git index output is malformed as it does not end with a NUL character.",
    );
  }

  const fields: Buffer[] = splitOnNul(output);
  const result: StagedChangeInterface[] = [];
  const paths: Set<string> = new Set<string>();
  for (let index = 0; index < fields.length; index += fieldsPerRecord) {
    const metadataField: Buffer = fields[index] ?? Buffer.alloc(0);
    const pathField: Buffer | undefined = fields[index + 1];
    if (typeof pathField === "undefined") {
      throw new Error(
        `The Git index record ${formatPath(metadataField.toString("utf8"))} has no associated path.`,
      );
    }

    const change: StagedChangeInterface = parseRecord(metadataField, pathField);
    if (paths.has(change.path)) {
      throw new Error(
        `The Git index contains multiple records for the path ${formatPath(change.path)}.`,
      );
    }

    paths.add(change.path);
    result.push(change);
  }

  return result;
};
