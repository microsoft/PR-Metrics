/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import { instance, mock, verify, when } from "ts-mockito";
import {
  localize,
  stubLocalization,
} from "../testUtilities/stubLocalization.js";
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
import { maxCommentMutations } from "../../src/utilities/constants.js";
import { stubEnv } from "../testUtilities/stubEnv.js";
import { toThrowAsync } from "../testUtilities/assertExtensions.js";

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
    stubLocalization(runnerInvoker);
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
    });

    it("should return the appropriate message when not called from a Git repo on GitHub", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
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
    });

    it("should return the appropriate message when the pull request ID is not available on GitHub", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
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
    });

    it("should return the appropriate message when the Git history is unavailable on GitHub", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
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
      verify(reposInvoker.deleteCommentThread(1)).once();
      verify(reposInvoker.deleteCommentThread(2)).once();
    });

    it("should not update the metrics comment when the content and status are unchanged", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      commentData.metricsCommentThreadId = 1;
      commentData.metricsCommentContent = "Description";
      commentData.metricsCommentThreadStatus = CommentThreadStatus.Active;
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
      verify(reposInvoker.updateComment(anyNumber(), any(), any())).never();
      verify(reposInvoker.createComment(any(), any(), any())).never();
    });

    it("should update the metrics comment when only the status is changed", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      commentData.metricsCommentThreadId = 1;
      commentData.metricsCommentContent = "Description";
      commentData.metricsCommentThreadStatus = CommentThreadStatus.Active;
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      when(pullRequestComments.getMetricsComment()).thenResolve("Description");
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(
        CommentThreadStatus.Closed,
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
        reposInvoker.updateComment(1, null, CommentThreadStatus.Closed),
      ).once();
    });

    it("should skip the metrics comment when multiple owned comments are present", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        [],
        [],
      );
      commentData.isMetricsCommentAmbiguous = true;
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
      verify(reposInvoker.createComment(any(), any(), any())).never();
      verify(reposInvoker.updateComment(anyNumber(), any(), any())).never();
    });

    it("should deduplicate the comment mutations", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file1.ts"],
        ["file2.ts", "file2.ts"],
      );
      commentData.metricsCommentThreadId = 1;
      commentData.commentThreadsRequiringDeletion.push(2, 2, 3);
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
      verify(reposInvoker.deleteCommentThread(2)).once();
      verify(reposInvoker.deleteCommentThread(3)).once();
      verify(
        reposInvoker.createComment(
          "No Review Required",
          "file1.ts",
          CommentThreadStatus.Closed,
          false,
        ),
      ).once();
      verify(
        reposInvoker.createComment(
          "No Review Required",
          "file2.ts",
          CommentThreadStatus.Closed,
          true,
        ),
      ).once();
    });

    it("should create comments for as many files as the mutation budget permits", async (): Promise<void> => {
      // Arrange
      const excessFileCount = 5;
      const permittedFileCount: number = maxCommentMutations - 1;
      const files: string[] = [];
      for (
        let index = 0;
        index < permittedFileCount + excessFileCount;
        index += 1
      ) {
        files.push(`file${String(index)}.ts`);
      }

      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        files,
        [],
      );
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      when(pullRequestComments.getMetricsComment()).thenResolve("Description");
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(
        CommentThreadStatus.Active,
      );
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
        reposInvoker.createComment(
          "Description",
          null,
          CommentThreadStatus.Active,
        ),
      ).once();
      for (let index = 0; index < permittedFileCount; index += 1) {
        verify(
          reposInvoker.createComment(
            "No Review Required",
            `file${String(index)}.ts`,
            CommentThreadStatus.Closed,
            false,
          ),
        ).once();
      }

      for (let index = permittedFileCount; index < files.length; index += 1) {
        verify(
          reposInvoker.createComment(
            "No Review Required",
            `file${String(index)}.ts`,
            CommentThreadStatus.Closed,
            false,
          ),
        ).never();
      }

      verify(
        logger.logWarning(
          localize(
            "metrics.codeMetricsCalculator.skippedCommentMutations",
            excessFileCount.toLocaleString(),
            maxCommentMutations.toLocaleString(),
          ),
        ),
      ).once();
    });

    it("should perform no more than the maximum number of comment mutations", async (): Promise<void> => {
      // Arrange
      const deletionCount = 10;
      const files: string[] = [];
      for (let index = 0; index < maxCommentMutations * 2; index += 1) {
        files.push(`file${String(index)}.ts`);
      }

      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        files,
        [],
      );
      commentData.metricsCommentThreadId = 1;
      commentData.metricsCommentContent = "Old Description";
      for (let index = 0; index < deletionCount; index += 1) {
        commentData.commentThreadsRequiringDeletion.push(index + 1);
      }

      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      when(pullRequestComments.getMetricsComment()).thenResolve("Description");
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(
        CommentThreadStatus.Active,
      );
      when(pullRequestComments.noReviewRequiredComment).thenReturn(
        "No Review Required",
      );

      let mutationCount = 0;
      const incrementMutationCount = (): void => {
        mutationCount += 1;
      };

      when(reposInvoker.createComment(any(), any(), any())).thenCall(
        incrementMutationCount,
      );
      when(reposInvoker.createComment(any(), any(), any(), any())).thenCall(
        incrementMutationCount,
      );
      when(reposInvoker.updateComment(any(), any(), any())).thenCall(
        incrementMutationCount,
      );
      when(reposInvoker.deleteCommentThread(any())).thenCall(
        incrementMutationCount,
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
      assert.equal(mutationCount, maxCommentMutations);
      verify(
        reposInvoker.updateComment(
          1,
          "Description",
          CommentThreadStatus.Active,
        ),
      ).once();
      for (let index = 0; index < deletionCount; index += 1) {
        verify(reposInvoker.deleteCommentThread(index + 1)).once();
      }

      verify(
        logger.logWarning(
          localize(
            "metrics.codeMetricsCalculator.skippedCommentMutations",
            (
              files.length -
              (maxCommentMutations - deletionCount - 1)
            ).toLocaleString(),
            maxCommentMutations.toLocaleString(),
          ),
        ),
      ).once();
    });

    it("should not warn when the comment mutations fit within the budget", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts"],
        [],
      );
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
      verify(logger.logWarning(anyString())).never();
    });

    it("should not retry a comment creation that fails", async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts"],
        [],
      );
      commentData.metricsCommentThreadId = 1;
      when(pullRequestComments.getCommentData()).thenResolve(commentData);
      when(pullRequestComments.noReviewRequiredComment).thenReturn(
        "No Review Required",
      );
      when(
        reposInvoker.createComment(
          "No Review Required",
          "file1.ts",
          CommentThreadStatus.Closed,
          false,
        ),
      ).thenReject(new Error("Error"));
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
      const func: () => Promise<void> = async (): Promise<void> =>
        codeMetricsCalculator.updateComments();

      // Assert
      await toThrowAsync(func, "Error");
      verify(
        reposInvoker.createComment(
          "No Review Required",
          "file1.ts",
          CommentThreadStatus.Closed,
          false,
        ),
      ).once();
    });
  });
});
