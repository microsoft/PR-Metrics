/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, mock, verify, when } from "ts-mockito";
import {
  localize,
  stubLocalization,
} from "../testUtilities/stubLocalization.js";
import {
  metricsCommentMarker,
  noReviewRequiredCommentMarker,
} from "../../src/utilities/constants.js";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import CodeMetricsData from "../../src/metrics/codeMetricsData.js";
import CommentData from "../../src/repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import FileCommentData from "../../src/repos/interfaces/fileCommentData.js";
import type { FixedLengthArrayInterface } from "../../src/utilities/fixedLengthArrayInterface.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import PullRequestCommentData from "../../src/repos/interfaces/pullRequestCommentData.js";
import PullRequestComments from "../../src/pullRequests/pullRequestComments.js";
import type PullRequestCommentsData from "../../src/pullRequests/pullRequestCommentsData.js";
import ReposInvoker from "../../src/repos/reposInvoker.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

describe("pullRequestComments.ts", (): void => {
  const authenticatedUserId = 1000;
  const foreignUserId = 2000;
  const noReviewRequiredContent = "❗ **This file doesn't require review.**";
  let complexGitPullRequestComments: CommentData;
  let codeMetrics: CodeMetrics;
  let inputs: Inputs;
  let logger: Logger;
  let reposInvoker: ReposInvoker;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    reposInvoker = mock(ReposInvoker);
    const pullRequestComment: PullRequestCommentData =
      new PullRequestCommentData(
        20,
        "# PR Metrics\n",
        CommentThreadStatus.Active,
      );
    const fileComment1: FileCommentData = new FileCommentData(
      30,
      "❗ **This file doesn't require review.**",
      "file2.ts",
      CommentThreadStatus.Active,
    );
    const fileComment2: FileCommentData = new FileCommentData(
      40,
      "❗ **This file doesn't require review.**",
      "file5.ts",
      CommentThreadStatus.Active,
    );
    complexGitPullRequestComments = new CommentData();
    complexGitPullRequestComments.pullRequestComments.push(pullRequestComment);
    complexGitPullRequestComments.fileComments.push(fileComment1, fileComment2);

    codeMetrics = mock(CodeMetrics);
    when(codeMetrics.isSmall()).thenResolve(true);
    when(codeMetrics.isSufficientlyTested()).thenResolve(true);
    when(codeMetrics.getMetrics()).thenResolve(
      new CodeMetricsData(1000, 1000, 1000),
    );
    when(codeMetrics.getFilesNotRequiringReview()).thenResolve([]);
    when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve([]);

    inputs = mock(Inputs);
    when(inputs.baseSize).thenReturn(200);

    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    stubLocalization(runnerInvoker);
  });

  describe("noReviewRequiredComment", (): void => {
    it("should return the expected result", (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: string = pullRequestComments.noReviewRequiredComment;

      // Assert
      assert.equal(
        result,
        "❗ **This file doesn't require review.**\n<!-- pr-metrics:no-review:v1 -->",
      );
    });
  });

  describe("getCommentData()", (): void => {
    it("should return the expected result when no comment is present", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.equal(result.metricsCommentContent, null);
      assert.deepEqual(result.filesNotRequiringReview, []);
      assert.deepEqual(result.deletedFilesNotRequiringReview, []);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    {
      const testCases: PullRequestCommentData[][] = [
        [new PullRequestCommentData(20, "# PR Metrics\n")],
        [
          new PullRequestCommentData(20, "# PR Metrics"),
          new PullRequestCommentData(20, "# PR Metrics\n"),
        ],
      ];

      testCases.forEach((data: PullRequestCommentData[]): void => {
        it("should return the expected result when the metrics comment is present", async (): Promise<void> => {
          // Arrange
          const comments: CommentData = new CommentData();
          comments.pullRequestComments.push(...data);
          when(reposInvoker.getComments()).thenResolve(comments);
          const pullRequestComments: PullRequestComments =
            new PullRequestComments(
              instance(codeMetrics),
              instance(inputs),
              instance(logger),
              instance(reposInvoker),
              instance(runnerInvoker),
            );

          // Act
          const result: PullRequestCommentsData =
            await pullRequestComments.getCommentData();

          // Assert
          assert.equal(result.metricsCommentThreadId, 20);
          assert.equal(
            result.metricsCommentThreadStatus,
            CommentThreadStatus.Unknown,
          );
          assert.equal(result.metricsCommentContent, "# PR Metrics\n");
          assert.deepEqual(result.filesNotRequiringReview, []);
          assert.deepEqual(result.deletedFilesNotRequiringReview, []);
          assert.deepEqual(result.commentThreadsRequiringDeletion, []);
        });
      });
    }

    {
      interface TestCaseType {
        fileComments: FileCommentData[];
        filesNotRequiringReview: string[];
      }

      const testCases: TestCaseType[] = [
        {
          fileComments: [
            new FileCommentData(
              20,
              "❗ **This file doesn't require review.**",
              "file2.ts",
            ),
          ],
          filesNotRequiringReview: ["folder/file1.ts", "file3.ts"],
        },
        {
          fileComments: [
            new FileCommentData(20, "Content", "folder/file1.ts"),
            new FileCommentData(
              20,
              "❗ **This file doesn't require review.**",
              "file2.ts",
            ),
          ],
          filesNotRequiringReview: ["folder/file1.ts", "file3.ts"],
        },
        {
          fileComments: [
            new FileCommentData(
              20,
              "❗ **This file doesn't require review.**",
              "folder/file1.ts",
            ),
            new FileCommentData(
              20,
              "❗ **This file doesn't require review.**",
              "file2.ts",
            ),
          ],
          filesNotRequiringReview: ["file3.ts"],
        },
      ];

      testCases.forEach(
        ({ fileComments, filesNotRequiringReview }: TestCaseType): void => {
          it(`should return the expected result for files not requiring review when the comment is present with files '${JSON.stringify(fileComments)}'`, async (): Promise<void> => {
            // Arrange
            const comments: CommentData = new CommentData();
            comments.fileComments.push(...fileComments);
            when(reposInvoker.getComments()).thenResolve(comments);
            when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
              "folder/file1.ts",
              "file2.ts",
              "file3.ts",
            ]);
            const pullRequestComments: PullRequestComments =
              new PullRequestComments(
                instance(codeMetrics),
                instance(inputs),
                instance(logger),
                instance(reposInvoker),
                instance(runnerInvoker),
              );

            // Act
            const result: PullRequestCommentsData =
              await pullRequestComments.getCommentData();

            // Assert
            assert.equal(result.metricsCommentThreadId, null);
            assert.equal(result.metricsCommentThreadStatus, null);
            assert.equal(result.metricsCommentContent, null);
            assert.deepEqual(
              result.filesNotRequiringReview,
              filesNotRequiringReview,
            );
            assert.deepEqual(result.deletedFilesNotRequiringReview, []);
            assert.deepEqual(result.commentThreadsRequiringDeletion, []);
          });
        },
      );
    }

    {
      interface TestCaseType {
        deletedFilesNotRequiringReview: string[];
        fileComments: FileCommentData[];
      }

      const testCases: TestCaseType[] = [
        {
          deletedFilesNotRequiringReview: ["folder/file1.ts", "file3.ts"],
          fileComments: [
            new FileCommentData(
              0,
              "❗ **This file doesn't require review.**",
              "file2.ts",
            ),
          ],
        },
        {
          deletedFilesNotRequiringReview: ["folder/file1.ts", "file3.ts"],
          fileComments: [
            new FileCommentData(0, "Content", "folder/file1.ts"),
            new FileCommentData(
              0,
              "❗ **This file doesn't require review.**",
              "file2.ts",
            ),
          ],
        },
        {
          deletedFilesNotRequiringReview: ["file3.ts"],
          fileComments: [
            new FileCommentData(
              0,
              "❗ **This file doesn't require review.**",
              "folder/file1.ts",
            ),
            new FileCommentData(
              0,
              "❗ **This file doesn't require review.**",
              "file2.ts",
            ),
          ],
        },
      ];

      testCases.forEach(
        ({
          deletedFilesNotRequiringReview,
          fileComments,
        }: TestCaseType): void => {
          it(`should return the expected result for deleted files not requiring review when the comment is present with files '${JSON.stringify(fileComments)}'`, async (): Promise<void> => {
            // Arrange
            const comments: CommentData = new CommentData();
            comments.fileComments.push(...fileComments);
            when(reposInvoker.getComments()).thenResolve(comments);
            when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve([
              "folder/file1.ts",
              "file2.ts",
              "file3.ts",
            ]);
            const pullRequestComments: PullRequestComments =
              new PullRequestComments(
                instance(codeMetrics),
                instance(inputs),
                instance(logger),
                instance(reposInvoker),
                instance(runnerInvoker),
              );

            // Act
            const result: PullRequestCommentsData =
              await pullRequestComments.getCommentData();

            // Assert
            assert.equal(result.metricsCommentThreadId, null);
            assert.equal(result.metricsCommentThreadStatus, null);
            assert.equal(result.metricsCommentContent, null);
            assert.deepEqual(result.filesNotRequiringReview, []);
            assert.deepEqual(
              result.deletedFilesNotRequiringReview,
              deletedFilesNotRequiringReview,
            );
            assert.deepEqual(result.commentThreadsRequiringDeletion, []);
          });
        },
      );
    }

    it("should return the expected result when all comment types are present in files not requiring review", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(
        complexGitPullRequestComments,
      );
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
        "folder/file1.ts",
        "file2.ts",
        "file5.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(
        result.metricsCommentThreadStatus,
        CommentThreadStatus.Active,
      );
      assert.equal(result.metricsCommentContent, "# PR Metrics\n");
      assert.deepEqual(result.filesNotRequiringReview, ["folder/file1.ts"]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, []);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should return the expected result when all comment types are present in deleted files not requiring review", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(
        complexGitPullRequestComments,
      );
      when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve([
        "folder/file1.ts",
        "file2.ts",
        "file5.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(
        result.metricsCommentThreadStatus,
        CommentThreadStatus.Active,
      );
      assert.equal(result.metricsCommentContent, "# PR Metrics\n");
      assert.deepEqual(result.filesNotRequiringReview, []);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "folder/file1.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should return the expected result when all comment types are present in both modified and deleted files not requiring review", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(
        complexGitPullRequestComments,
      );
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
        "folder/file1.ts",
        "file2.ts",
      ]);
      when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve([
        "file3.ts",
        "file5.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(
        result.metricsCommentThreadStatus,
        CommentThreadStatus.Active,
      );
      assert.equal(result.metricsCommentContent, "# PR Metrics\n");
      assert.deepEqual(result.filesNotRequiringReview, ["folder/file1.ts"]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, ["file3.ts"]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should return the expected result when all comment types are present in both modified and deleted files not requiring review and comments need to be deleted", async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(
        complexGitPullRequestComments,
      );
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
        "folder/file1.ts",
        "file2.ts",
      ]);
      when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve([
        "file3.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(
        result.metricsCommentThreadStatus,
        CommentThreadStatus.Active,
      );
      assert.equal(result.metricsCommentContent, "# PR Metrics\n");
      assert.deepEqual(result.filesNotRequiringReview, ["folder/file1.ts"]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, ["file3.ts"]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, [40]);
    });

    it("should continue when no comment content is present", async (): Promise<void> => {
      // Arrange
      const pullRequestComment: PullRequestCommentData =
        new PullRequestCommentData(0, "");
      const fileComment: FileCommentData = new FileCommentData(
        0,
        "",
        "file.ts",
      );
      const comments: CommentData = new CommentData();
      comments.pullRequestComments.push(pullRequestComment);
      comments.fileComments.push(fileComment);
      when(reposInvoker.getComments()).thenResolve(comments);
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve(["file.ts"]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.equal(result.metricsCommentContent, null);
      assert.deepEqual(result.filesNotRequiringReview, ["file.ts"]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should match the metrics comment when it contains the marker and is owned", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.pullRequestComments.push(
        new PullRequestCommentData(
          20,
          `Metrics\n${metricsCommentMarker}`,
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(
        result.metricsCommentContent,
        `Metrics\n${metricsCommentMarker}`,
      );
      assert.equal(result.isMetricsCommentAmbiguous, false);
    });

    it("should match a legacy metrics comment without a marker when it is owned", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.pullRequestComments.push(
        new PullRequestCommentData(
          20,
          "# PR Metrics\n",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(result.metricsCommentContent, "# PR Metrics\n");
    });

    {
      interface TestCaseType {
        authorId: number | null;
        description: string;
      }

      const testCases: TestCaseType[] = [
        {
          authorId: foreignUserId,
          description: "another principal",
        },
        {
          authorId: null,
          description: "no associated user",
        },
      ];

      testCases.forEach(
        ({ authorId, description }: TestCaseType): void => {
          it(`should ignore a spoofed metrics comment created by ${description}`, async (): Promise<void> => {
            // Arrange
            const comments: CommentData = new CommentData();
            comments.authenticatedUserId = authenticatedUserId;
            comments.pullRequestComments.push(
              new PullRequestCommentData(
                20,
                `# PR Metrics\n${metricsCommentMarker}`,
                CommentThreadStatus.Active,
                authorId,
              ),
            );
            when(reposInvoker.getComments()).thenResolve(comments);
            const pullRequestComments: PullRequestComments =
              new PullRequestComments(
                instance(codeMetrics),
                instance(inputs),
                instance(logger),
                instance(reposInvoker),
                instance(runnerInvoker),
              );

            // Act
            const result: PullRequestCommentsData =
              await pullRequestComments.getCommentData();

            // Assert
            assert.equal(result.metricsCommentThreadId, null);
            assert.equal(result.metricsCommentContent, null);
            assert.equal(result.metricsCommentThreadStatus, null);
            assert.equal(result.isMetricsCommentAmbiguous, false);
          });
        },
      );
    }

    it("should ignore a legacy metrics comment created by another principal", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.pullRequestComments.push(
        new PullRequestCommentData(
          20,
          "# PR Metrics\n",
          CommentThreadStatus.Active,
          foreignUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
    });

    it("should treat comments as owned when the authenticated principal is unknown", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.pullRequestComments.push(
        new PullRequestCommentData(20, "# PR Metrics\n"),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, 20);
      assert.equal(result.metricsCommentContent, "# PR Metrics\n");
    });

    it("should skip the metrics comment when multiple owned comments are present", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.pullRequestComments.push(
        new PullRequestCommentData(
          20,
          "# PR Metrics\n",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
        new PullRequestCommentData(
          21,
          `# PR Metrics\n${metricsCommentMarker}`,
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.equal(result.isMetricsCommentAmbiguous, true);
      verify(
        logger.logWarning(
          localize(
            "pullRequests.pullRequestComments.multipleMetricsComments",
            "2",
          ),
        ),
      ).once();
    });

    it("should match the no review required comment when it contains the marker and is owned", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.fileComments.push(
        new FileCommentData(
          30,
          `${noReviewRequiredContent}\n${noReviewRequiredCommentMarker}`,
          "file1.ts",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
        "file1.ts",
        "file2.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.deepEqual(result.filesNotRequiringReview, ["file2.ts"]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should ignore a spoofed no review required comment created by another principal", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.fileComments.push(
        new FileCommentData(
          30,
          `${noReviewRequiredContent}\n${noReviewRequiredCommentMarker}`,
          "file1.ts",
          CommentThreadStatus.Active,
          foreignUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
        "file1.ts",
        "file2.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should not delete a no review required comment created by another principal", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.fileComments.push(
        new FileCommentData(
          30,
          noReviewRequiredContent,
          "file1.ts",
          CommentThreadStatus.Active,
          foreignUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should skip files with multiple owned no review required comments", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.fileComments.push(
        new FileCommentData(
          30,
          noReviewRequiredContent,
          "file1.ts",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
        new FileCommentData(
          31,
          `${noReviewRequiredContent}\n${noReviewRequiredCommentMarker}`,
          "file1.ts",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve([
        "file1.ts",
        "file2.ts",
      ]);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.deepEqual(result.filesNotRequiringReview, ["file2.ts"]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
      verify(
        logger.logWarning(
          localize(
            "pullRequests.pullRequestComments.multipleNoReviewRequiredComments",
            "file1.ts",
            "2",
          ),
        ),
      ).once();
    });
    it("should skip deleting files with multiple owned no review required comments", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.fileComments.push(
        new FileCommentData(
          30,
          noReviewRequiredContent,
          "file1.ts",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
        new FileCommentData(
          31,
          noReviewRequiredContent,
          "file1.ts",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });

    it("should delete an owned no review required comment when the file requires review", async (): Promise<void> => {
      // Arrange
      const comments: CommentData = new CommentData();
      comments.authenticatedUserId = authenticatedUserId;
      comments.fileComments.push(
        new FileCommentData(
          30,
          `${noReviewRequiredContent}\n${noReviewRequiredCommentMarker}`,
          "file1.ts",
          CommentThreadStatus.Active,
          authenticatedUserId,
        ),
      );
      when(reposInvoker.getComments()).thenResolve(comments);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: PullRequestCommentsData =
        await pullRequestComments.getCommentData();

      // Assert
      assert.deepEqual(result.commentThreadsRequiringDeletion, [30]);
    });
  });

  describe("getMetricsComment()", (): void => {
    {
      const testCases: FixedLengthArrayInterface<number, 5>[] = [
        [0, 0, 0, 0, 0],
        [1, 0, 1, 0, 1],
        [1, 1, 2, 1, 3],
        [1000, 1000, 2000, 1000, 3000],
        [1000000, 1000000, 2000000, 1000000, 3000000],
      ];

      testCases.forEach((code: FixedLengthArrayInterface<number, 5>): void => {
        it(`should return the expected result for metrics '[${String(code[0])}, ${String(code[1])}, ${String(code[2])}, ${String(code[3])}, ${String(code[4])}]'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.getMetrics()).thenResolve(
            new CodeMetricsData(code[0], code[1], code[3]),
          );
          const pullRequestComments: PullRequestComments =
            new PullRequestComments(
              instance(codeMetrics),
              instance(inputs),
              instance(logger),
              instance(reposInvoker),
              instance(runnerInvoker),
            );

          // Act
          const result: string = await pullRequestComments.getMetricsComment();

          // Assert
          assert.equal(
            result,
            "# PR Metrics\n" +
              "✔ **Thanks for keeping your pull request small.**\n" +
              "✔ **Thanks for adding tests.**\n" +
              "||Lines\n" +
              "-|-:\n" +
              `Product Code|${code[0].toLocaleString() === "0" ? "-" : code[0].toLocaleString()}\n` +
              `Test Code|${code[1].toLocaleString() === "0" ? "-" : code[1].toLocaleString()}\n` +
              `**Subtotal**|**${code[2].toLocaleString() === "0" ? "-" : code[2].toLocaleString()}**\n` +
              `Ignored Code|${code[3].toLocaleString() === "0" ? "-" : code[3].toLocaleString()}\n` +
              `**Total**|**${code[4].toLocaleString() === "0" ? "-" : code[4].toLocaleString()}**\n` +
              "\n" +
              "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)\n" +
              "<!-- pr-metrics:metrics:v1 -->",
          );
        });
      });
    }

    {
      const testCases: number[] = [200, 1000, 1000000];

      testCases.forEach((baseSize: number): void => {
        it(`should return the expected result when the pull request is not small and the base size is '${String(baseSize)}'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.isSmall()).thenResolve(false);
          when(inputs.baseSize).thenReturn(baseSize);
          when(inputs.growthRate).thenReturn(2);
          const pullRequestComments: PullRequestComments =
            new PullRequestComments(
              instance(codeMetrics),
              instance(inputs),
              instance(logger),
              instance(reposInvoker),
              instance(runnerInvoker),
            );

          // Act
          const result: string = await pullRequestComments.getMetricsComment();

          // Assert
          assert.equal(
            result,
            "# PR Metrics\n" +
              `❌ **Try to keep pull requests smaller than ${(baseSize * 2).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**\n` +
              "✔ **Thanks for adding tests.**\n" +
              "||Lines\n" +
              "-|-:\n" +
              `Product Code|${(1000).toLocaleString()}\n` +
              `Test Code|${(1000).toLocaleString()}\n` +
              `**Subtotal**|**${(2000).toLocaleString()}**\n` +
              `Ignored Code|${(1000).toLocaleString()}\n` +
              `**Total**|**${(3000).toLocaleString()}**\n` +
              "\n" +
              "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)\n" +
              "<!-- pr-metrics:metrics:v1 -->",
          );
        });
      });
    }

    it("should return the expected result when the pull request has insufficient test coverage", async (): Promise<void> => {
      // Arrange
      when(codeMetrics.isSufficientlyTested()).thenResolve(false);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: string = await pullRequestComments.getMetricsComment();

      // Assert
      assert.equal(
        result,
        "# PR Metrics\n" +
          "✔ **Thanks for keeping your pull request small.**\n" +
          "⚠️ **Consider adding additional tests.**\n" +
          "||Lines\n" +
          "-|-:\n" +
          `Product Code|${(1000).toLocaleString()}\n` +
          `Test Code|${(1000).toLocaleString()}\n` +
          `**Subtotal**|**${(2000).toLocaleString()}**\n` +
          `Ignored Code|${(1000).toLocaleString()}\n` +
          `**Total**|**${(3000).toLocaleString()}**\n` +
          "\n" +
          "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)\n" +
          "<!-- pr-metrics:metrics:v1 -->",
      );
    });

    it("should return the expected result when the pull request does not require a specific level of test coverage", async (): Promise<void> => {
      // Arrange
      when(codeMetrics.isSufficientlyTested()).thenResolve(null);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: string = await pullRequestComments.getMetricsComment();

      // Assert
      assert.equal(
        result,
        "# PR Metrics\n" +
          "✔ **Thanks for keeping your pull request small.**\n" +
          "||Lines\n" +
          "-|-:\n" +
          `Product Code|${(1000).toLocaleString()}\n` +
          `Test Code|${(1000).toLocaleString()}\n` +
          `**Subtotal**|**${(2000).toLocaleString()}**\n` +
          `Ignored Code|${(1000).toLocaleString()}\n` +
          `**Total**|**${(3000).toLocaleString()}**\n` +
          "\n" +
          "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)\n" +
          "<!-- pr-metrics:metrics:v1 -->",
      );
    });
  });

  describe("getMetricsCommentStatus()", (): void => {
    it("should return Closed when the always-close-comment mode is enabled", async (): Promise<void> => {
      // Arrange
      when(inputs.alwaysCloseComment).thenReturn(true);
      const pullRequestComments: PullRequestComments = new PullRequestComments(
        instance(codeMetrics),
        instance(inputs),
        instance(logger),
        instance(reposInvoker),
        instance(runnerInvoker),
      );

      // Act
      const result: CommentThreadStatus =
        await pullRequestComments.getMetricsCommentStatus();

      // Assert
      assert.equal(result, CommentThreadStatus.Closed);
    });

    {
      const testCases: (boolean | null)[] = [true, null];

      testCases.forEach((sufficientlyTested: boolean | null): void => {
        it(`should return Closed when the pull request is small and has sufficient test coverage '${String(sufficientlyTested)}'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.isSmall()).thenResolve(true);
          when(codeMetrics.isSufficientlyTested()).thenResolve(
            sufficientlyTested,
          );
          const pullRequestComments: PullRequestComments =
            new PullRequestComments(
              instance(codeMetrics),
              instance(inputs),
              instance(logger),
              instance(reposInvoker),
              instance(runnerInvoker),
            );

          // Act
          const result: CommentThreadStatus =
            await pullRequestComments.getMetricsCommentStatus();

          // Assert
          assert.equal(result, CommentThreadStatus.Closed);
        });
      });
    }

    {
      interface TestCaseType {
        isSmall: boolean;
        isSufficientlyTested: boolean | null;
      }

      const testCases: TestCaseType[] = [
        {
          isSmall: true,
          isSufficientlyTested: false,
        },
        {
          isSmall: false,
          isSufficientlyTested: true,
        },
        {
          isSmall: false,
          isSufficientlyTested: false,
        },
        {
          isSmall: false,
          isSufficientlyTested: null,
        },
      ];

      testCases.forEach(
        ({ isSmall, isSufficientlyTested }: TestCaseType): void => {
          it(`should return Active when the pull request small status is '${String(isSmall)}' and the sufficient test coverage status is '${String(isSufficientlyTested)}'`, async (): Promise<void> => {
            // Arrange
            when(codeMetrics.isSmall()).thenResolve(isSmall);
            when(codeMetrics.isSufficientlyTested()).thenResolve(
              isSufficientlyTested,
            );
            const pullRequestComments: PullRequestComments =
              new PullRequestComments(
                instance(codeMetrics),
                instance(inputs),
                instance(logger),
                instance(reposInvoker),
                instance(runnerInvoker),
              );

            // Act
            const result: CommentThreadStatus =
              await pullRequestComments.getMetricsCommentStatus();

            // Assert
            assert.equal(result, CommentThreadStatus.Active);
          });
        },
      );
    }
  });
});
