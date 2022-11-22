
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { singleton } from 'tsyringe'
import CodeMetricsCalculator from '../src/metrics/codeMetricsCalculator'
import Logger from '../src/utilities/logger'
import path from 'path'
import RunnerInvoker from '../src/runners/runnerInvoker'

/**
 * A class for managing the overall PR Metrics task.
 */
@singleton()
export class PullRequestMetrics {
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
   */
  public async run (): Promise<void> {
    try {
      this._runnerInvoker.locInitialize(path.join(__dirname, '..'))

      // TODO: Remove System.AccessToken support after a transition period has elapsed.
      if (process.env.PR_METRICS_ACCESS_TOKEN === undefined && process.env.SYSTEM_ACCESSTOKEN !== undefined) {
        this._runnerInvoker.logWarning(this._runnerInvoker.loc('metrics.index.remappingToken'))
        process.env.PR_METRICS_ACCESS_TOKEN = process.env.SYSTEM_ACCESSTOKEN
      }

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

      if (process.env.PRMETRICS_SKIP_APIS === undefined) {
        await Promise.all([
          this._codeMetricsCalculator.updateDetails(),
          this._codeMetricsCalculator.updateComments()
        ])
      }

      this._runnerInvoker.setStatusSucceeded(this._runnerInvoker.loc('index.succeeded'))
    } catch (error: any) {
      this._logger.logErrorObject(error)
      this._logger.replay()

      this._runnerInvoker.setStatusFailed(error.message)
    }
  }
}
