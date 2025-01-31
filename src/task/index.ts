/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * This ESM module polyfills "require".
 * It is needed e.g. when bundling ESM scripts via "@vercel/ncc" because of https://github.com/vercel/ncc/issues/791.
 */

import "reflect-metadata";
import PullRequestMetrics from "./src/pullRequestMetrics.js";
import { container } from "tsyringe";
import { createRequire } from 'node:module';
import { exitCodeForFailure } from "./src/utilities/constants.js";
import url from 'node:url';

const filename = url.fileURLToPath(import.meta.url);
globalThis.require = createRequire(filename);

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics =
    container.resolve(PullRequestMetrics);
  await pullRequestMetrics.run(import.meta.dirname);
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
