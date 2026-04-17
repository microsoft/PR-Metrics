/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { anyNumber, anyString } from "../testUtilities/mockito.js";
import { instance, mock, when } from "ts-mockito";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
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

/**
 * Constructs a `GitHubReposInvoker` instance from the supplied mocks.
 * @param gitInvoker The mocked git invoker.
 * @param logger The mocked logger.
 * @param octokitWrapper The mocked octokit wrapper.
 * @param runnerInvoker The mocked runner invoker.
 * @returns The constructed `GitHubReposInvoker` instance.
 */
export const createSut = (
  gitInvoker: GitInvoker,
  logger: Logger,
  octokitWrapper: OctokitWrapper,
  runnerInvoker: RunnerInvoker,
): GitHubReposInvoker =>
  new GitHubReposInvoker(
    instance(gitInvoker),
    instance(logger),
    instance(octokitWrapper),
    instance(runnerInvoker),
  );
