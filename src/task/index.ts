/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'reflect-metadata'
import { ExitCodeForFailure } from './src/utilities/constants'
import PullRequestMetrics from './src/pullRequestMetrics'
import { container } from 'tsyringe'

const run = async (): Promise<void> => {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  await pullRequestMetrics.run(__dirname)
}

run().catch((): void => {
  process.exit(ExitCodeForFailure)
})
