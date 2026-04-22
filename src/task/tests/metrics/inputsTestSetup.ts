/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import { deepEqual, instance, mock, when } from "ts-mockito";
import {
  localize,
  stubLocalization,
} from "../testUtilities/stubLocalization.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";

export const adjustingAlwaysCloseComment = localize(
  "metrics.inputs.adjustingAlwaysCloseComment",
);
export const adjustingBaseSizeResource = localize(
  "metrics.inputs.adjustingBaseSize",
  InputsDefault.baseSize.toLocaleString(),
);
export const adjustingGrowthRateResource = localize(
  "metrics.inputs.adjustingGrowthRate",
  InputsDefault.growthRate.toLocaleString(),
);
export const adjustingTestFactorResource = localize(
  "metrics.inputs.adjustingTestFactor",
  InputsDefault.testFactor.toLocaleString(),
);
export const adjustingFileMatchingPatternsResource = localize(
  "metrics.inputs.adjustingFileMatchingPatterns",
  JSON.stringify(InputsDefault.fileMatchingPatterns),
);
export const adjustingTestMatchingPatternsResource = localize(
  "metrics.inputs.adjustingTestMatchingPatterns",
  JSON.stringify(InputsDefault.testMatchingPatterns),
);
export const adjustingCodeFileExtensionsResource = localize(
  "metrics.inputs.adjustingCodeFileExtensions",
  JSON.stringify(InputsDefault.codeFileExtensions),
);
export const disablingTestFactorResource = localize(
  "metrics.inputs.disablingTestFactor",
);
export const settingAlwaysCloseComment = localize(
  "metrics.inputs.settingAlwaysCloseComment",
);

export const settingBaseSizeResource = (value: string): string =>
  localize("metrics.inputs.settingBaseSize", value);
export const settingGrowthRateResource = (value: string): string =>
  localize("metrics.inputs.settingGrowthRate", value);
export const settingTestFactorResource = (value: string): string =>
  localize("metrics.inputs.settingTestFactor", value);
export const settingFileMatchingPatternsResource = (value: string): string =>
  localize("metrics.inputs.settingFileMatchingPatterns", value);
export const settingTestMatchingPatternsResource = (value: string): string =>
  localize("metrics.inputs.settingTestMatchingPatterns", value);
export const settingCodeFileExtensionsResource = (value: string): string =>
  localize("metrics.inputs.settingCodeFileExtensions", value);

export interface InputsMocks {
  logger: Logger;
  runnerInvoker: RunnerInvoker;
}

/**
 * Creates mocked `Logger` and `RunnerInvoker` instances pre-configured with the
 * default stubs required for `Inputs.initialize()` to run without throwing.
 * Tests can override individual stubs as needed.
 * @returns The paired mocks.
 */
export const createInputsMocks = (): InputsMocks => {
  const logger: Logger = mock(Logger);
  const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);

  when(runnerInvoker.getInput(deepEqual(["Base", "Size"]))).thenReturn("");
  when(runnerInvoker.getInput(deepEqual(["Growth", "Rate"]))).thenReturn("");
  when(runnerInvoker.getInput(deepEqual(["Test", "Factor"]))).thenReturn("");
  when(
    runnerInvoker.getInput(deepEqual(["Always", "Close", "Comment"])),
  ).thenReturn("");
  when(
    runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
  ).thenReturn("");
  when(
    runnerInvoker.getInput(deepEqual(["Test", "Matching", "Patterns"])),
  ).thenReturn("");
  when(
    runnerInvoker.getInput(deepEqual(["Code", "File", "Extensions"])),
  ).thenReturn("");
  stubLocalization(runnerInvoker);

  return { logger, runnerInvoker };
};

/**
 * Constructs an `Inputs` instance from the supplied mocks. Tests use this in
 * place of inline `new Inputs(instance(...), ...)` calls.
 * @param logger The mocked logger.
 * @param runnerInvoker The mocked runner invoker.
 * @returns The constructed `Inputs` instance.
 */
export const createSut = (
  logger: Logger,
  runnerInvoker: RunnerInvoker,
): Inputs => new Inputs(instance(logger), instance(runnerInvoker));
