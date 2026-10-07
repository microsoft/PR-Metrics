/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type CodeMetrics from "../metrics/codeMetrics.js";
import type Logger from "../utilities/logger.js";
import type ReposInvoker from "../repos/reposInvoker.js";

/**
 * Maintains the labels owned by PR Metrics without changing other labels.
 */
export default class PullRequestLabels {
  private readonly _codeMetrics: CodeMetrics;
  private readonly _logger: Logger;
  private readonly _reposInvoker: ReposInvoker;

  /**
   * Initializes a new instance of the `PullRequestLabels` class.
   * @param codeMetrics The shared code metrics.
   * @param logger The logger.
   * @param reposInvoker The repository invoker.
   */
  public constructor(
    codeMetrics: CodeMetrics,
    logger: Logger,
    reposInvoker: ReposInvoker,
  ) {
    this._codeMetrics = codeMetrics;
    this._logger = logger;
    this._reposInvoker = reposInvoker;
  }

  /**
   * Adds missing desired labels, then removes stale managed labels.
   * @returns A promise for awaiting completion.
   */
  public async updateLabels(): Promise<void> {
    this._logger.logDebug("* PullRequestLabels.updateLabels()");

    const [size, sufficientlyTested] = await Promise.all([
      this._codeMetrics.getSize(),
      this._codeMetrics.isSufficientlyTested(),
    ]);
    const desired: string[] = [`pr-metrics:${size}`];
    if (sufficientlyTested !== null) {
      desired.push(
        sufficientlyTested
          ? "pr-metrics:tests-sufficient"
          : "pr-metrics:tests-insufficient",
      );
    }

    const current: string[] = await this._reposInvoker.getLabels();
    const currentNames = new Set<string>(
      current.map((name: string): string => name.toLowerCase()),
    );
    const desiredNames = new Set<string>(
      desired.map((name: string): string => name.toLowerCase()),
    );
    const missing: string[] = desired.filter(
      (name: string): boolean => !currentNames.has(name.toLowerCase()),
    );
    const stale: string[] = current.filter(
      (name: string): boolean =>
        /^pr-metrics:(?:XS|S|M|L|XL|(?:[2-9]|[1-9][0-9]+)XL|tests-(?:sufficient|insufficient))$/iu.test(name) &&
        !desiredNames.has(name.toLowerCase()),
    );

    if (missing.length > 0) {
      await this._reposInvoker.addLabels(missing);
    }

    /* eslint-disable no-await-in-loop -- Preserve add-before-remove ordering and stop at the first removal failure. */
    for (const name of stale) {
      await this._reposInvoker.removeLabel(name);
    }
    /* eslint-enable no-await-in-loop */
  }
}
