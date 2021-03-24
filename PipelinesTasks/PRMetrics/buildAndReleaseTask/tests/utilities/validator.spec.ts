// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import async from 'async'
import { expect } from 'chai'
import { validator } from '../../utilities/validator'

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
          const func: () => void = () => validator.validateField(value, 'number test')

          // Assert
          expect(func).to.throw(`Field 'number test' is invalid, null, or undefined '${value}'.`)
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
          const func: () => void = () => validator.validateField(value, 'string test')

          // Assert
          expect(func).to.throw(`Field 'string test' is invalid, null, or undefined '${value}'.`)
        })
      })

    async.each(
      [
        null,
        undefined
      ], (value: string[] | null | undefined): void => {
        it(`should throw an error when passed invalid string array value '${value}'`, (): void => {
          // Act
          const func: () => void = () => validator.validateField(value, 'string array test')

          // Assert
          expect(func).to.throw(`Field 'string array test' is invalid, null, or undefined '${value}'.`)
        })
      })

    async.each(
      [
        null,
        undefined
      ], (value: object | null | undefined): void => {
        it(`should throw an error when passed invalid object value '${value}'`, (): void => {
          // Act
          const func: () => void = () => validator.validateField(value, 'object test')

          // Assert
          expect(func).to.throw(`Field 'object test' is invalid, null, or undefined '${value}'.`)
        })
      })

    it('should not throw an error when passed a valid number value', (): void => {
      // Act
      const func: () => void = () => validator.validateField(1, 'number test')

      // Assert
      expect(func).not.to.throw()
    })

    it('should not throw an error when passed a valid string value', (): void => {
      // Act
      const func: () => void = () => validator.validateField('value', 'string test')

      // Assert
      expect(func).not.to.throw()
    })

    it('should not throw an error when passed a valid string array value', (): void => {
      // Act
      const func: () => void = () => validator.validateField([], 'string array test')

      // Assert
      expect(func).not.to.throw()
    })

    it('should not throw an error when passed a valid object value', (): void => {
      // Act
      const func: () => void = () => validator.validateField({}, 'object test')

      // Assert
      expect(func).not.to.throw()
    })
  })
})
