// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

type _FixedLengthArray<T, L extends number, R extends unknown[]> = R['length'] extends L ? R : _FixedLengthArray<T, L, [T, ...R]>;

/**
 * A type definition reflecting an array of a fixed length.
 * @typeParam T The array type.
 * @typeParam L The length of the array.
 */
export type FixedLengthArray<T, L extends number> = L extends L ? number extends L ? T[] : _FixedLengthArray<T, L, []> : never;
