/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import CodeMetricsCalculator from "../../src/metrics/codeMetricsCalculator.js";
import CommentData from "../../src/repos/interfaces/commentData.js";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import PullRequest from "../../src/pullRequests/pullRequest.js";
import PullRequestComments from "../../src/pullRequests/pullRequestComments.js";
import PullRequestLabels from "../../src/pullRequests/pullRequestLabels.js";
import PullRequestMetrics from "../../src/pullRequestMetrics.js";
import ReposInvoker from "../../src/repos/reposInvoker.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";
import { stubEnv } from "../testUtilities/stubEnv.js";
import { stubLocalization } from "../testUtilities/stubLocalization.js";

describe("automatic PR labels integration", (): void => {
  interface TestCase {
    diff: string;
    labels: string[];
    title: string;
    factor?: string;
    patterns?: string;
  }

  const runMetrics = async (
    testCase: TestCase,
    provider: string,
  ): Promise<void> => {
    stubEnv(
      ["GITHUB_ACTION", provider === "Actions" ? "PR-Metrics" : undefined],
      ["GITHUB_BASE_REF", "main"],
      ["BUILD_REPOSITORY_PROVIDER", provider],
      ["SYSTEM_PULLREQUEST_PULLREQUESTID", "42"],
    );
    const logger: Logger = mock(Logger);
    const runnerInvoker: RunnerInvoker = mock(RunnerInvoker);
    stubLocalization(runnerInvoker);
    when(runnerInvoker.getInput(deepEqual(["Test", "Factor"]))).thenReturn(
      testCase.factor ?? null,
    );
    when(
      runnerInvoker.getInput(deepEqual(["File", "Matching", "Patterns"])),
    ).thenReturn(testCase.patterns ?? null);
    const inputs: Inputs = new Inputs(
      instance(logger),
      instance(runnerInvoker),
    );
    const gitInvoker: GitInvoker = mock(GitInvoker);
    when(gitInvoker.isGitRepo()).thenResolve(true);
    when(gitInvoker.isPullRequestIdAvailable()).thenReturn(true);
    when(gitInvoker.isGitHistoryAvailable()).thenResolve(true);
    when(gitInvoker.getDiffSummary()).thenResolve(testCase.diff);
    const codeMetrics: CodeMetrics = new CodeMetrics(
      instance(gitInvoker),
      inputs,
      instance(logger),
      instance(runnerInvoker),
    );
    const azure: AzureReposInvoker = mock(AzureReposInvoker);
    const github: GitHubReposInvoker = mock(GitHubReposInvoker);
    const selected: AzureReposInvoker | GitHubReposInvoker =
      provider === "TfsGit" ? azure : github;
    const other: AzureReposInvoker | GitHubReposInvoker =
      provider === "TfsGit" ? github : azure;
    let labels: string[] = [
      "bug",
      "pr-metrics:10XL",
      "pr-metrics:tests-sufficient",
      "pr-metrics:tests-insufficient",
    ];
    let title: string | null = null;
    const comments: string[] = [];
    when(selected.isAccessTokenAvailable()).thenResolve(null);
    when(selected.getTitleAndDescription()).thenResolve({
      description: "Description",
      title: "Add feature",
    });
    when(selected.getComments()).thenResolve(new CommentData());
    when(selected.getLabels()).thenCall((): string[] => [...labels]);
    when(selected.addLabels(any())).thenCall((names: string[]): void => {
      labels.push(...names);
    });
    when(selected.removeLabel(any())).thenCall((name: string): void => {
      labels = labels.filter((label: string): boolean => label !== name);
    });
    when(selected.setTitleAndDescription(any(), any())).thenCall(
      (updatedTitle: string | null): void => {
        title = updatedTitle;
      },
    );
    when(selected.createComment(any(), any(), any(), any())).thenCall(
      (content: string): void => {
        comments.push(content);
      },
    );
    const reposInvoker: ReposInvoker = new ReposInvoker(
      instance(azure),
      instance(github),
      instance(logger),
    );
    const pullRequest: PullRequest = new PullRequest(
      codeMetrics,
      instance(logger),
      instance(runnerInvoker),
    );
    const pullRequestComments: PullRequestComments = new PullRequestComments(
      codeMetrics,
      inputs,
      instance(logger),
      reposInvoker,
      instance(runnerInvoker),
    );
    const pullRequestLabels: PullRequestLabels = new PullRequestLabels(
      codeMetrics,
      instance(logger),
      reposInvoker,
    );
    const calculator: CodeMetricsCalculator = new CodeMetricsCalculator(
      instance(gitInvoker),
      instance(logger),
      pullRequest,
      pullRequestComments,
      pullRequestLabels,
      reposInvoker,
      instance(runnerInvoker),
    );
    const sut: PullRequestMetrics = new PullRequestMetrics(
      calculator,
      instance(logger),
      instance(runnerInvoker),
    );

    await sut.run("Folder");

    assert.deepEqual(labels.toSorted(), ["bug", ...testCase.labels].toSorted());
    assert.equal(title, testCase.title);
    assert.ok(
      comments.some((content: string): boolean =>
        content.startsWith("# PR Metrics"),
      ),
    );
    verify(gitInvoker.getDiffSummary()).once();
    verify(runnerInvoker.setStatusSucceeded(any())).once();
    verify(runnerInvoker.setStatusFailed(any())).never();
    verify(other.getLabels()).never();
  };

  const boundaryCases: TestCase[] = [
    {
      diff: "199\t0\tfile.ts",
      labels: ["pr-metrics:XS", "pr-metrics:tests-insufficient"],
      title: "XS⚠️ ◾ Add feature",
    },
    {
      diff: "200\t0\tfile.ts",
      labels: ["pr-metrics:S", "pr-metrics:tests-insufficient"],
      title: "S⚠️ ◾ Add feature",
    },
    {
      diff: "399\t0\tfile.ts",
      labels: ["pr-metrics:S", "pr-metrics:tests-insufficient"],
      title: "S⚠️ ◾ Add feature",
    },
    {
      diff: "400\t0\tfile.ts",
      labels: ["pr-metrics:M", "pr-metrics:tests-insufficient"],
      title: "M⚠️ ◾ Add feature",
    },
    {
      diff: "799\t0\tfile.ts",
      labels: ["pr-metrics:M", "pr-metrics:tests-insufficient"],
      title: "M⚠️ ◾ Add feature",
    },
    {
      diff: "800\t0\tfile.ts",
      labels: ["pr-metrics:L", "pr-metrics:tests-insufficient"],
      title: "L⚠️ ◾ Add feature",
    },
    {
      diff: "1599\t0\tfile.ts",
      labels: ["pr-metrics:L", "pr-metrics:tests-insufficient"],
      title: "L⚠️ ◾ Add feature",
    },
    {
      diff: "1600\t0\tfile.ts",
      labels: ["pr-metrics:XL", "pr-metrics:tests-insufficient"],
      title: "XL⚠️ ◾ Add feature",
    },
    {
      diff: "3199\t0\tfile.ts",
      labels: ["pr-metrics:XL", "pr-metrics:tests-insufficient"],
      title: "XL⚠️ ◾ Add feature",
    },
    {
      diff: "3200\t0\tfile.ts",
      labels: ["pr-metrics:2XL", "pr-metrics:tests-insufficient"],
      title: "2XL⚠️ ◾ Add feature",
    },
    {
      diff: "100\t0\tfile.ts\n99\t0\ttest.ts",
      factor: "1",
      labels: ["pr-metrics:XS", "pr-metrics:tests-insufficient"],
      title: "XS⚠️ ◾ Add feature",
    },
    {
      diff: "100\t0\tfile.ts\n100\t0\ttest.ts",
      factor: "1",
      labels: ["pr-metrics:XS", "pr-metrics:tests-sufficient"],
      title: "XS✔ ◾ Add feature",
    },
    {
      diff: "400\t0\tfile.ts",
      factor: "0",
      labels: ["pr-metrics:M"],
      title: "M ◾ Add feature",
    },
    {
      diff: "100\t0\ttest.ts",
      labels: ["pr-metrics:XS", "pr-metrics:tests-sufficient"],
      title: "XS✔ ◾ Add feature",
    },
    {
      diff: "0\t100\tfile.ts",
      labels: ["pr-metrics:XS", "pr-metrics:tests-sufficient"],
      title: "XS✔ ◾ Add feature",
    },
    {
      diff: "400\t0\texcluded.ts",
      labels: ["pr-metrics:XS", "pr-metrics:tests-sufficient"],
      patterns: "**/*\n!excluded.ts",
      title: "XS✔ ◾ Add feature",
    },
  ];

  boundaryCases.forEach((testCase: TestCase): void => {
    it(`should match labels to title '${testCase.title}' for diff '${testCase.diff}'`, async (): Promise<void> => {
      await runMetrics(testCase, "Actions");
    });
  });

  ["TfsGit", "GitHub", "GitHubEnterprise"].forEach((provider: string): void => {
    it(`should automatically update labels, title, and comments for '${provider}' in Azure Pipelines`, async (): Promise<void> => {
      await runMetrics(
        {
          diff: "400\t0\tfile.ts\n400\t0\ttest.ts",
          labels: ["pr-metrics:M", "pr-metrics:tests-sufficient"],
          title: "M✔ ◾ Add feature",
        },
        provider,
      );
    });
  });
});
