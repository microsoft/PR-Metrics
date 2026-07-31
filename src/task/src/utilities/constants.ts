/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The number of comments to request per page when reading pull request comments. This is the maximum page size
 * supported by the GitHub APIs.
 */
export const commentsPageSize = 100;

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
 * The maximum number of comment creations, updates and deletions that PR Metrics will perform during a single run.
 * This bounds the number of write calls that a single run can make against the repository APIs.
 */
export const maxCommentMutations = 100;

/**
 * The maximum number of pages of comments that will be read for each comment type. Combined with
 * `commentsPageSize`, this bounds the number of read calls that a single run can make against the repository APIs.
 */
export const maxCommentPages = 20;

/**
 * The maximum number of matching patterns that can be specified for file or test matching.
 */
export const maxPatternCount = 200;

/**
 * The hidden marker added to the metrics comment, which allows the comment to be reliably located irrespective of
 * the language in which its content was written.
 */
export const metricsCommentMarker = "<!-- pr-metrics:metrics:v1 -->";

/**
 * The hidden marker added to comments on files not requiring review, which allows the comments to be reliably
 * located irrespective of the language in which their content was written.
 */
export const noReviewRequiredCommentMarker = "<!-- pr-metrics:no-review:v1 -->";

/**
 * The user agent string used for GitHub API requests.
 */
export const userAgent = "PRMetrics/v1.7.16";
