/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ConsoleWrapper from "../../src/wrappers/consoleWrapper.js";
import assert from "node:assert/strict";

describe("consoleWrapper.ts", (): void => {
  let consoleLogCalls: unknown[][];
  let originalConsoleLog: typeof globalThis.console.log;
  const consoleObject: typeof globalThis.console = globalThis.console;

  beforeEach((): void => {
    consoleLogCalls = [];
    originalConsoleLog = consoleObject.log.bind(consoleObject);
    consoleObject.log = (...args: unknown[]): void => {
      consoleLogCalls.push(args);
    };
  });

  afterEach((): void => {
    consoleObject.log = originalConsoleLog;
  });

  it("should sanitize workflow commands across logical lines while preserving inline double colons and URLs", (): void => {
    // Arrange
    const consoleWrapper: ConsoleWrapper = new ConsoleWrapper();
    const message =
      "Heading\n  ::warning::First\r\nhttps://example.test/path::value\r##vso[::add-mask::secret";

    // Act
    consoleWrapper.log(message);

    // Assert
    assert.deepEqual(consoleLogCalls, [
      [
        "Heading   : :warning::First https://example.test/path::value : :add-mask::secret",
      ],
    ]);
  });

  it("should format optional parameters before sanitizing the combined message", (): void => {
    // Arrange
    const consoleWrapper: ConsoleWrapper = new ConsoleWrapper();

    // Act
    consoleWrapper.log("%s\r::stop-commands::token", "##[::warning::Value");

    // Assert
    assert.deepEqual(consoleLogCalls, [
      [": :warning::Value : :stop-commands::token"],
    ]);
  });

  it("should leave already-neutralized text unchanged", (): void => {
    // Arrange
    const consoleWrapper: ConsoleWrapper = new ConsoleWrapper();

    // Act
    consoleWrapper.log(": :warning::Value");

    // Assert
    assert.deepEqual(consoleLogCalls, [[": :warning::Value"]]);
  });
});
