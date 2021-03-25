// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { container } from 'tsyringe'
import * as path from 'path'
import * as taskLib from 'azure-pipelines-task-lib/task'
import CodeMetricsCalculator from './codeMetricsCalculator'

async function run (): Promise<void> {
  try {
    taskLib.setResourcePath(path.join(__dirname, 'task.json'))

    const codeMetricsCalculator: CodeMetricsCalculator = container.resolve(CodeMetricsCalculator)
    const skipMessage: string | null = codeMetricsCalculator.isRunnable
    if (skipMessage !== null) {
      taskLib.setResult(taskLib.TaskResult.Skipped, skipMessage)
      return
    }

    await Promise.all([
      codeMetricsCalculator.updateDetails(),
      codeMetricsCalculator.updateComments()
    ])

    taskLib.setResult(taskLib.TaskResult.Succeeded, taskLib.loc('index.succeeded'))
  } catch (error) {
    taskLib.setResult(taskLib.TaskResult.Failed, error.message)
  }
}

run()
