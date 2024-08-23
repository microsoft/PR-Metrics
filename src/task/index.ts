/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'reflect-metadata'
import PullRequestMetrics from './src/pullRequestMetrics'
import { container } from 'tsyringe'
import { exitCodeForFailure } from './src/utilities/constants'

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  await pullRequestMetrics.run(__dirname)
}

run().catch((): void => {
  process.exit(exitCodeForFailure)
})
