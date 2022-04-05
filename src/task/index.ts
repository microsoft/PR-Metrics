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
    runnerInvoker.locInitialize(__dirname)

    const codeMetricsCalculator: CodeMetricsCalculator = container.resolve(CodeMetricsCalculator)

    const skipMessage: string | null = codeMetricsCalculator.shouldSkip
    if (skipMessage !== null) {
      runnerInvoker.setStatusSkipped(skipMessage)
      return
    }

    const terminateMessage: string | null = await codeMetricsCalculator.shouldStop()
    if (terminateMessage !== null) {
      runnerInvoker.setStatusFailed(terminateMessage)
      return
    }

    if (process.env.PRMETRICS_SKIP_APIS === undefined) {
      await Promise.all([
        codeMetricsCalculator.updateDetails(),
        codeMetricsCalculator.updateComments()
      ])
    }

    runnerInvoker.setStatusSucceeded(runnerInvoker.loc('index.succeeded'))
  } catch (error: any) {
    const logger: Logger = container.resolve(Logger)
    const runnerInvoker: RunnerInvoker = container.resolve(RunnerInvoker)
    const properties: string[] = Object.getOwnPropertyNames(error)
    properties.forEach((property: string): void => {
      if (property !== 'message') {
        logger.logInfo(`${error.name} – ${property}: ${JSON.stringify(error[property].toString())}`)
      }
    })

    logger.replay()
    runnerInvoker.setStatusFailed(error.message)
  }
}

run()
