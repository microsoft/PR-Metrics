/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ResolvableInstanceTarget from './resolvableInstanceTarget'
import { instance } from 'ts-mockito'

/**
 * Gets a resolvable instance of the specified mock object.
 * @typeParam Type The type of the mock object.
 * @param mock The mock object to resolve.
 * @returns The resolvable instance.
 */
export const resolvableInstance = <Mock extends NonNullable<unknown>> (mock: Mock): Mock => new Proxy<Mock>(instance(mock), {
    get (target: Mock, name: string): Mock | undefined {
      if (['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(name)) {
        return undefined
      }

      return (target as ResolvableInstanceTarget<Mock>)[name]
    }
  })
