/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { deepEqual, instance, mock, when } from "ts-mockito";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import type { IGitApi } from "azure-devops-node-api/GitApi.js";
import type { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import TokenManager from "../../src/repos/tokenManager.js";
import { WebApi } from "azure-devops-node-api";
import { resolvableInstance } from "../testUtilities/resolvableInstance.js";
import { stubEnv } from "../testUtilities/stubEnv.js";
import { stubLocalization } from "../testUtilities/stubLocalization.js";

export interface AzureReposInvokerMocks {
  gitApi: IGitApi;
  azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  gitInvoker: GitInvoker;
  logger: Logger;
  runnerInvoker: RunnerInvoker;
  tokenManager: TokenManager;
}

/**
 * Creates the mocks and environment variable stubs required by
 * `azureReposInvoker.ts` tests. Individual tests can override any stub after
 * calling this helper.
 * @returns The paired mocks.
 */
export const createAzureReposInvokerMocks = (): AzureReposInvokerMocks => {
  stubEnv(
    ["BUILD_REPOSITORY_ID", "RepoID"],
    ["PR_METRICS_ACCESS_TOKEN", "PAT"],
    ["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI", "https://dev.azure.com/organization"],
    ["SYSTEM_TEAMPROJECT", "Project"],
  );

  const gitApi: IGitApi = mock<IGitApi>();
  const requestHandler: IRequestHandler = mock<IRequestHandler>();
  const webApi: WebApi = mock(WebApi);
  when(webApi.getGitApi()).thenResolve(resolvableInstance(gitApi));

  const azureDevOpsApiWrapper: AzureDevOpsApiWrapper = mock(
    AzureDevOpsApiWrapper,
  );
  when(azureDevOpsApiWrapper.getPersonalAccessTokenHandler("PAT")).thenReturn(
    instance(requestHandler),
  );
  when(
    azureDevOpsApiWrapper.getWebApiInstance(
      "https://dev.azure.com/organization",
      deepEqual(instance(requestHandler)),
    ),
  ).thenReturn(instance(webApi));

  const pullRequestId = 10;
  const gitInvoker: GitInvoker = mock(GitInvoker);
  when(gitInvoker.pullRequestId).thenReturn(pullRequestId);

  const logger: Logger = mock(Logger);

  const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);
  stubLocalization(runnerInvoker);

  const tokenManager: TokenManager = mock(TokenManager);

  return {
    azureDevOpsApiWrapper,
    gitApi,
    gitInvoker,
    logger,
    runnerInvoker,
    tokenManager,
  };
};
