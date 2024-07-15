/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { anything } from 'ts-mockito'

/**
 * Verifies that the argument is of the type specified.
 * @typeParam Argument The type of the argument.
 * @returns The object.
 */
const any: <Argument>() => Argument = <Argument>(): Argument =>
  anything() as Argument

export default any
