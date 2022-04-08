// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { instance } from 'ts-mockito'
import ResolvableInstanceTarget from './resolvableInstanceTarget'

/**
 * Gets a resolvable instance of the specified mock object.
 * @typeParam Type The type of the mock object.
 * @param mock The mock object to resolve.
 * @returns The resolvable instance.
 */
export function resolvableInstance<Type extends {}> (mock: Type): Type {
  return new Proxy<Type>(instance(mock), {
    get (target: Type, name: string): Type | undefined {
      if (['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(name)) {
        return undefined
      }

      return (target as ResolvableInstanceTarget<Type>)[name]
    }
  })
}
