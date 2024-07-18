/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Converter from '../../src/utilities/converter'
import assert from 'node:assert/strict'

describe('converter.ts', (): void => {
  describe('toString()', (): void => {
    interface TestCaseType {
      input: number | boolean | string | null | undefined
      outputExpected: string
    }

    const testCases: TestCaseType[] = [
      {
        input: 0,
        outputExpected: '0',
      },
      {
        input: NaN,
        outputExpected: 'NaN',
      },
      {
        input: true,
        outputExpected: 'true',
      },
      {
        input: '',
        outputExpected: '',
      },
      {
        input: 'string',
        outputExpected: 'string',
      },
      {
        input: null,
        outputExpected: 'null',
      },
      {
        input: undefined,
        outputExpected: 'undefined',
      },
    ]

    testCases.forEach(({ input, outputExpected }: TestCaseType): void => {
      it(`should return '${outputExpected}' when passed '${Converter.toString(input)}'`, (): void => {
        // Act
        const result: string = Converter.toString(input)

        // Assert
        assert.equal(result, outputExpected)
      })
    })
  })
})
