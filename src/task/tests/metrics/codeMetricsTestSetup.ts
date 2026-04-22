/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import { instance, mock, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { stubLocalization } from "../testUtilities/stubLocalization.js";

export interface CodeMetricsMocks {
  gitInvoker: GitInvoker;
  inputs: Inputs;
  logger: Logger;
  runnerInvoker: RunnerInvoker;
}

/**
 * Creates the mocks required by `codeMetrics.ts` tests, pre-wired with the
 * default `Inputs` values so that `CodeMetrics` construction succeeds.
 * Individual tests can override any stub after calling this helper.
 * @returns The paired mocks.
 */
export const createCodeMetricsMocks = (): CodeMetricsMocks => {
  const gitInvoker: GitInvoker = mock(GitInvoker);

  const inputs: Inputs = mock(Inputs);
  when(inputs.baseSize).thenReturn(InputsDefault.baseSize);
  when(inputs.growthRate).thenReturn(InputsDefault.growthRate);
  when(inputs.testFactor).thenReturn(InputsDefault.testFactor);
  when(inputs.fileMatchingPatterns).thenReturn(
    InputsDefault.fileMatchingPatterns,
  );
  when(inputs.testMatchingPatterns).thenReturn(
    InputsDefault.testMatchingPatterns,
  );
  when(inputs.codeFileExtensions).thenReturn(
    new Set<string>(InputsDefault.codeFileExtensions),
  );

  const logger: Logger = mock(Logger);

  const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);
  stubLocalization(runnerInvoker);

  return { gitInvoker, inputs, logger, runnerInvoker };
};

/**
 * Constructs a `CodeMetrics` instance from the supplied mocks.
 * @param gitInvoker The mocked git invoker.
 * @param inputs The mocked inputs.
 * @param logger The mocked logger.
 * @param runnerInvoker The mocked runner invoker.
 * @returns The constructed `CodeMetrics` instance.
 */
export const createSut = (
  gitInvoker: GitInvoker,
  inputs: Inputs,
  logger: Logger,
  runnerInvoker: RunnerInvoker,
): CodeMetrics =>
  new CodeMetrics(
    instance(gitInvoker),
    instance(inputs),
    instance(logger),
    instance(runnerInvoker),
  );
