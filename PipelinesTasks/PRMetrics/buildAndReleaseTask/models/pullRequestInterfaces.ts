// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface IPullRequestInfo {
    description?: string;
    title?: string;
}

export interface IPullRequestMetadata {
    key: string;
    value: string | number | boolean;
}
