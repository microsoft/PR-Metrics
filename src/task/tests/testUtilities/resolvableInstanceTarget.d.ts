/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The target object used for resolving an instance of a mock object.
 * @typeParam T The type of the mock object.
 */
type ResolvableInstanceTarget<T> = Record<string, T>;

export default ResolvableInstanceTarget;
