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
  private readonly _codeMetricsCalculator: CodeMetricsCalculator
  private readonly _logger: Logger
  private readonly _runnerInvoker: RunnerInvoker

  /**
   * Initializes a new instance of the `PullRequestMetrics` class.
   * @param codeMetricsCalculator The code metrics calculation logic.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor (codeMetricsCalculator: CodeMetricsCalculator, logger: Logger, runnerInvoker: RunnerInvoker) {
    this._codeMetricsCalculator = codeMetricsCalculator
    this._logger = logger
    this._runnerInvoker = runnerInvoker
  }

  /**
   * Runs the overall PR Metrics task.
   * @param folder The root folder containing index.ts.
   * @returns A promise for awaiting the completion of the method call.
   */
  public async run (folder: string): Promise<void> {
    try {
      this._runnerInvoker.locInitialize(folder)

      const skipMessage: string | null = this._codeMetricsCalculator.shouldSkip
      if (skipMessage !== null) {
        this._runnerInvoker.setStatusSkipped(skipMessage)
        return
      }

      const terminateMessage: string | null = await this._codeMetricsCalculator.shouldStop()
      if (terminateMessage !== null) {
        this._runnerInvoker.setStatusFailed(terminateMessage)
        return
      }

      await Promise.all([
        this._codeMetricsCalculator.updateDetails(),
        this._codeMetricsCalculator.updateComments()
      ])

      this._runnerInvoker.setStatusSucceeded(this._runnerInvoker.loc('pullRequestMetrics.succeeded'))
    } catch (error: unknown) {
      let statusMessage = 'An unknown error occurred.'
      if (error instanceof Error) {
        this._logger.logErrorObject(error)
        statusMessage = error.message
      } else {
        this._logger.logError(statusMessage)
      }

      this._logger.replay()
      this._runnerInvoker.setStatusFailed(statusMessage)
    }
  }
}
