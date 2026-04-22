/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as util from "node:util";
import type ResourcesJsonInterface from "../../src/jsonTypes/resourcesJsonInterface.js";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { anyString } from "./mockito.js";
import { when } from "ts-mockito";

const resourcePrefix = "loc.messages.";

let cachedResources: Map<string, string> | null = null;

const loadResources = (): Map<string, string> => {
  if (cachedResources !== null) {
    return cachedResources;
  }

  const resourcesPath: string = path.join(
    import.meta.dirname,
    "..",
    "..",
    "Strings",
    "resources.resjson",
    "en-US",
    "resources.resjson",
  );
  const raw: string = fs.readFileSync(resourcesPath, "utf8");
  const json: ResourcesJsonInterface = JSON.parse(
    raw,
  ) as ResourcesJsonInterface;

  const map: Map<string, string> = new Map<string, string>();
  for (const [key, value] of Object.entries(json)) {
    if (key.startsWith(resourcePrefix)) {
      map.set(key.substring(resourcePrefix.length), value);
    }
  }
  cachedResources = map;
  return map;
};

/**
 * Resolves a localization key against the real `resources.resjson` file and
 * applies parameter substitution via `util.format`. Tests use this to compute
 * expected `logger` assertions without duplicating English text from the
 * resource file.
 * @param key The localization key (without the `loc.messages.` prefix).
 * @param params The values to substitute into the template.
 * @returns The formatted string.
 */
export const localize = (key: string, ...params: string[]): string => {
  const template: string | undefined = loadResources().get(key);
  if (typeof template === "undefined") {
    throw new Error(`Unknown localization key: '${key}'.`);
  }

  return params.length > 0 ? util.format(template, ...params) : template;
};

/**
 * Wires the `loc()` method on a mocked `RunnerInvoker` to return values read
 * from the real `resources.resjson` file, with parameter substitution via
 * `util.format`.
 * @param runnerInvoker The mocked runner invoker.
 */
export const stubLocalization = (runnerInvoker: RunnerInvoker): void => {
  when(runnerInvoker.loc(anyString())).thenCall(localize);
  when(runnerInvoker.loc(anyString(), anyString())).thenCall(localize);
  when(runnerInvoker.loc(anyString(), anyString(), anyString())).thenCall(
    localize,
  );
  when(
    runnerInvoker.loc(anyString(), anyString(), anyString(), anyString()),
  ).thenCall(localize);
};
