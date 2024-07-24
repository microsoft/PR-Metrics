/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'reflect-metadata'
import CodeMetricsCalculator from './metrics/codeMetricsCalculator'
import Logger from './utilities/logger'
import RunnerInvoker from './runners/runnerInvoker'
import { singleton } from 'tsyringe'

/**
 * A class for managing the overall PR Metrics task.
 */
@singleton()
export default class PullRequestMetrics {
  private readonly codeMetricsCalculator: CodeMetricsCalculator
  private readonly logger: Logger
  private readonly runnerInvoker: RunnerInvoker

  /**
   * Initializes a new instance of the `PullRequestMetrics` class.
   * @param codeMetricsCalculator The code metrics calculation logic.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (codeMetricsCalculator: CodeMetricsCalculator, logger: Logger, runnerInvoker: RunnerInvoker) {
    this.codeMetricsCalculator = codeMetricsCalculator
    this.logger = logger
    this.runnerInvoker = runnerInvoker
  }

  /**
   * Runs the overall PR Metrics task.
   * @param folder The root folder containing index.ts.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async run (folder: string): Promise<void> {
    try {
      this.runnerInvoker.locInitialize(folder)

      const skipMessage: string | null = this.codeMetricsCalculator.shouldSkip
      if (skipMessage !== null) {
        this.runnerInvoker.setStatusSkipped(skipMessage)
        return
      }

      const terminateMessage: string | null = await this.codeMetricsCalculator.shouldStop()
      if (terminateMessage !== null) {
        this.runnerInvoker.setStatusFailed(terminateMessage)
        return
      }

      await Promise.all([
        this.codeMetricsCalculator.updateDetails(),
        this.codeMetricsCalculator.updateComments(),
      ])

      this.runnerInvoker.setStatusSucceeded(this.runnerInvoker.loc('pullRequestMetrics.succeeded'))
    } catch (error: unknown) {
      let statusMessage = 'An unknown error occurred.'
      if (error instanceof Error) {
        this.logger.logErrorObject(error)
        statusMessage = error.message
      } else {
        this.logger.logError(statusMessage)
      }

      this.logger.replay()
      this.runnerInvoker.setStatusFailed(statusMessage)
    }
  }
}
