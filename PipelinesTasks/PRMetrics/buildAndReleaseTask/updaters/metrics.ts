// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A class representing code metrics.
 */
class Metrics {
  private readonly _productCode: number;
  private readonly _testCode: number;
  private readonly _ignoredCode: number;

  /**
   * Initializes a new instance of the `Metrics` class.
   * @param productCode The number of lines of product code.
   * @param testCode The number of lines of test code.
   * @param ignoredCode The number of lines of ignored code.
   */
  public constructor (productCode: number, testCode: number, ignoredCode: number) {
    if (productCode < 0) {
      throw new Error(`Product code '${productCode}' must be >= 0.`)
    }

    if (testCode < 0) {
      throw new Error(`Test code '${testCode}' must be >= 0.`)
    }

    if (ignoredCode < 0) {
      throw new Error(`Ignored code '${ignoredCode}' must be >= 0.`)
    }

    this._productCode = productCode
    this._testCode = testCode
    this._ignoredCode = ignoredCode
  }

  /**
   * Gets the number of lines of product code.
   * @returns The number of lines of product code.
   */
  public get productCode (): number {
    return this._productCode
  }

  /**
   * Gets the number of lines of test code.
   * @returns The number of lines of test code.
   */
  public get testCode (): number {
    return this._testCode
  }

  /**
   * Gets the number of lines of ignored code.
   * @returns The number of lines of ignored code.
   */
  public get ignoredCode (): number {
    return this._ignoredCode
  }

  /**
   * Gets the subtotal number of lines of code, comprising the number of lines of product and test code.
   * @returns The subtotal number of lines of code.
   */
  public get subtotal (): number {
    return this.productCode + this.testCode
  }

  /**
   * Gets the total number of lines of code, comprising the number of lines of product, test and ignored code.
   * @returns The total number of lines of code.
   */
  public get total (): number {
    return this.subtotal + this.ignoredCode
  }
}

export default Metrics
