/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "./a";
import "reflect-metadata";
import PullRequestMetrics from "./src/pullRequestMetrics.js";
import { container } from "tsyringe";
import { exitCodeForFailure } from "./src/utilities/constants.js";
import { fileURLToPath } from "url";
import path from "path";

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics =
    container.resolve(PullRequestMetrics);
  await pullRequestMetrics.run(path.dirname(fileURLToPath(import.meta.url)));
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
