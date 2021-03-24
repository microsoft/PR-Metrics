// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Metrics from '../../updaters/metrics'
import { expect } from 'chai'

describe('metrics.ts', (): void => {
  describe('constructor()', (): void => {
    it('should throw when the product code is less than zero', (): void => {
      // Act
      const func: () => Metrics = () => new Metrics(-1, 0, 0)

      // Assert
      expect(func).to.throw('Product code \'-1\' must be >= 0.')
    })

    it('should throw when the test code is less than zero', (): void => {
      // Act
      const func: () => Metrics = () => new Metrics(0, -1, 0)

      // Assert
      expect(func).to.throw('Test code \'-1\' must be >= 0.')
    })

    it('should throw when the ignored code is less than zero', (): void => {
      // Act
      const func: () => Metrics = () => new Metrics(0, 0, -1)

      // Assert
      expect(func).to.throw('Ignored code \'-1\' must be >= 0.')
    })
  })

  describe('productCode, testCode, ignored, subtotal, total', (): void => {
    it('should return the values set in the constructor', (): void => {
      // Arrange
      const metrics: Metrics = new Metrics(1, 2, 4)

      // Act
      const productCode: number = metrics.productCode
      const testCode: number = metrics.testCode
      const subtotal: number = metrics.subtotal
      const ignoredCode: number = metrics.ignoredCode
      const total: number = metrics.total

      // Assert
      expect(productCode).to.equal(1)
      expect(testCode).to.equal(2)
      expect(subtotal).to.equal(3)
      expect(ignoredCode).to.equal(4)
      expect(total).to.equal(7)
    })
  })
})
