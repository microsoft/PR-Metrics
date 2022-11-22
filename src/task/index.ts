// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import { PullRequestMetrics } from './src/prMetrics'

async function run (): Promise<void> {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  pullRequestMetrics.run()
}

run().finally((): void => {})
