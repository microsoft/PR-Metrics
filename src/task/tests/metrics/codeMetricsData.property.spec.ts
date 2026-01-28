/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fc from "fast-check";
import CodeMetricsData from "../../src/metrics/codeMetricsData.js";
import assert from "node:assert/strict";

describe("codeMetricsData.ts", (): void => {
  describe("Property-Based Tests", (): void => {
    describe("constructor()", (): void => {
      it("should accept any combination of non-negative integers", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              assert.equal(data.productCode, productCode);
              assert.equal(data.testCode, testCode);
              assert.equal(data.ignoredCode, ignoredCode);
            },
          ),
        );
      });

      it("should reject negative productCode values", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.integer({ max: -1 }),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              assert.throws(
                () => new CodeMetricsData(productCode, testCode, ignoredCode),
                RangeError,
              );
            },
          ),
        );
      });

      it("should reject negative testCode values", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.integer({ max: -1 }),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              assert.throws(
                () => new CodeMetricsData(productCode, testCode, ignoredCode),
                RangeError,
              );
            },
          ),
        );
      });

      it("should reject negative ignoredCode values", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.integer({ max: -1 }),
            (productCode: number, testCode: number, ignoredCode: number) => {
              assert.throws(
                () => new CodeMetricsData(productCode, testCode, ignoredCode),
                RangeError,
              );
            },
          ),
        );
      });
    });

    describe("subtotal", (): void => {
      it("should always equal productCode + testCode", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              assert.equal(data.subtotal, productCode + testCode);
            },
          ),
        );
      });

      it("should be commutative with respect to productCode and testCode", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data1: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              const data2: CodeMetricsData = new CodeMetricsData(
                testCode,
                productCode,
                ignoredCode,
              );
              assert.equal(data1.subtotal, data2.subtotal);
            },
          ),
        );
      });
    });

    describe("total", (): void => {
      it("should always equal productCode + testCode + ignoredCode", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              assert.equal(data.total, productCode + testCode + ignoredCode);
            },
          ),
        );
      });

      it("should always equal subtotal + ignoredCode", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              assert.equal(data.total, data.subtotal + data.ignoredCode);
            },
          ),
        );
      });

      it("should be >= subtotal", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              assert.ok(data.total >= data.subtotal);
            },
          ),
        );
      });
    });

    describe("invariants", (): void => {
      it("should maintain consistent values across multiple reads", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              const firstProductCode: number = data.productCode;
              const firstTestCode: number = data.testCode;
              const firstIgnoredCode: number = data.ignoredCode;
              const firstSubtotal: number = data.subtotal;
              const firstTotal: number = data.total;
              assert.equal(data.productCode, firstProductCode);
              assert.equal(data.testCode, firstTestCode);
              assert.equal(data.ignoredCode, firstIgnoredCode);
              assert.equal(data.subtotal, firstSubtotal);
              assert.equal(data.total, firstTotal);
            },
          ),
        );
      });

      it("should have total >= each individual component", (): void => {
        // ARRANGE, ACT, ASSERT
        fc.assert(
          fc.property(
            fc.nat(),
            fc.nat(),
            fc.nat(),
            (productCode: number, testCode: number, ignoredCode: number) => {
              const data: CodeMetricsData = new CodeMetricsData(
                productCode,
                testCode,
                ignoredCode,
              );
              assert.ok(data.total >= data.productCode);
              assert.ok(data.total >= data.testCode);
              assert.ok(data.total >= data.ignoredCode);
            },
          ),
        );
      });
    });
  });
});
