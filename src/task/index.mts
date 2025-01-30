/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import PullRequestMetrics from "./src/pullRequestMetrics.mjs";
import { container } from "tsyringe";
import { exitCodeForFailure } from "./src/utilities/constants.mjs";

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics =
    container.resolve(PullRequestMetrics);
  await pullRequestMetrics.run(__dirname);
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
