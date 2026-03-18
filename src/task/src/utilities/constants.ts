/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The radix to use when parsing a decimal integer using `parseInt()`.
 */
export const decimalRadix = 10;

/**
 * The exit code for an unsuccessful run of PR Metrics.
 */
export const exitCodeForFailure = 1;

/**
 * The maximum number of matching patterns that can be specified for file or test matching.
 */
export const maxPatternCount = 200;

/**
 * HTTP 401 Unauthorized status code.
 */
export const httpUnauthorized = 401;

/**
 * HTTP 403 Forbidden status code.
 */
export const httpForbidden = 403;

/**
 * HTTP 404 Not Found status code.
 */
export const httpNotFound = 404;

/**
 * HTTP 422 Unprocessable Entity status code.
 */
export const httpUnprocessableEntity = 422;

/**
 * Azure DevOps `BUILD_REPOSITORY_PROVIDER` value for Azure Repos (TFS Git).
 */
export const repoProviderTfsGit = "TfsGit";

/**
 * Azure DevOps `BUILD_REPOSITORY_PROVIDER` value for GitHub.
 */
export const repoProviderGitHub = "GitHub";

/**
 * Azure DevOps `BUILD_REPOSITORY_PROVIDER` value for GitHub Enterprise.
 */
export const repoProviderGitHubEnterprise = "GitHubEnterprise";
