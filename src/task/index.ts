/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import AxiosWrapper from "./src/wrappers/axiosWrapper.js";
import AzureDevOpsApiWrapper from "./src/wrappers/azureDevOpsApiWrapper.js";
import AzurePipelinesRunnerInvoker from "./src/runners/azurePipelinesRunnerInvoker.js";
import AzurePipelinesRunnerWrapper from "./src/wrappers/azurePipelinesRunnerWrapper.js";
import AzureReposInvoker from "./src/repos/azureReposInvoker.js";
import CodeMetrics from "./src/metrics/codeMetrics.js";
import CodeMetricsCalculator from "./src/metrics/codeMetricsCalculator.js";
import ConsoleWrapper from "./src/wrappers/consoleWrapper.js";
import GitHubReposInvoker from "./src/repos/gitHubReposInvoker.js";
import GitHubRunnerInvoker from "./src/runners/gitHubRunnerInvoker.js";
import GitHubRunnerWrapper from "./src/wrappers/gitHubRunnerWrapper.js";
import GitInvoker from "./src/git/gitInvoker.js";
import Inputs from "./src/metrics/inputs.js";
import Logger from "./src/utilities/logger.js";
import OctokitGitDiffParser from "./src/git/octokitGitDiffParser.js";
import OctokitWrapper from "./src/wrappers/octokitWrapper.js";
import PullRequest from "./src/pullRequests/pullRequest.js";
import PullRequestComments from "./src/pullRequests/pullRequestComments.js";
import PullRequestMetrics from "./src/pullRequestMetrics.js";
import ReposInvoker from "./src/repos/reposInvoker.js";
import RunnerInvoker from "./src/runners/runnerInvoker.js";
import TokenManager from "./src/repos/tokenManager.js";
import { exitCodeForFailure } from "./src/utilities/constants.js";
import { fileURLToPath } from "url";
import path from "path";

const run = async (): Promise<void> => {
  // Wrappers (leaf nodes).
  const axiosWrapper: AxiosWrapper = new AxiosWrapper();
  const azureDevOpsApiWrapper: AzureDevOpsApiWrapper =
    new AzureDevOpsApiWrapper();
  const azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper =
    new AzurePipelinesRunnerWrapper();
  const consoleWrapper: ConsoleWrapper = new ConsoleWrapper();
  const gitHubRunnerWrapper: GitHubRunnerWrapper = new GitHubRunnerWrapper();

  // Runners.
  const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker =
    new AzurePipelinesRunnerInvoker(azurePipelinesRunnerWrapper);
  const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(
    azurePipelinesRunnerWrapper,
    consoleWrapper,
    gitHubRunnerWrapper,
  );
  const runnerInvoker: RunnerInvoker = new RunnerInvoker(
    azurePipelinesRunnerInvoker,
    gitHubRunnerInvoker,
  );

  // Utilities.
  const logger: Logger = new Logger(consoleWrapper, runnerInvoker);

  // Git.
  const gitInvoker: GitInvoker = new GitInvoker(logger, runnerInvoker);
  const octokitGitDiffParser: OctokitGitDiffParser = new OctokitGitDiffParser(
    axiosWrapper,
    logger,
  );

  // Metrics inputs.
  const inputs: Inputs = new Inputs(logger, runnerInvoker);
  const codeMetrics: CodeMetrics = new CodeMetrics(
    gitInvoker,
    inputs,
    logger,
    runnerInvoker,
  );

  // Repository access.
  const octokitWrapper: OctokitWrapper = new OctokitWrapper(
    octokitGitDiffParser,
  );
  const tokenManager: TokenManager = new TokenManager(
    azureDevOpsApiWrapper,
    logger,
    runnerInvoker,
  );
  const azureReposInvoker: AzureReposInvoker = new AzureReposInvoker(
    azureDevOpsApiWrapper,
    gitInvoker,
    logger,
    runnerInvoker,
    tokenManager,
  );
  const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(
    gitInvoker,
    logger,
    octokitWrapper,
    runnerInvoker,
  );
  const reposInvoker: ReposInvoker = new ReposInvoker(
    azureReposInvoker,
    gitHubReposInvoker,
    logger,
  );

  // Pull request layer.
  const pullRequest: PullRequest = new PullRequest(
    codeMetrics,
    logger,
    runnerInvoker,
  );
  const pullRequestComments: PullRequestComments = new PullRequestComments(
    codeMetrics,
    inputs,
    logger,
    reposInvoker,
    runnerInvoker,
  );

  // Orchestration.
  const codeMetricsCalculator: CodeMetricsCalculator =
    new CodeMetricsCalculator(
      gitInvoker,
      logger,
      pullRequest,
      pullRequestComments,
      reposInvoker,
      runnerInvoker,
    );
  const pullRequestMetrics: PullRequestMetrics = new PullRequestMetrics(
    codeMetricsCalculator,
    logger,
    runnerInvoker,
  );

  await pullRequestMetrics.run(path.dirname(fileURLToPath(import.meta.url)));
};

run().catch((): void => {
  process.exit(exitCodeForFailure);
});
