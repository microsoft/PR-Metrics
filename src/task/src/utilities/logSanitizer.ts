/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

const azureCommandPrefixPattern = /##(?:vso)?\[/giu;
const gitHubWorkflowCommandPattern = /^(?<leadingWhitespace>\s*)::/u;
const logicalLineSeparatorPattern = /\r\n|\r|\n/gu;

/**
 * Sanitizes plain-text log messages so untrusted payloads cannot begin workflow commands.
 * @param message The message to sanitize.
 * @returns The sanitized message with Azure command prefixes removed, GitHub command starts neutralized, and
 * newline boundaries folded into spaces.
 */
export const sanitizePlainTextForLogging = (message: string): string =>
  message
    .split(logicalLineSeparatorPattern)
    .map((line: string): string =>
      line
        .replace(azureCommandPrefixPattern, "")
        .replace(gitHubWorkflowCommandPattern, "$<leadingWhitespace>: :"),
    )
    .join(" ");
