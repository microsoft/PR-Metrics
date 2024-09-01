/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces";
import PullRequestCommentsData from "../../src/pullRequests/pullRequestCommentsData";
import assert from "node:assert/strict";

describe("pullRequestCommentsData.ts", (): void => {
  describe("constructor()", (): void => {
    it("should set the correct data", (): void => {
      // Act
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "file3.ts",
        "file4.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });
  });

  describe("metricsCommentThreadId", (): void => {
    it("should set the correct data", (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Act
      result.metricsCommentThreadId = 1;

      // Assert
      assert.equal(result.metricsCommentThreadId, 1);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "file3.ts",
        "file4.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });
  });

  describe("metricsCommentContent", (): void => {
    it("should set the correct data", (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Act
      result.metricsCommentContent = "Content";

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, "Content");
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "file3.ts",
        "file4.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });
  });

  describe("metricsCommentThreadStatus", (): void => {
    it("should set the correct data", (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Act
      result.metricsCommentThreadStatus = CommentThreadStatus.Active;

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(
        result.metricsCommentThreadStatus,
        CommentThreadStatus.Active,
      );
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "file3.ts",
        "file4.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });
  });

  describe("filesNotRequiringReview", (): void => {
    it("should set the correct data", (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Act
      result.filesNotRequiringReview = ["file5.ts"];

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.deepEqual(result.filesNotRequiringReview, ["file5.ts"]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "file3.ts",
        "file4.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });
  });

  describe("deletedFilesNotRequiringReview", (): void => {
    it("should set the correct data", (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Act
      result.deletedFilesNotRequiringReview = ["file5.ts"];

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, ["file5.ts"]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, []);
    });
  });

  describe("commentThreadsRequiringDeletion", (): void => {
    it("should set the correct data", (): void => {
      // Arrange
      const result: PullRequestCommentsData = new PullRequestCommentsData(
        ["file1.ts", "file2.ts"],
        ["file3.ts", "file4.ts"],
      );

      // Act
      result.commentThreadsRequiringDeletion = [1, 2];

      // Assert
      assert.equal(result.metricsCommentThreadId, null);
      assert.equal(result.metricsCommentContent, null);
      assert.equal(result.metricsCommentThreadStatus, null);
      assert.deepEqual(result.filesNotRequiringReview, [
        "file1.ts",
        "file2.ts",
      ]);
      assert.deepEqual(result.deletedFilesNotRequiringReview, [
        "file3.ts",
        "file4.ts",
      ]);
      assert.deepEqual(result.commentThreadsRequiringDeletion, [1, 2]);
    });
  });
});
