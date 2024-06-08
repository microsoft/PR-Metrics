/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Converter from '../../src/utilities/converter'
import assert from 'node:assert/strict'

describe('converter.ts', (): void => {
  describe('toString()', (): void => {
    interface TestCaseType {
      value: any | null | undefined
      expected: string
    }

    const testCases: TestCaseType[] = [
      {
        value: 0,
        expected: '0'
      },
      {
        value: NaN,
        expected: 'NaN'
      },
      {
        value: true,
        expected: 'true'
      },
      {
        value: '',
        expected: ''
      },
      {
        value: 'string',
        expected: 'string'
      },
      {
        value: null,
        expected: 'null'
      },
      {
        value: undefined,
        expected: 'undefined'
      }
    ]

    testCases.forEach(({ value, expected }: TestCaseType): void => {
      it(`should return '${expected}' when passed '${Converter.toString(value)}'`, (): void => {
        // Act
        const result: string = Converter.toString(value)

        // Assert
        assert.equal(result, expected)
      })
    })
  })
})
