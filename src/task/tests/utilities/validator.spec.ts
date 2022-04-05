// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import { Validator } from '../../src/utilities/validator'
import async from 'async'

describe('validator.ts', (): void => {
  describe('validateVariable()', (): void => {
    [
      '',
      undefined
    ].forEach((value: string | undefined): void => {
      it(`should throw an error when passed invalid string value '${value}'`, (): void => {
        // Arrange
        if (value === undefined) {
          delete process.env.TEST_VARIABLE
        } else {
          process.env.TEST_VARIABLE = value
        }

        // Act
        const func: () => void = () => Validator.validateVariable('TEST_VARIABLE', 'string test method name')

        // Assert
        expect(func).to.throw(`'TEST_VARIABLE', accessed within 'string test method name', is invalid, null, or undefined '${value}'.`)

        // Finalization
        delete process.env.TEST_VARIABLE
      })
    })

    it('should not throw an error when passed a valid string value', (): void => {
      // Arrange
      process.env.TEST_VARIABLE = 'value'

      // Act
      const result: string = Validator.validateVariable('TEST_VARIABLE', 'string test method name')

      // Assert
      expect(result).to.equal('value')

      // Finalization
      delete process.env.TEST_VARIABLE
    })
  })

  describe('validateString()', (): void => {
    async.each(
      [
        '',
        null,
        undefined
      ], (value: string | null | undefined): void => {
        it(`should throw an error when passed invalid string value '${value}'`, (): void => {
          // Act
          const func: () => void = () => Validator.validateString(value, 'string test', 'string test method name')

          // Assert
          expect(func).to.throw(`'string test', accessed within 'string test method name', is invalid, null, or undefined '${value}'.`)
        })
      })

    it('should not throw an error when passed a valid string value', (): void => {
      // Act
      const result: string = Validator.validateString('value', 'string test', 'string test method name')

      // Assert
      expect(result).to.equal('value')
    })
  })

  describe('validateNumber()', (): void => {
    async.each(
      [
        0,
        NaN,
        null,
        undefined
      ], (value: number | null | undefined): void => {
        it(`should throw an error when passed invalid number value '${value}'`, (): void => {
          // Act
          const func: () => void = () => Validator.validateNumber(value, 'number test', 'number test method name')

          // Assert
          expect(func).to.throw(`'number test', accessed within 'number test method name', is invalid, null, or undefined '${value}'.`)
        })
      })

    it('should not throw an error when passed a valid number value', (): void => {
      // Act
      const result: number = Validator.validateNumber(1, 'number test', 'number test method name')

      // Assert
      expect(result).to.equal(1)
    })
  })
})
