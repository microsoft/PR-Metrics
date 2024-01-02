// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import PullRequestMetrics from './src/pullRequestMetrics.js'

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function run (): Promise<void> {
  const pullRequestMetrics: PullRequestMetrics = container.resolve(PullRequestMetrics)
  pullRequestMetrics.run(__dirname)
}

run().finally((): void => {})
