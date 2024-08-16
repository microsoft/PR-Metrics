/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The target object used for resolving an instance of a mock object.
 * @typeParam Mock The type of the mock object.
 */
type ResolvableInstanceTarget<Mock> = Record<string, Mock>

export default ResolvableInstanceTarget
