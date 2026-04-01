/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import createPullRequestMetrics from "./src/compositionRoot.js";
import { exitCodeForFailure } from "./src/utilities/constants.js";
import { fileURLToPath } from "url";
import path from "path";

const run = async (): Promise<void> => {
  const pullRequestMetrics = createPullRequestMetrics();
  await pullRequestMetrics.run(path.dirname(fileURLToPath(import.meta.url)));
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
