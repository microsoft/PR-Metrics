/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ResolvableInstanceTarget from "./resolvableInstanceTarget";
import { instance } from "ts-mockito";

/**
 * Gets a resolvable instance of the specified mock object.
 * @typeParam Type The type of the mock object.
 * @param mock The mock object to resolve.
 * @returns The resolvable instance.
 */
export const resolvableInstance = <Type extends NonNullable<unknown>>(
  mock: Type,
): Type =>
  new Proxy<Type>(instance(mock), {
    get(target: Type, name: string): Type | undefined {
      if (["Symbol(Symbol.toPrimitive)", "then", "catch"].includes(name)) {
        return undefined;
      }

      return (target as ResolvableInstanceTarget<Type>)[name];
    },
  });
