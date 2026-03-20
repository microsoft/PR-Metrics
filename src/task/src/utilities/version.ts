/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import packageJson from "../../../../package.json" with { type: "json" };

/**
 * The current version of PR Metrics, derived from package.json.
 */
export const version: string = packageJson.version;
