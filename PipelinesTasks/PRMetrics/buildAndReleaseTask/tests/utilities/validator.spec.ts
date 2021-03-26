// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import { Validator } from '../../utilities/validator'
import async from 'async'

describe('validator.ts', (): void => {
  describe('validateField', (): void => {
    async.each(
      [
        0,
        NaN,
        null,
        undefined
      ], (value: number | null | undefined): void => {
        it(`should throw an error when passed invalid number value '${value}'`, (): void => {
          // Act
          const func: () => void = () => Validator.validateField(value, 'number test', 'number test method name')

          // Assert
          expect(func).to.throw(`Field 'number test', accessed within 'number test method name', is invalid, null, or undefined '${value}'.`)
        })
      })

    async.each(
      [
        '',
        null,
        undefined
      ], (value: string | null | undefined): void => {
        it(`should throw an error when passed invalid string value '${value}'`, (): void => {
          // Act
          const func: () => void = () => Validator.validateField(value, 'string test', 'string test method name')

          // Assert
          expect(func).to.throw(`Field 'string test', accessed within 'string test method name', is invalid, null, or undefined '${value}'.`)
        })
      })

    async.each(
      [
        null,
        undefined
      ], (value: string[] | null | undefined): void => {
        it(`should throw an error when passed invalid string array value '${value}'`, (): void => {
          // Act
          const func: () => void = () => Validator.validateField(value, 'string array test', 'string array test method name')

          // Assert
          expect(func).to.throw(`Field 'string array test', accessed within 'string array test method name', is invalid, null, or undefined '${value}'.`)
        })
      })

    async.each(
      [
        null,
        undefined
      ], (value: object | null | undefined): void => {
        it(`should throw an error when passed invalid object value '${value}'`, (): void => {
          // Act
          const func: () => void = () => Validator.validateField(value, 'object test', 'object test method name')

          // Assert
          expect(func).to.throw(`Field 'object test', accessed within 'object test method name', is invalid, null, or undefined '${value}'.`)
        })
      })

    it('should not throw an error when passed a valid number value', (): void => {
      // Act
      const result: number = Validator.validateField(1, 'number test', 'number test method name')

      // Assert
      expect(result).to.equal(1)
    })

    it('should not throw an error when passed a valid string value', (): void => {
      // Act
      const result: string = Validator.validateField('value', 'string test', 'string test method name')

      // Assert
      expect(result).to.equal('value')
    })

    it('should not throw an error when passed a valid string array value', (): void => {
      // Act
      const result: string[] = Validator.validateField([], 'string array test', 'string array test method name')

      // Assert
      expect(result).to.deep.equal([])
    })

    it('should not throw an error when passed a valid object value', (): void => {
      // Act
      const result: object = Validator.validateField({}, 'object test', 'object test method name')

      // Assert
      expect(result).to.deep.equal({})
    })
  })
})
