/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Converter from "../../src/utilities/converter.js";
import * as fc from "fast-check";
import assert from "node:assert/strict";

describe("converter.ts", (): void => {
  describe("Property-Based Tests", (): void => {
    describe("toString()", (): void => {
      it("should return 'null' for null input", (): void => {
        assert.equal(Converter.toString(null), "null");
      });

      it("should return 'undefined' for undefined input", (): void => {
        assert.equal(Converter.toString(undefined), "undefined");
      });

      it("should return the string representation for any string", (): void => {
        fc.assert(
          fc.property(fc.string(), (value: string) => {
            assert.equal(Converter.toString(value), value);
          }),
        );
      });

      it("should return the string representation for any integer", (): void => {
        fc.assert(
          fc.property(fc.integer(), (value: number) => {
            assert.equal(Converter.toString(value), String(value));
          }),
        );
      });

      it("should return the string representation for any float", (): void => {
        fc.assert(
          fc.property(
            fc.float({ noDefaultInfinity: true, noNaN: true }),
            (value: number) => {
              assert.equal(Converter.toString(value), String(value));
            },
          ),
        );
      });

      it("should return the string representation for any boolean", (): void => {
        fc.assert(
          fc.property(fc.boolean(), (value: boolean) => {
            assert.equal(Converter.toString(value), String(value));
          }),
        );
      });

      it("should be idempotent for string values", (): void => {
        fc.assert(
          fc.property(fc.string(), (value: string) => {
            const firstCall: string = Converter.toString(value);
            const secondCall: string = Converter.toString(firstCall);
            assert.equal(firstCall, secondCall);
          }),
        );
      });

      it("should never return null or undefined as actual values", (): void => {
        fc.assert(
          fc.property(
            fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
            (value: string | number | boolean | null | undefined) => {
              const result: string = Converter.toString(value);
              assert.notEqual(result, null);
              assert.notEqual(typeof result, "undefined");
              assert.equal(typeof result, "string");
            },
          ),
        );
      });

      it("should handle objects with custom toString methods", (): void => {
        fc.assert(
          fc.property(fc.string(), (customValue: string) => {
            const obj = {
              toString: (): string => customValue,
            };
            assert.equal(Converter.toString(obj), customValue);
          }),
        );
      });
    });
  });
});
