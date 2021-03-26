// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { instance } from 'ts-mockito'

interface ResolvableInstanceTarget<T> {
  [name: string]: T
}

/**
 * Gets a resolvable instance of the specified mock object.
 * @typeParam T The type of the mock object.
 * @param mock The mock object to resolve.
 * @returns The resolvable instance.
 */
export function resolvableInstance<T extends {}> (mock: T): T {
  return new Proxy<T>(instance(mock), {
    get (target: T, name: string): T | undefined {
      if (['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(name)) {
        return undefined
      }

      return (target as ResolvableInstanceTarget<T>)[name]
    }
  })
}
