// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import PullRequestMetrics from './src/pullRequestMetrics'

async function run (): Promise<void> {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  pullRequestMetrics.run(__dirname)
}

run().finally((): void => {})
