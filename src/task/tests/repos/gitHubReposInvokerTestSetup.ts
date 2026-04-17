/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { anyNumber, anyString } from "../testUtilities/mockito.js";
import { mock, when } from "ts-mockito";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { stubEnv } from "../testUtilities/stubEnv.js";
import { stubLocalization } from "../testUtilities/stubLocalization.js";

export const expectedUserAgent = "PRMetrics/v1.7.13";

export interface GitHubReposInvokerMocks {
  gitInvoker: GitInvoker;
  logger: Logger;
  octokitWrapper: OctokitWrapper;
  runnerInvoker: RunnerInvoker;
}

/**
 * Creates the mocks and environment variable stubs required by
 * `gitHubReposInvoker.ts` tests. Individual tests can override any stub
 * after calling this helper.
 * @returns The paired mocks.
 */
export const createGitHubReposInvokerMocks = (): GitHubReposInvokerMocks => {
  stubEnv(
    ["PR_METRICS_ACCESS_TOKEN", "PAT"],
    [
      "SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI",
      "https://github.com/microsoft/PR-Metrics",
    ],
  );

  const pullRequestId = 12345;
  const gitInvoker: GitInvoker = mock(GitInvoker);
  when(gitInvoker.pullRequestId).thenReturn(pullRequestId);

  const logger: Logger = mock(Logger);

  const octokitWrapper: OctokitWrapper = mock(OctokitWrapper);
  when(
    octokitWrapper.getPull(anyString(), anyString(), anyNumber()),
  ).thenResolve(GitHubReposInvokerConstants.getPullResponse);
  when(
    octokitWrapper.updatePull(
      anyString(),
      anyString(),
      anyNumber(),
      anyString(),
      anyString(),
    ),
  ).thenResolve(GitHubReposInvokerConstants.getPullResponse);
  when(
    octokitWrapper.listCommits(
      anyString(),
      anyString(),
      anyNumber(),
      anyNumber(),
    ),
  ).thenResolve(GitHubReposInvokerConstants.listCommitsResponse);

  const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);
  stubLocalization(runnerInvoker);

  return { gitInvoker, logger, octokitWrapper, runnerInvoker };
};
