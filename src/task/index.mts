/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import PullRequestMetrics from "./src/pullRequestMetrics.mjs";
import { container } from "tsyringe";
import { exitCodeForFailure } from "./src/utilities/constants.mjs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics =
    container.resolve(PullRequestMetrics);
  await pullRequestMetrics.run(__dirname);
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
