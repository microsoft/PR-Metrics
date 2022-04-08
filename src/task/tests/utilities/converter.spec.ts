// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import * as Converter from '../../src/utilities/converter'

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
        expect(result).to.equal(expected)
      })
    })
  })
})
