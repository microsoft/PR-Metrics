/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

// Temporary touch to arm the SDL ESLint scan for validation; remove before merge.
import createPullRequestMetrics from "./src/compositionRoot.js";
import { exitCodeForFailure } from "./src/utilities/constants.js";

const run = async (): Promise<void> => {
  const pullRequestMetrics = createPullRequestMetrics();
  await pullRequestMetrics.run(import.meta.dirname);
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
