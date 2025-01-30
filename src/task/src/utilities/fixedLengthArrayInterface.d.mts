/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

type FixedLengthArrayInternal<
  Type,
  Length extends number,
  Recursion extends Type[],
> = Recursion["length"] extends Length
  ? Recursion
  : FixedLengthArrayInternal<Type, Length, [Type, ...Recursion]>;

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
    : FixedLengthArrayInternal<Type, Length, []>
  : never;
