/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import assert from "node:assert/strict";
import { formatPath } from "../src/pathFormatter.js";

describe("pathFormatter.ts", (): void => {
  describe("formatPath()", (): void => {
    const testCases: string[][] = [
      ["dist/index.mjs", '"dist/index.mjs"'],
      ["with space.txt", '"with space.txt"'],
      ["with\nnewline.txt", '"with\\nnewline.txt"'],
      ["with\rcarriage-return.txt", '"with\\rcarriage-return.txt"'],
      ["with\ttab.txt", '"with\\ttab.txt"'],
      ['with"quote.txt', '"with\\"quote.txt"'],
      ["::error::injected", '"::error::injected"'],
      ["with\u0001control.txt", '"with\\u0001control.txt"'],
    ];

    testCases.forEach(([value, expected]: (string | undefined)[]): void => {
      it(`should format ${JSON.stringify(value)} without control characters`, (): void => {
        // Act
        const result: string = formatPath(value ?? "");

        // Assert
        assert.equal(result, expected);
        assert.equal(result.includes("\n"), false);
        assert.equal(result.includes("\r"), false);
      });
    });
  });
});
