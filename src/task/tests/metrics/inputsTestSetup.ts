/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as InputsDefault from "../../src/metrics/inputsDefault.js";
import { deepEqual, mock, when } from "ts-mockito";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { anyString } from "../testUtilities/mockito.js";

export const adjustingAlwaysCloseComment =
  "Adjusting the always-close-comment mode input to 'false'.";
export const adjustingBaseSizeResource = `Adjusting the base size input to '${String(InputsDefault.baseSize)}'.`;
export const adjustingGrowthRateResource = `Adjusting the growth rate input to '${String(InputsDefault.growthRate)}'.`;
export const adjustingTestFactorResource = `Adjusting the test factor input to '${String(InputsDefault.testFactor)}'.`;
export const adjustingFileMatchingPatternsResource = `Adjusting the file matching patterns input to '${JSON.stringify(InputsDefault.fileMatchingPatterns)}'.`;
export const adjustingTestMatchingPatternsResource = `Adjusting the test matching patterns input to '${JSON.stringify(InputsDefault.testMatchingPatterns)}'.`;
export const adjustingCodeFileExtensionsResource = `Adjusting the code file extensions input to '${JSON.stringify(InputsDefault.codeFileExtensions)}'.`;
export const disablingTestFactorResource =
  "Disabling the test factor validation.";
export const settingAlwaysCloseComment =
  "Setting the always-close-comment mode input to 'true'.";
export const settingBaseSizeResource = "Setting the base size input to 'VALUE'.";
export const settingGrowthRateResource =
  "Setting the growth rate input to 'VALUE'.";
export const settingTestFactorResource =
  "Setting the test factor input to 'VALUE'.";
export const settingFileMatchingPatternsResource =
  "Setting the file matching patterns input to 'VALUE'.";
export const settingTestMatchingPatternsResource =
  "Setting the test matching patterns input to 'VALUE'.";
export const settingCodeFileExtensionsResource =
  "Setting the code file extensions input to 'VALUE'.";

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
  when(
    runnerInvoker.loc("metrics.inputs.adjustingAlwaysCloseComment"),
  ).thenReturn(adjustingAlwaysCloseComment);
  when(
    runnerInvoker.loc(
      "metrics.inputs.adjustingBaseSize",
      InputsDefault.baseSize.toLocaleString(),
    ),
  ).thenReturn(adjustingBaseSizeResource);
  when(
    runnerInvoker.loc(
      "metrics.inputs.adjustingGrowthRate",
      InputsDefault.growthRate.toLocaleString(),
    ),
  ).thenReturn(adjustingGrowthRateResource);
  when(
    runnerInvoker.loc(
      "metrics.inputs.adjustingTestFactor",
      InputsDefault.testFactor.toLocaleString(),
    ),
  ).thenReturn(adjustingTestFactorResource);
  when(
    runnerInvoker.loc(
      "metrics.inputs.adjustingFileMatchingPatterns",
      JSON.stringify(InputsDefault.fileMatchingPatterns),
    ),
  ).thenReturn(adjustingFileMatchingPatternsResource);
  when(
    runnerInvoker.loc(
      "metrics.inputs.adjustingTestMatchingPatterns",
      JSON.stringify(InputsDefault.testMatchingPatterns),
    ),
  ).thenReturn(adjustingTestMatchingPatternsResource);
  when(
    runnerInvoker.loc(
      "metrics.inputs.adjustingCodeFileExtensions",
      JSON.stringify(InputsDefault.codeFileExtensions),
    ),
  ).thenReturn(adjustingCodeFileExtensionsResource);
  when(runnerInvoker.loc("metrics.inputs.disablingTestFactor")).thenReturn(
    disablingTestFactorResource,
  );
  when(
    runnerInvoker.loc("metrics.inputs.settingAlwaysCloseComment"),
  ).thenReturn(settingAlwaysCloseComment);
  when(
    runnerInvoker.loc("metrics.inputs.settingBaseSize", anyString()),
  ).thenReturn(settingBaseSizeResource);
  when(
    runnerInvoker.loc("metrics.inputs.settingGrowthRate", anyString()),
  ).thenReturn(settingGrowthRateResource);
  when(
    runnerInvoker.loc("metrics.inputs.settingTestFactor", anyString()),
  ).thenReturn(settingTestFactorResource);
  when(
    runnerInvoker.loc("metrics.inputs.settingFileMatchingPatterns", anyString()),
  ).thenReturn(settingFileMatchingPatternsResource);
  when(
    runnerInvoker.loc("metrics.inputs.settingTestMatchingPatterns", anyString()),
  ).thenReturn(settingTestMatchingPatternsResource);
  when(
    runnerInvoker.loc("metrics.inputs.settingCodeFileExtensions", anyString()),
  ).thenReturn(settingCodeFileExtensionsResource);

  return { logger, runnerInvoker };
};
