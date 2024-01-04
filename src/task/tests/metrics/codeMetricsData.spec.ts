// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import assert from 'node:assert/strict'
import CodeMetricsData from '../../src/metrics/codeMetricsData'

describe('codeMetricsData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should throw when the product code is less than zero', (): void => {
      // Act
      const func: () => CodeMetricsData = () => new CodeMetricsData(-1, 0, 0)

      // Assert
      assert.throws(func, RangeError('Product code \'-1\' must be >= 0.'))
    })

    it('should throw when the test code is less than zero', (): void => {
      // Act
      const func: () => CodeMetricsData = () => new CodeMetricsData(0, -1, 0)

      // Assert
      assert.throws(func, RangeError('Test code \'-1\' must be >= 0.'))
    })

    it('should throw when the ignored code is less than zero', (): void => {
      // Act
      const func: () => CodeMetricsData = () => new CodeMetricsData(0, 0, -1)

      // Assert
      assert.throws(func, RangeError('Ignored code \'-1\' must be >= 0.'))
    })
  })

  describe('productCode, testCode, ignored, subtotal, total', (): void => {
    it('should return the values set in the constructor', (): void => {
      // Arrange
      const codeMetricsData: CodeMetricsData = new CodeMetricsData(1, 2, 4)

      // Act
      const productCode: number = codeMetricsData.productCode
      const testCode: number = codeMetricsData.testCode
      const subtotal: number = codeMetricsData.subtotal
      const ignoredCode: number = codeMetricsData.ignoredCode
      const total: number = codeMetricsData.total

      // Assert
      assert.equal(productCode, 1)
      assert.equal(testCode, 2)
      assert.equal(subtotal, 3)
      assert.equal(ignoredCode, 4)
      assert.equal(total, 7)
    })
  })
})
