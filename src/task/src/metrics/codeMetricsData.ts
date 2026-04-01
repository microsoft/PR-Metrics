/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * A class representing code metrics data.
 */
export default class CodeMetricsData {
  public readonly productCode: number;
  public readonly testCode: number;
  public readonly ignoredCode: number;

  /**
   * Initializes a new instance of the `CodeMetricsData` class.
   * @param productCode The number of lines of product code.
   * @param testCode The number of lines of test code.
   * @param ignoredCode The number of lines of ignored code.
   */
  public constructor(
    productCode: number,
    testCode: number,
    ignoredCode: number,
  ) {
    if (productCode < 0) {
      throw new RangeError(
        `Product code '${String(productCode)}' must be >= 0.`,
      );
    }

    if (testCode < 0) {
      throw new RangeError(`Test code '${String(testCode)}' must be >= 0.`);
    }

    if (ignoredCode < 0) {
      throw new RangeError(
        `Ignored code '${String(ignoredCode)}' must be >= 0.`,
      );
    }

    this.productCode = productCode;
    this.testCode = testCode;
    this.ignoredCode = ignoredCode;
  }

  /**
   * Gets the subtotal number of lines of code, comprising the number of lines of product and test code.
   * @returns The subtotal number of lines of code.
   */
  public get subtotal(): number {
    return this.productCode + this.testCode;
  }

  /**
   * Gets the total number of lines of code, comprising the number of lines of product, test and ignored code.
   * @returns The total number of lines of code.
   */
  public get total(): number {
    return this.subtotal + this.ignoredCode;
  }
}
