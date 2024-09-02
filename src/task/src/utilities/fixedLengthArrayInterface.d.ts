/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

type _FixedLengthArrayInterface<
  Type,
  Length extends number,
  Recursion extends Type[],
> = Recursion["length"] extends Length
  ? Recursion
  : _FixedLengthArrayInterface<Type, Length, [Type, ...Recursion]>;

/**
 * A type definition reflecting an array of a fixed length.
 * @typeParam Type The array type.
 * @typeParam Length The length of the array.
 */
export type FixedLengthArrayInterface<
  Type,
  Length extends number,
> = Length extends Length
  ? number extends Length
    ? Type[]
    : _FixedLengthArrayInterface<Type, Length, []>
  : never;
