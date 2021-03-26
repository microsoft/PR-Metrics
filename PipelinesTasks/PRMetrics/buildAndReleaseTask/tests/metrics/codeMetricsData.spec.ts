// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import CodeMetricsData from '../../metrics/codeMetricsData'

describe('codeMetricsData.ts', (): void => {
  describe('constructor()', (): void => {
    it('should throw when the product code is less than zero', (): void => {
      // Act
      const func: () => CodeMetricsData = () => new CodeMetricsData(-1, 0, 0)

      // Assert
      expect(func).to.throw('Product code \'-1\' must be >= 0.')
    })

    it('should throw when the test code is less than zero', (): void => {
      // Act
      const func: () => CodeMetricsData = () => new CodeMetricsData(0, -1, 0)

      // Assert
      expect(func).to.throw('Test code \'-1\' must be >= 0.')
    })

    it('should throw when the ignored code is less than zero', (): void => {
      // Act
      const func: () => CodeMetricsData = () => new CodeMetricsData(0, 0, -1)

      // Assert
      expect(func).to.throw('Ignored code \'-1\' must be >= 0.')
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
      expect(productCode).to.equal(1)
      expect(testCode).to.equal(2)
      expect(subtotal).to.equal(3)
      expect(ignoredCode).to.equal(4)
      expect(total).to.equal(7)
    })
  })
})
