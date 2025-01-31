/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "./a"
import "reflect-metadata";
import PullRequestMetrics from "./src/pullRequestMetrics.js";
import { container } from "tsyringe";
import { exitCodeForFailure } from "./src/utilities/constants.js";

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics =
    container.resolve(PullRequestMetrics);
  await pullRequestMetrics.run(import.meta.dirname);
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
