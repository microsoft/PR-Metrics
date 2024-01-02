// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import PullRequestMetrics from './src/pullRequestMetrics.js'

async function run (): Promise<void> {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  pullRequestMetrics.run(dirname(fileURLToPath(import.meta.url)))
}

run().finally((): void => {})
