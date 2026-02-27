/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Converter from "../../src/utilities/converter.js";
import * as Validator from "../../src/utilities/validator.js";
import assert from "node:assert/strict";

describe("validator.ts", (): void => {
  describe("validateString()", (): void => {
    {
      const testCases: (string | null | undefined)[] = ["", null, undefined];

      testCases.forEach((value: string | null | undefined): void => {
        it(`should throw an error when passed invalid string value '${Converter.toString(value)}'`, (): void => {
          // Act
          const func: () => void = () =>
            Validator.validateString(
              value,
              "string test",
              "string test method name",
            );

          // Assert
          assert.throws(
            func,
            new TypeError(
              `'string test', accessed within 'string test method name', is invalid, null, or undefined '${Converter.toString(value)}'.`,
            ),
          );
        });
      });
    }

    it("should not throw an error when passed a valid string value", (): void => {
      // Act
      const result: string = Validator.validateString(
        "value",
        "string test",
        "string test method name",
      );

      // Assert
      assert.equal(result, "value");
    });
  });

  describe("validateVariable()", (): void => {
    {
      const testCases: (string | undefined)[] = ["", undefined];

      testCases.forEach((value: string | undefined): void => {
        it(`should throw an error when passed invalid string value '${Converter.toString(value)}'`, (): void => {
          // Arrange
          if (typeof value === "undefined") {
            delete process.env.TEST_VARIABLE;
          } else {
            process.env.TEST_VARIABLE = value;
          }

          // Act
          const func: () => void = () =>
            Validator.validateVariable(
              "TEST_VARIABLE",
              "string test method name",
            );

          // Assert
          assert.throws(
            func,
            new TypeError(
              `'TEST_VARIABLE', accessed within 'string test method name', is invalid, null, or undefined '${Converter.toString(value)}'.`,
            ),
          );

          // Finalization
          delete process.env.TEST_VARIABLE;
        });
      });
    }

    it("should not throw an error when passed a valid string value", (): void => {
      // Arrange
      process.env.TEST_VARIABLE = "value";

      // Act
      const result: string = Validator.validateVariable(
        "TEST_VARIABLE",
        "string test method name",
      );

      // Assert
      assert.equal(result, "value");

      // Finalization
      delete process.env.TEST_VARIABLE;
    });
  });

  describe("validateNumber()", (): void => {
    {
      const testCases: (number | null | undefined)[] = [
        0,
        NaN,
        null,
        undefined,
      ];

      testCases.forEach((value: number | null | undefined): void => {
        it(`should throw an error when passed invalid number value '${Converter.toString(value)}'`, (): void => {
          // Act
          const func: () => void = () =>
            Validator.validateNumber(
              value,
              "number test",
              "number test method name",
            );

          // Assert
          assert.throws(
            func,
            new TypeError(
              `'number test', accessed within 'number test method name', is invalid, null, or undefined '${Converter.toString(value)}'.`,
            ),
          );
        });
      });
    }

    it("should not throw an error when passed a valid number value", (): void => {
      // Act
      const result: number = Validator.validateNumber(
        1,
        "number test",
        "number test method name",
      );

      // Assert
      assert.equal(result, 1);
    });
  });

  describe("validateGuid()", (): void => {
    {
      const testCases: string[] = [
        "",
        "not-a-guid",
        "12345678",
        "12345678-1234-1234-1234",
        "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
      ];

      testCases.forEach((value: string): void => {
        it(`should throw an error when passed invalid GUID value '${value}'`, (): void => {
          // Act
          const func: () => void = () =>
            Validator.validateGuid(
              value,
              "guid test",
              "guid test method name",
            );

          // Assert
          assert.throws(
            func,
            new TypeError(
              `'guid test', accessed within 'guid test method name', is not a valid GUID '${value}'.`,
            ),
          );
        });
      });
    }

    it("should not throw an error when passed a valid lowercase GUID", (): void => {
      // Act & Assert
      Validator.validateGuid(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "guid test",
        "guid test method name",
      );
    });

    it("should not throw an error when passed a valid uppercase GUID", (): void => {
      // Act & Assert
      Validator.validateGuid(
        "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
        "guid test",
        "guid test method name",
      );
    });
  });
});
