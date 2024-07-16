/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { anything, anyNumber as mockitoAnyNumber, anyString as mockitoAnyString } from 'ts-mockito'

/**
 * Verifies that the argument is of the type specified.
 * @typeParam Argument The type of the argument.
 * @returns The object.
 */
export const any: <Argument>() => Argument = <Argument>(): Argument =>
  anything() as Argument

/**
 * Verifies that the argument is of the `number` type.
 * @returns The `number`.
 */
export const anyNumber: () => number = (): number =>
  mockitoAnyNumber() as number

/**
 * Verifies that the argument is of the `string` type.
 * @returns The `string`.
 */
export const anyString: () => string = (): string =>
  mockitoAnyString() as string
