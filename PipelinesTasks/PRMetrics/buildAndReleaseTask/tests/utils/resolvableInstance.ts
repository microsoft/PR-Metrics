// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { instance } from "ts-mockito";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/ban-types
export const resolvableInstance = <T extends {}>(mock: T) => new Proxy<T>(instance(mock), {
  get(target, name: PropertyKey) {
    if (["Symbol(Symbol.toPrimitive)", "then", "catch"].includes(name.toString())) {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target as any)[name];
  },
});