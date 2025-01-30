/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Converter from "../../src/utilities/converter.mjs";
import assert from "node:assert/strict";

describe("converter.ts", (): void => {
  describe("toString()", (): void => {
    interface TestCaseType {
      input: string | number | boolean | null | undefined;
      output: string;
    }

    const testCases: TestCaseType[] = [
      {
        input: 0,
        output: "0",
      },
      {
        input: NaN,
        output: "NaN",
      },
      {
        input: true,
        output: "true",
      },
      {
        input: "",
        output: "",
      },
      {
        input: "string",
        output: "string",
      },
      {
        input: null,
        output: "null",
      },
      {
        input: undefined,
        output: "undefined",
      },
    ];

    testCases.forEach(({ input, output }: TestCaseType): void => {
      it(`should return '${output}' when passed '${Converter.toString(input)}'`, (): void => {
        // Act
        const result: string = Converter.toString(input);

        // Assert
        assert.equal(result, output);
      });
    });
  });
});
