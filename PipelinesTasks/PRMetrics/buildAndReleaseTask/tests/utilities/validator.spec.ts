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
  })
})
