/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { instance, mock, verify } from "ts-mockito";
import AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import type CommentData from "../../src/repos/interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import Logger from "../../src/utilities/logger.js";
import type PullRequestDetailsInterface from "../../src/repos/interfaces/pullRequestDetailsInterface.js";
import ReposInvoker from "../../src/repos/reposInvoker.js";
import assert from "node:assert/strict";
import { stubEnv } from "../testUtilities/stubEnv.js";

describe("reposInvoker.ts", (): void => {
  let azureReposInvoker: AzureReposInvoker;
  let gitHubReposInvoker: GitHubReposInvoker;
  let logger: Logger;

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker);
    gitHubReposInvoker = mock(GitHubReposInvoker);
    logger = mock(Logger);
  });

  describe("isAccessTokenAvailable()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: string | null = await reposInvoker.isAccessTokenAvailable();

      // Assert
      verify(azureReposInvoker.isAccessTokenAvailable()).once();
      verify(gitHubReposInvoker.isAccessTokenAvailable()).never();
      assert.equal(result, null);
    });

    it("should invoke Azure Repos when called from an appropriate repo twice", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result1: string | null =
        await reposInvoker.isAccessTokenAvailable();
      const result2: string | null =
        await reposInvoker.isAccessTokenAvailable();

      // Assert
      verify(azureReposInvoker.isAccessTokenAvailable()).twice();
      verify(gitHubReposInvoker.isAccessTokenAvailable()).never();
      assert.equal(result1, null);
      assert.equal(result2, null);
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: string | null = await reposInvoker.isAccessTokenAvailable();

      // Assert
      verify(azureReposInvoker.isAccessTokenAvailable()).never();
      verify(gitHubReposInvoker.isAccessTokenAvailable()).once();
      assert.equal(result, null);
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          const result: string | null =
            await reposInvoker.isAccessTokenAvailable();

          // Assert
          verify(azureReposInvoker.isAccessTokenAvailable()).never();
          verify(gitHubReposInvoker.isAccessTokenAvailable()).once();
          assert.equal(result, null);
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<string | null> = async () =>
        reposInvoker.isAccessTokenAvailable();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.isAccessTokenAvailable()).never();
      verify(gitHubReposInvoker.isAccessTokenAvailable()).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<string | null> = async () =>
        reposInvoker.isAccessTokenAvailable();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.isAccessTokenAvailable()).never();
      verify(gitHubReposInvoker.isAccessTokenAvailable()).never();
    });
  });

  describe("getTitleAndDescription()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await reposInvoker.getTitleAndDescription();

      // Assert
      verify(azureReposInvoker.getTitleAndDescription()).once();
      verify(gitHubReposInvoker.getTitleAndDescription()).never();
      assert.equal(result, null);
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: PullRequestDetailsInterface =
        await reposInvoker.getTitleAndDescription();

      // Assert
      verify(azureReposInvoker.getTitleAndDescription()).never();
      verify(gitHubReposInvoker.getTitleAndDescription()).once();
      assert.equal(result, null);
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          const result: PullRequestDetailsInterface =
            await reposInvoker.getTitleAndDescription();

          // Assert
          verify(azureReposInvoker.getTitleAndDescription()).never();
          verify(gitHubReposInvoker.getTitleAndDescription()).once();
          assert.equal(result, null);
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () =>
        reposInvoker.getTitleAndDescription();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.getTitleAndDescription()).never();
      verify(gitHubReposInvoker.getTitleAndDescription()).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () =>
        reposInvoker.getTitleAndDescription();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.getTitleAndDescription()).never();
      verify(gitHubReposInvoker.getTitleAndDescription()).never();
    });
  });

  describe("getComments()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: CommentData = await reposInvoker.getComments();

      // Assert
      verify(azureReposInvoker.getComments()).once();
      verify(gitHubReposInvoker.getComments()).never();
      assert.equal(result, null);
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: CommentData = await reposInvoker.getComments();

      // Assert
      verify(azureReposInvoker.getComments()).never();
      verify(gitHubReposInvoker.getComments()).once();
      assert.equal(result, null);
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          const result: CommentData = await reposInvoker.getComments();

          // Assert
          verify(azureReposInvoker.getComments()).never();
          verify(gitHubReposInvoker.getComments()).once();
          assert.equal(result, null);
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<CommentData> = async () =>
        reposInvoker.getComments();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.getComments()).never();
      verify(gitHubReposInvoker.getComments()).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<CommentData> = async () =>
        reposInvoker.getComments();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.getComments()).never();
      verify(gitHubReposInvoker.getComments()).never();
    });
  });

  describe("setTitleAndDescription()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.setTitleAndDescription(null, null);

      // Assert
      verify(azureReposInvoker.setTitleAndDescription(null, null)).once();
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never();
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.setTitleAndDescription(null, null);

      // Assert
      verify(azureReposInvoker.setTitleAndDescription(null, null)).never();
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          await reposInvoker.setTitleAndDescription(null, null);

          // Assert
          verify(azureReposInvoker.setTitleAndDescription(null, null)).never();
          verify(gitHubReposInvoker.setTitleAndDescription(null, null)).once();
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.setTitleAndDescription(null, null);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.setTitleAndDescription(null, null)).never();
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.setTitleAndDescription(null, null);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.setTitleAndDescription(null, null)).never();
      verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never();
    });
  });

  describe("createComment()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.createComment(
        "",
        "",
        CommentThreadStatus.Active,
        false,
      );

      // Assert
      verify(
        azureReposInvoker.createComment(
          "",
          "",
          CommentThreadStatus.Active,
          false,
        ),
      ).once();
      verify(
        gitHubReposInvoker.createComment(
          "",
          "",
          // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
          CommentThreadStatus.Active,
          false,
        ),
      ).never();
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.createComment(
        "",
        "",
        CommentThreadStatus.Active,
        false,
      );

      // Assert
      verify(
        azureReposInvoker.createComment(
          "",
          "",
          CommentThreadStatus.Active,
          false,
        ),
      ).never();
      verify(
        gitHubReposInvoker.createComment(
          "",
          "",
          // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
          CommentThreadStatus.Active,
          false,
        ),
      ).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          await reposInvoker.createComment(
            "",
            "",
            CommentThreadStatus.Active,
            false,
          );

          // Assert
          verify(
            azureReposInvoker.createComment(
              "",
              "",
              CommentThreadStatus.Active,
              false,
            ),
          ).never();
          verify(
            gitHubReposInvoker.createComment(
              "",
              "",
              // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
              CommentThreadStatus.Active,
              false,
            ),
          ).once();
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.createComment("", "", CommentThreadStatus.Active, false);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(
        azureReposInvoker.createComment(
          "",
          "",
          CommentThreadStatus.Active,
          false,
        ),
      ).never();
      verify(
        gitHubReposInvoker.createComment(
          "",
          "",
          // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
          CommentThreadStatus.Active,
          false,
        ),
      ).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.createComment("", "", CommentThreadStatus.Active, false);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(
        azureReposInvoker.createComment(
          "",
          "",
          CommentThreadStatus.Active,
          false,
        ),
      ).never();
      verify(
        gitHubReposInvoker.createComment(
          "",
          "",
          // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
          CommentThreadStatus.Active,
          false,
        ),
      ).never();
    });
  });

  describe("updateComment()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.updateComment(0, null, null);

      // Assert
      verify(azureReposInvoker.updateComment(0, null, null)).once();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubReposInvoker.updateComment(0, null, null)).never();
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.updateComment(0, null, null);

      // Assert
      verify(azureReposInvoker.updateComment(0, null, null)).never();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubReposInvoker.updateComment(0, null, null)).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          await reposInvoker.updateComment(0, null, null);

          // Assert
          verify(azureReposInvoker.updateComment(0, null, null)).never();
          // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
          verify(gitHubReposInvoker.updateComment(0, null, null)).once();
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.updateComment(0, null, null);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.updateComment(0, null, null)).never();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubReposInvoker.updateComment(0, null, null)).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.updateComment(0, null, null);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.updateComment(0, null, null)).never();
      // @ts-expect-error -- Interface is called with additional parameters not present in implementation.
      verify(gitHubReposInvoker.updateComment(0, null, null)).never();
    });
  });

  describe("deleteCommentThread()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.deleteCommentThread(20);

      // Assert
      verify(azureReposInvoker.deleteCommentThread(20)).once();
      verify(gitHubReposInvoker.deleteCommentThread(20)).never();
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.deleteCommentThread(20);

      // Assert
      verify(azureReposInvoker.deleteCommentThread(20)).never();
      verify(gitHubReposInvoker.deleteCommentThread(20)).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          await reposInvoker.deleteCommentThread(20);

          // Assert
          verify(azureReposInvoker.deleteCommentThread(20)).never();
          verify(gitHubReposInvoker.deleteCommentThread(20)).once();
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.deleteCommentThread(20);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.deleteCommentThread(20)).never();
      verify(gitHubReposInvoker.deleteCommentThread(20)).never();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", "Other"]);
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.deleteCommentThread(20);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.deleteCommentThread(20)).never();
      verify(gitHubReposInvoker.deleteCommentThread(20)).never();
    });
  });
});
