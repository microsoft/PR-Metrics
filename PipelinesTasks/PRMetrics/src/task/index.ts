// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License. TPDP

import 'reflect-metadata'
import { container } from 'tsyringe'
import * as path from 'path'
import * as taskLib from 'azure-pipelines-task-lib/task'
import CodeMetricsCalculator from './src/metrics/codeMetricsCalculator'
import Logger from './src/utilities/logger'

async function run (): Promise<void> {
  try {
    taskLib.setResourcePath(path.join(__dirname, 'task.json'))

    const codeMetricsCalculator: CodeMetricsCalculator = container.resolve(CodeMetricsCalculator)

    const skipMessage: string | null = codeMetricsCalculator.shouldSkip
    if (skipMessage !== null) {
      taskLib.setResult(taskLib.TaskResult.Skipped, skipMessage)
      return
    }

    const terminateMessage: string | null = await codeMetricsCalculator.shouldStop()
    if (terminateMessage !== null) {
      taskLib.setResult(taskLib.TaskResult.Failed, terminateMessage)
      return
    }

    if (!process.env.PRMETRICS_SKIP_APIS) {
      await Promise.all([
        codeMetricsCalculator.updateDetails(),
        codeMetricsCalculator.updateComments()
      ])
    }

    taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('index.succeeded'))
  } catch (error) {
    const logger: Logger = container.resolve(Logger)
    const properties: string[] = Object.getOwnPropertyNames(error)
    properties.forEach((property: string): void => {
      if (property !== 'message') {
        logger.logInfo(`${error.name} – ${property}: ${JSON.stringify(error[property])}`)
      }
    })

    logger.replay()
    taskLib.setResult(taskLib.TaskResult.Failed, error.message)
  }
}

run()
