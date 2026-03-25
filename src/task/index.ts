/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { container } from "tsyringe";
import PullRequestMetrics from "./src/pullRequestMetrics.js";
import { exitCodeForFailure } from "./src/utilities/constants.js";

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics =
    container.resolve(PullRequestMetrics);
  await pullRequestMetrics.run(path.dirname(fileURLToPath(import.meta.url)));
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
