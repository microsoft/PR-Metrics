// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import CodeMetricsCalculator from './src/metrics/codeMetricsCalculator'
import Logger from './src/utilities/logger'
import RunnerInvoker from './src/runners/runnerInvoker'

async function run (): Promise<void> {
  try {
    const runnerInvoker: RunnerInvoker = container.resolve(RunnerInvoker)
    runnerInvoker.initializeLoc(__dirname)

    const codeMetricsCalculator: CodeMetricsCalculator = container.resolve(CodeMetricsCalculator)

    const skipMessage: string | null = codeMetricsCalculator.shouldSkip
    if (skipMessage !== null) {
      runnerInvoker.setSkipped(skipMessage)
      return
    }

    const terminateMessage: string | null = await codeMetricsCalculator.shouldStop()
    if (terminateMessage !== null) {
      runnerInvoker.setFailed(terminateMessage)
      return
    }

    if (!process.env.PRMETRICS_SKIP_APIS) {
      await Promise.all([
        codeMetricsCalculator.updateDetails(),
        codeMetricsCalculator.updateComments()
      ])
    }

    runnerInvoker.setSucceeded(runnerInvoker.loc('index.succeeded'))
  } catch (error: any) {
    const logger: Logger = container.resolve(Logger)
    const runnerInvoker: RunnerInvoker = container.resolve(RunnerInvoker)
    const properties: string[] = Object.getOwnPropertyNames(error)
    properties.forEach((property: string): void => {
      if (property !== 'message') {
        logger.logInfo(`${error.name} – ${property}: ${JSON.stringify(error[property])}`)
      }
    })

    logger.replay()
    runnerInvoker.setFailed(error.message)
  }
}

run()
