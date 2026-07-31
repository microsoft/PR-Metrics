/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The permissions mode applied to the isolated Azure CLI configuration directory, restricting access to the owner
 * only, where supported by the underlying operating system.
 */
export const azureCliConfigDirectoryMode = 0o700;

/**
 * The radix to use when parsing a decimal integer using `parseInt()`.
 */
export const decimalRadix = 10;

/**
 * The exit code for an unsuccessful run of PR Metrics.
 */
export const exitCodeForFailure = 1;

/**
 * The timeout in milliseconds for HTTP requests.
 */
export const httpTimeoutMs = 30_000;

/**
 * The maximum number of matching patterns that can be specified for file or test matching.
 */
export const maxPatternCount = 200;

/**
 * The user agent string used for GitHub API requests.
 */
export const userAgent = "PRMetrics/v1.7.16";
