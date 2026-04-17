/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

interface PendingChange {
  key: string;
  original: string | undefined;
}

const pending: PendingChange[] = [];

const unset = (key: string): void => {
  Reflect.deleteProperty(process.env, key);
};

/**
 * Sets one or more environment variables for the duration of the current test.
 * Any previous value is captured and restored automatically by a global
 * `afterEach` hook once the test completes.
 *
 * Pass `undefined` as a value to temporarily unset a variable. The helper
 * composes correctly with `process.env` assignments from `beforeEach` blocks,
 * restoring the state that existed before the `stubEnv` call.
 *
 * Tuple arguments are used so that POSIX-style uppercase environment variable
 * names can be expressed without triggering the camelCase naming convention
 * applied to object literal properties.
 * @param entries One or more `[name, value]` tuples.
 */
export const stubEnv = (
  ...entries: (readonly [string, string | undefined])[]
): void => {
  for (const [key, value] of entries) {
    pending.push({ key, original: process.env[key] });
    if (typeof value === "undefined") {
      unset(key);
    } else {
      process.env[key] = value;
    }
  }
};

afterEach((): void => {
  while (pending.length > 0) {
    const entry: PendingChange | undefined = pending.pop();
    if (typeof entry === "undefined") {
      break;
    }

    if (typeof entry.original === "undefined") {
      unset(entry.key);
    } else {
      process.env[entry.key] = entry.original;
    }
  }
});
