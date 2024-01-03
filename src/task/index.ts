// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import filedirname from 'filedirname'
import PullRequestMetrics from './src/pullRequestMetrics.js'

async function run (): Promise<void> {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  pullRequestMetrics.run(filedirname()[1])
}

run().finally((): void => {})
