/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import { instance, mock, verify, when } from "ts-mockito";
import CodeMetricsCalculator from "../../src/metrics/codeMetricsCalculator.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import PullRequest from "../../src/pullRequests/pullRequest.js";
import PullRequestComments from "../../src/pullRequests/pullRequestComments.js";
import PullRequestCommentsData from "../../src/pullRequests/pullRequestCommentsData.js";
import ReposInvoker from "../../src/repos/reposInvoker.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

describe("codeMetricsCalculator.ts", (): void => {
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let pullRequest: PullRequest;
  let pullRequestComments: PullRequestComments;
  let reposInvoker: ReposInvoker;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    reposInvoker = mock(ReposInvoker);
    when(reposInvoker.isAccessTokenAvailable()).thenResolve(null);

    gitInvoker = mock(GitInvoker);
    when(gitInvoker.isGitRepo()).thenResolve(true);
    when(gitInvoker.isPullRequestIdAvailable()).thenReturn(true);
    when(gitInvoker.isGitHistoryAvailable()).thenResolve(true);

    logger = mock(Logger);

    pullRequest = mock(PullRequest);
    when(pullRequest.isPullRequest).thenReturn(true);
    when(pullRequest.isSupportedProvider).thenReturn(true);

    pullRequestComments = mock(PullRequestComments);

    runnerInvoker = mock(RunnerInvoker);
    when(
      runnerInvoker.loc("metrics.codeMetricsCalculator.noGitRepoAzureDevOps"),
    ).thenReturn(
      "No Git repo present. Remove 'checkout: none' (YAML) or disable 'Don't sync sources' under the build process phase settings (classic).",
    );
    when(
      runnerInvoker.loc("metrics.codeMetricsCalculator.noGitRepoGitHub"),
    ).thenReturn(
      "No Git repo present. Run the 'actions/checkout' action prior to PR Metrics.",
    );
    when(
      runnerInvoker.loc(
        "metrics.codeMetricsCalculator.noGitHistoryAzureDevOps",
      ),
    ).thenReturn(
      "Could not access sufficient Git history. Set 'fetchDepth: 0' as a parameter to the 'checkout' task (YAML) or disable 'Shallow fetch' under the build process phase settings (classic).",
    );
    when(
      runnerInvoker.loc("metrics.codeMetricsCalculator.noGitHistoryGitHub"),
    ).thenReturn(
      "Could not access sufficient Git history. Add 'fetch-depth: 0' as a parameter to the 'actions/checkout' action.",
    );
    when(
      runnerInvoker.loc(
        "metrics.codeMetricsCalculator.noPullRequestIdAzureDevOps",
      ),
    ).thenReturn("Could not determine the Pull Request ID.");
    when(
      runnerInvoker.loc("metrics.codeMetricsCalculator.noPullRequestIdGitHub"),
    ).thenReturn(
      "Could not determine the Pull Request ID. Ensure 'pull_request' is the pipeline trigger.",
    );
    when(
      runnerInvoker.loc("metrics.codeMetricsCalculator.noPullRequest"),
    ).thenReturn("The build is not running against a pull request.");
    when(
      runnerInvoker.loc(
        "metrics.codeMetricsCalculator.unsupportedProvider",
        "Other",
      ),
    ).thenReturn(
      "The build is running against a pull request from 'Other', which is not a supported provider.",
    );
  });

  describe("shouldSkipWithUnsupportedProvider", (): void => {
    it("should return null when the task should not be skipped", (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip;

      // Assert
      assert.equal(result, null);
      verify(logger.logDebug("* CodeMetricsCalculator.shouldSkip")).once();
    });

    it("should return the appropriate message when not a supported provider", (): void => {
      // Arrange
      when(pullRequest.isPullRequest).thenReturn(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip;

      // Assert
      assert.equal(result, "The build is not running against a pull request.");
      verify(logger.logDebug("* CodeMetricsCalculator.shouldSkip")).once();
    });

    it("should return null when the task should not be skipped", (): void => {
      // Arrange
      when(pullRequest.isSupportedProvider).thenReturn("Other");
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip;

      // Assert
      assert.equal(
        result,
        "The build is running against a pull request from 'Other', which is not a supported provider.",
      );
      verify(logger.logDebug("* CodeMetricsCalculator.shouldSkip")).once();
    });
  });

  describe("shouldStop()", (): void => {
    it("should return null when the task should not terminate", async (): Promise<void> => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(result, null);
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();
    });

    it("should return the appropriate message when no access token is available", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.isAccessTokenAvailable()).thenResolve(
        "No Access Token",
      );
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(result, "No Access Token");
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();
    });

    it("should return the appropriate message when not called from a Git repo on Azure DevOps", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isGitRepo()).thenResolve(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(
        result,
        "No Git repo present. Remove 'checkout: none' (YAML) or disable 'Don't sync sources' under the build process phase settings (classic).",
      );
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();
    });

    it("should return the appropriate message when not called from a Git repo on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      when(gitInvoker.isGitRepo()).thenResolve(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(
        result,
        "No Git repo present. Run the 'actions/checkout' action prior to PR Metrics.",
      );
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should return the appropriate message when the pull request ID is not available on Azure DevOps", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isPullRequestIdAvailable()).thenReturn(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(result, "Could not determine the Pull Request ID.");
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();
    });

    it("should return the appropriate message when the pull request ID is not available on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      when(gitInvoker.isPullRequestIdAvailable()).thenReturn(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(
        result,
        "Could not determine the Pull Request ID. Ensure 'pull_request' is the pipeline trigger.",
      );
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should return the appropriate message when the Git history is unavailable on Azure DevOps", async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isGitHistoryAvailable()).thenResolve(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(
        result,
        "Could not access sufficient Git history. Set 'fetchDepth: 0' as a parameter to the 'checkout' task (YAML) or disable 'Shallow fetch' under the build process phase settings (classic).",
      );
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();
    });

    it("should return the appropriate message when the Git history is unavailable on GitHub", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      when(gitInvoker.isGitHistoryAvailable()).thenResolve(false);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop();

      // Assert
      assert.equal(
        result,
        "Could not access sufficient Git history. Add 'fetch-depth: 0' as a parameter to the 'actions/checkout' action.",
      );
      verify(logger.logDebug("* CodeMetricsCalculator.shouldStop()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });
  });

  describe("updateDetails()", (): void => {
    it("should perform the expected actions", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getTitleAndDescription()).thenResolve({
        description: "Description",
        title: "Title",
      });
      when(pullRequest.getUpdatedTitle("Title")).thenResolve("S✔ ◾ Title");
      when(pullRequest.getUpdatedDescription("Description")).thenReturn(
        "Description",
      );
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      await codeMetricsCalculator.updateDetails();

      // Assert
      verify(logger.logDebug("* CodeMetricsCalculator.updateDetails()")).once();
      verify(pullRequest.getUpdatedTitle("Title")).once();
      verify(pullRequest.getUpdatedDescription("Description")).once();
      verify(
        reposInvoker.setTitleAndDescription("S✔ ◾ Title", "Description"),
      ).once();
    });

    it("should perform the expected actions when the description is missing", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getTitleAndDescription()).thenResolve({
        description: null,
        title: "Title",
      });
      when(pullRequest.getUpdatedTitle("Title")).thenResolve("S✔ ◾ Title");
      when(pullRequest.getUpdatedDescription(null)).thenReturn("Description");
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      await codeMetricsCalculator.updateDetails();

      // Assert
      verify(logger.logDebug("* CodeMetricsCalculator.updateDetails()")).once();
      verify(pullRequest.getUpdatedTitle("Title")).once();
      verify(pullRequest.getUpdatedDescription(null)).once();
      verify(
        reposInvoker.setTitleAndDescription("S✔ ◾ Title", "Description"),
      ).once();
    });
  });

  describe("updateComments()", (): void => {
    it("should succeed when no comment updates are necessary", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      commentData.metricsCommentThreadId = 1;
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      await codeMetricsCalculator.updateComments();

      // Assert
      verify(
        logger.logDebug("* CodeMetricsCalculator.updateComments()"),
      ).once();
    });

    it("should perform the expected actions when the metrics comment is to be updated", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      commentData.metricsCommentThreadId = 1;
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      when(pullRequestComments.getMetricsComment()).thenResolve("Description");
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(
        CommentThreadStatus.Active,
      );
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      await codeMetricsCalculator.updateComments();

      // Assert
      verify(
        logger.logDebug("* CodeMetricsCalculator.updateComments()"),
      ).once();
      verify(
        logger.logDebug("* CodeMetricsCalculator.updateMetricsComment()"),
      ).once();
      verify(
        reposInvoker.updateComment(
          1,
          "Description",
          CommentThreadStatus.Active,
        ),
      ).once();
    });

    it("should perform the expected actions when the metrics comment is to be updated and there is no existing thread", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      when(pullRequestComments.getMetricsComment()).thenResolve("Description");
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(
        CommentThreadStatus.Active,
      );
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      await codeMetricsCalculator.updateComments();

      // Assert
      verify(
        logger.logDebug("* CodeMetricsCalculator.updateComments()"),
      ).once();
      verify(
        logger.logDebug("* CodeMetricsCalculator.updateMetricsComment()"),
      ).once();
      verify(
        reposInvoker.createComment(
          "Description",
          null,
          CommentThreadStatus.Active,
        ),
      ).once();
    });

    {
      interface TestCaseType {
        deletedFiles: string[];
        file1Comments: number;
        file2Comments: number;
      }

      const testCases: TestCaseType[] = [
        {
          deletedFiles: ["file1.ts"],
          file1Comments: 1,
          file2Comments: 0,
        },
        {
          deletedFiles: ["file1.ts", "file2.ts"],
          file1Comments: 1,
          file2Comments: 1,
        },
        {
          deletedFiles: [],
          file1Comments: 0,
          file2Comments: 0,
        },
        {
          deletedFiles: ["file1.ts", "file2.ts"],
          file1Comments: 1,
          file2Comments: 1,
        },
      ];

      testCases.forEach(
        ({
          deletedFiles,
          file1Comments,
          file2Comments,
        }: TestCaseType): void => {
          it(`should succeed when comments are to be added to files not requiring review '${JSON.stringify(deletedFiles)}'`, async (): Promise<void> => {
            // Arrange
            const commentData: PullRequestCommentsData =
              new PullRequestCommentsData(deletedFiles, []);
            commentData.metricsCommentThreadId = 1;
            when(pullRequestComments.getCommentData()).thenResolve(commentData);
            when(pullRequestComments.noReviewRequiredComment).thenReturn(
              "No Review Required",
            );
            const codeMetricsCalculator: CodeMetricsCalculator =
              new CodeMetricsCalculator(
                instance(gitInvoker),
                instance(logger),
                instance(pullRequest),
                instance(pullRequestComments),
                instance(reposInvoker),
                instance(runnerInvoker),
              );

            // Act
            await codeMetricsCalculator.updateComments();

            // Assert
            verify(
              logger.logDebug("* CodeMetricsCalculator.updateComments()"),
            ).once();
            verify(
              logger.logDebug(
                "* CodeMetricsCalculator.updateNoReviewRequiredComment()",
              ),
            ).times(file1Comments + file2Comments);
            verify(
              reposInvoker.createComment(
                "No Review Required",
                "file1.ts",
                CommentThreadStatus.Closed,
                false,
              ),
            ).times(file1Comments);
            verify(
              reposInvoker.createComment(
                "No Review Required",
                "file2.ts",
                CommentThreadStatus.Closed,
                false,
              ),
            ).times(file2Comments);
          });
        },
      );

      testCases.forEach(
        ({
          deletedFiles,
          file1Comments,
          file2Comments,
        }: TestCaseType): void => {
          it(`should succeed when comments are to be added to deleted files not requiring review '${JSON.stringify(deletedFiles)}'`, async (): Promise<void> => {
            // Arrange
            const commentData: PullRequestCommentsData =
              new PullRequestCommentsData([], deletedFiles);
            commentData.metricsCommentThreadId = 1;
            when(pullRequestComments.getCommentData()).thenResolve(commentData);
            when(pullRequestComments.noReviewRequiredComment).thenReturn(
              "No Review Required",
            );
            const codeMetricsCalculator: CodeMetricsCalculator =
              new CodeMetricsCalculator(
                instance(gitInvoker),
                instance(logger),
                instance(pullRequest),
                instance(pullRequestComments),
                instance(reposInvoker),
                instance(runnerInvoker),
              );

            // Act
            await codeMetricsCalculator.updateComments();

            // Assert
            verify(
              logger.logDebug("* CodeMetricsCalculator.updateComments()"),
            ).once();
            verify(
              logger.logDebug(
                "* CodeMetricsCalculator.updateNoReviewRequiredComment()",
              ),
            ).times(file1Comments + file2Comments);
            verify(
              reposInvoker.createComment(
                "No Review Required",
                "file1.ts",
                CommentThreadStatus.Closed,
                true,
              ),
            ).times(file1Comments);
            verify(
              reposInvoker.createComment(
                "No Review Required",
                "file2.ts",
                CommentThreadStatus.Closed,
                true,
              ),
            ).times(file2Comments);
          });
        },
      );
    }

    it("should succeed when comments are to be deleted from files ", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      commentData.commentThreadsRequiringDeletion.push(1, 2);
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      const codeMetricsCalculator: CodeMetricsCalculator =
        new CodeMetricsCalculator(
          instance(gitInvoker),
          instance(logger),
          instance(pullRequest),
          instance(pullRequestComments),
          instance(reposInvoker),
          instance(runnerInvoker),
        );

      // Act
      await codeMetricsCalculator.updateComments();

      // Assert
      verify(
        logger.logDebug("* CodeMetricsCalculator.updateComments()"),
      ).once();
      verify(reposInvoker.deleteCommentThread(1)).once();
      verify(reposInvoker.deleteCommentThread(2)).once();
    });
  });
});
