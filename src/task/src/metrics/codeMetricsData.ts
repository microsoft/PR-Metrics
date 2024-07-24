/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * A class representing code metrics data.
 */
export default class CodeMetricsData {
  private readonly productCodeInternal: number
  private readonly testCodeInternal: number
  private readonly ignoredCodeInternal: number

  /**
   * Initializes a new instance of the `CodeMetricsData` class.
   * @param productCode The number of lines of product code.
   * @param testCode The number of lines of test code.
   * @param ignoredCode The number of lines of ignored code.
   */
  public constructor (productCode: number, testCode: number, ignoredCode: number) {
    if (productCode < 0) {
      throw new RangeError(`Product code '${productCode.toString()}' must be >= 0.`)
    }

    if (testCode < 0) {
      throw new RangeError(`Test code '${testCode.toString()}' must be >= 0.`)
    }

    if (ignoredCode < 0) {
      throw new RangeError(`Ignored code '${ignoredCode.toString()}' must be >= 0.`)
    }

    this.productCodeInternal = productCode
    this.testCodeInternal = testCode
    this.ignoredCodeInternal = ignoredCode
  }

  /**
   * Gets the number of lines of product code.
   * @returns The number of lines of product code.
   */
  public get productCode (): number {
    return this.productCodeInternal
  }

  /**
   * Gets the number of lines of test code.
   * @returns The number of lines of test code.
   */
  public get testCode (): number {
    return this.testCodeInternal
  }

  /**
   * Gets the number of lines of ignored code.
   * @returns The number of lines of ignored code.
   */
  public get ignoredCode (): number {
    return this.ignoredCodeInternal
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
