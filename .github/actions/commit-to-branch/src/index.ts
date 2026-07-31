/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  getBooleanInput,
  getInput,
  setFailed,
  setOutput,
  setSecret,
} from "@actions/core";
import ActionLogger from "./actionLogger.js";
import CommitCreator from "./commitCreator.js";
import type CommitResultInterface from "./interfaces/commitResultInterface.js";
import FetchHttpClient from "./fetchHttpClient.js";
import GitClient from "./gitClient.js";
import GitCommandRunner from "./gitCommandRunner.js";
import GitHubCommitApi from "./gitHubCommitApi.js";
import GitHubGraphQlClient from "./gitHubGraphQlClient.js";

const defaultEndpoint = "https://api.github.com/graphql";
const nameWithOwnerElements = 2;

const splitRepository = (value: string): string[] => {
  const elements: string[] = value.split("/");
  if (elements.length !== nameWithOwnerElements) {
    throw new Error(
      "The 'repository' input must be in 'owner/repository' format.",
    );
  }

  return elements;
};

const run = async (): Promise<void> => {
  const token: string = getInput("token", { required: true });
  setSecret(token);
  const [owner, repository]: string[] = splitRepository(
    getInput("repository", { required: true }),
  );
  const creator: CommitCreator = new CommitCreator(
    new GitClient(new GitCommandRunner(process.cwd())),
    new GitHubCommitApi(
      new GitHubGraphQlClient(
        process.env.GITHUB_GRAPHQL_URL ?? defaultEndpoint,
        token,
        new FetchHttpClient(),
      ),
    ),
    new ActionLogger(),
  );
  const result: CommitResultInterface = await creator.create({
    branch: getInput("branch", { required: true }),
    createBranch: getBooleanInput("create-branch"),
    message: getInput("commit-message", { required: true }),
    owner: owner ?? "",
    repository: repository ?? "",
    stageAll: getBooleanInput("stage-all"),
  });
  setOutput("committed", String(result.committed));
  setOutput("commit-sha", result.objectId ?? "");
};

run().catch((error: unknown): void => {
  setFailed(error instanceof Error ? error.message : String(error));
});
