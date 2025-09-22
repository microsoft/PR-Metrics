/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as Converter from "../../src/utilities/converter.js";
import { instance, mock, verify, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import CodeMetricsData from "../../src/metrics/codeMetricsData.js";
import CommentData from "../../src/repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import FileCommentData from "../../src/repos/interfaces/fileCommentData.js";
import { FixedLengthArrayInterface } from "../../src/utilities/fixedLengthArrayInterface.js";
import Inputs from "../../src/metrics/inputs.js";
import Logger from "../../src/utilities/logger.js";
import PullRequestCommentData from "../../src/repos/interfaces/pullRequestCommentData.js";
import PullRequestComments from "../../src/pullRequests/pullRequestComments.js";
import PullRequestCommentsData from "../../src/pullRequests/pullRequestCommentsData.js";
import ReposInvoker from "../../src/repos/reposInvoker.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";

describe("pullRequestComments.ts", (): void => {
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
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.commentFooter"),
    ).thenReturn(
      "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)",
    );
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.commentTitle"),
    ).thenReturn("# PR Metrics");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.largePullRequestComment",
        (400).toLocaleString(),
      ),
    ).thenReturn(
      `❌ **Try to keep pull requests smaller than ${(400).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**`,
    );
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.largePullRequestComment",
        (2000).toLocaleString(),
      ),
    ).thenReturn(
      `❌ **Try to keep pull requests smaller than ${(2000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**`,
    );
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.largePullRequestComment",
        (2000000).toLocaleString(),
      ),
    ).thenReturn(
      `❌ **Try to keep pull requests smaller than ${(2000000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**`,
    );
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.noReviewRequiredComment",
      ),
    ).thenReturn("❗ **This file doesn't require review.**");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.smallPullRequestComment",
      ),
    ).thenReturn("✔ **Thanks for keeping your pull request small.**");
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.tableIgnoredCode"),
    ).thenReturn("Ignored Code");
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.tableLines"),
    ).thenReturn("Lines");
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.tableProductCode"),
    ).thenReturn("Product Code");
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.tableSubtotal"),
    ).thenReturn("Subtotal");
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.tableTestCode"),
    ).thenReturn("Test Code");
    when(
      runnerInvoker.loc("pullRequests.pullRequestComments.tableTotal"),
    ).thenReturn("Total");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.testsInsufficientComment",
      ),
    ).thenReturn("⚠️ **Consider adding additional tests.**");
    when(
      runnerInvoker.loc(
        "pullRequests.pullRequestComments.testsSufficientComment",
      ),
    ).thenReturn("✔ **Thanks for adding tests.**");
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
      assert.equal(result, "❗ **This file doesn't require review.**");
      verify(
        logger.logDebug("* PullRequestComments.noReviewRequiredComment"),
      ).once();
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
      verify(logger.logDebug("* PullRequestComments.getCommentData()")).once();
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
          verify(
            logger.logDebug("* PullRequestComments.getCommentData()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.getMetricsCommentData()"),
          ).atLeast(1);
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
            verify(
              logger.logDebug("* PullRequestComments.getCommentData()"),
            ).once();
            verify(
              logger.logDebug(
                "* PullRequestComments.getFilesRequiringCommentUpdates()",
              ),
            ).atLeast(1);
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
            verify(
              logger.logDebug("* PullRequestComments.getCommentData()"),
            ).once();
            verify(
              logger.logDebug(
                "* PullRequestComments.getFilesRequiringCommentUpdates()",
              ),
            ).atLeast(1);
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
      verify(logger.logDebug("* PullRequestComments.getCommentData()")).once();
      verify(
        logger.logDebug("* PullRequestComments.getMetricsCommentData()"),
      ).once();
      verify(
        logger.logDebug(
          "* PullRequestComments.getFilesRequiringCommentUpdates()",
        ),
      ).twice();
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
      verify(logger.logDebug("* PullRequestComments.getCommentData()")).once();
      verify(
        logger.logDebug("* PullRequestComments.getMetricsCommentData()"),
      ).once();
      verify(
        logger.logDebug(
          "* PullRequestComments.getFilesRequiringCommentUpdates()",
        ),
      ).twice();
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
      verify(logger.logDebug("* PullRequestComments.getCommentData()")).once();
      verify(
        logger.logDebug("* PullRequestComments.getMetricsCommentData()"),
      ).once();
      verify(
        logger.logDebug(
          "* PullRequestComments.getFilesRequiringCommentUpdates()",
        ),
      ).twice();
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
      verify(logger.logDebug("* PullRequestComments.getCommentData()")).once();
      verify(
        logger.logDebug("* PullRequestComments.getMetricsCommentData()"),
      ).once();
      verify(
        logger.logDebug(
          "* PullRequestComments.getFilesRequiringCommentUpdates()",
        ),
      ).twice();
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
      verify(logger.logDebug("* PullRequestComments.getCommentData()")).once();
      verify(
        logger.logDebug("* PullRequestComments.getMetricsCommentData()"),
      ).once();
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
              "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)",
          );
          verify(
            logger.logDebug("* PullRequestComments.getMetricsComment()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.addCommentSizeStatus()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.addCommentTestStatus()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.addCommentMetrics()"),
          ).times(5);
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
              "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)",
          );
          verify(
            logger.logDebug("* PullRequestComments.getMetricsComment()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.addCommentSizeStatus()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.addCommentTestStatus()"),
          ).once();
          verify(
            logger.logDebug("* PullRequestComments.addCommentMetrics()"),
          ).times(5);
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
          "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)",
      );
      verify(
        logger.logDebug("* PullRequestComments.getMetricsComment()"),
      ).once();
      verify(
        logger.logDebug("* PullRequestComments.addCommentSizeStatus()"),
      ).once();
      verify(
        logger.logDebug("* PullRequestComments.addCommentTestStatus()"),
      ).once();
      verify(
        logger.logDebug("* PullRequestComments.addCommentMetrics()"),
      ).times(5);
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
          "[Metrics computed by PR Metrics. Add it to your Azure DevOps and GitHub PRs!](https://aka.ms/PRMetrics/Comment)",
      );
      verify(
        logger.logDebug("* PullRequestComments.getMetricsComment()"),
      ).once();
      verify(
        logger.logDebug("* PullRequestComments.addCommentSizeStatus()"),
      ).once();
      verify(
        logger.logDebug("* PullRequestComments.addCommentTestStatus()"),
      ).once();
      verify(
        logger.logDebug("* PullRequestComments.addCommentMetrics()"),
      ).times(5);
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
      verify(
        logger.logDebug("* PullRequestComments.getMetricsCommentStatus()"),
      ).once();
    });

    {
      const testCases: (boolean | null)[] = [true, null];

      testCases.forEach((sufficientlyTested: boolean | null): void => {
        it(`should return Closed when the pull request is small and has sufficient test coverage '${Converter.toString(sufficientlyTested)}'`, async (): Promise<void> => {
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
          verify(
            logger.logDebug("* PullRequestComments.getMetricsCommentStatus()"),
          ).once();
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
          it(`should return Active when the pull request small status is '${String(isSmall)}' and the sufficient test coverage status is '${Converter.toString(isSufficientlyTested)}'`, async (): Promise<void> => {
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
            verify(
              logger.logDebug(
                "* PullRequestComments.getMetricsCommentStatus()",
              ),
            ).once();
          });
        },
      );
    }
  });
});
