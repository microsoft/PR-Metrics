/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'reflect-metadata'
import * as AssertExtensions from '../testUtilities/assertExtensions'
import { instance, mock, verify } from 'ts-mockito'
import AzureReposInvoker from '../../src/repos/azureReposInvoker'
import CommentData from '../../src/repos/interfaces/commentData'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import Logger from '../../src/utilities/logger'
import PullRequestDetailsInterface from '../../src/repos/interfaces/pullRequestDetailsInterface'
import ReposInvoker from '../../src/repos/reposInvoker'
import assert from 'node:assert/strict'

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
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
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
      verify(logger.logDebug("* ReposInvoker.isAccessTokenAvailable()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
      assert.equal(result, null);

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke Azure Repos when called from an appropriate repo twice", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
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
      verify(
        logger.logDebug("* ReposInvoker.isAccessTokenAvailable()"),
      ).twice();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).twice();
      assert.equal(result1, null);
      assert.equal(result2, null);

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
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
      verify(logger.logDebug("* ReposInvoker.isAccessTokenAvailable()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
      assert.equal(result, null);

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
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
          verify(
            logger.logDebug("* ReposInvoker.isAccessTokenAvailable()"),
          ).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
          assert.equal(result, null);

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
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
      verify(logger.logDebug("* ReposInvoker.isAccessTokenAvailable()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
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
      verify(logger.logDebug("* ReposInvoker.isAccessTokenAvailable()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("getTitleAndDescription()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: PullRequestDetailsInterface = await reposInvoker.getTitleAndDescription()

      // Assert
      verify(azureReposInvoker.getTitleAndDescription()).once();
      verify(gitHubReposInvoker.getTitleAndDescription()).never();
      verify(logger.logDebug("* ReposInvoker.getTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
      assert.equal(result, null);

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const result: PullRequestDetailsInterface = await reposInvoker.getTitleAndDescription()

      // Assert
      verify(azureReposInvoker.getTitleAndDescription()).never();
      verify(gitHubReposInvoker.getTitleAndDescription()).once();
      verify(logger.logDebug("* ReposInvoker.getTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
      assert.equal(result, null);

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          const result: PullRequestDetailsInterface = await reposInvoker.getTitleAndDescription()

          // Assert
          verify(azureReposInvoker.getTitleAndDescription()).never();
          verify(gitHubReposInvoker.getTitleAndDescription()).once();
          verify(
            logger.logDebug("* ReposInvoker.getTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
          assert.equal(result, null);

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () => reposInvoker.getTitleAndDescription()

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(azureReposInvoker.getTitleAndDescription()).never();
      verify(gitHubReposInvoker.getTitleAndDescription()).never();
      verify(logger.logDebug("* ReposInvoker.getTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<PullRequestDetailsInterface> = async () => reposInvoker.getTitleAndDescription()

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(azureReposInvoker.getTitleAndDescription()).never();
      verify(gitHubReposInvoker.getTitleAndDescription()).never();
      verify(logger.logDebug("* ReposInvoker.getTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("getComments()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
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
      verify(logger.logDebug("* ReposInvoker.getComments()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
      assert.equal(result, null);

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
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
      verify(logger.logDebug("* ReposInvoker.getComments()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
      assert.equal(result, null);

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
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
          verify(logger.logDebug("* ReposInvoker.getComments()")).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
          assert.equal(result, null);

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
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
      verify(logger.logDebug("* ReposInvoker.getComments()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
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
      verify(logger.logDebug("* ReposInvoker.getComments()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("setTitleAndDescription()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
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
      verify(logger.logDebug("* ReposInvoker.setTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
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
      verify(logger.logDebug("* ReposInvoker.setTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
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
          verify(
            logger.logDebug("* ReposInvoker.setTitleAndDescription()"),
          ).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
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
      verify(logger.logDebug("* ReposInvoker.setTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
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
      verify(logger.logDebug("* ReposInvoker.setTitleAndDescription()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("createComment()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.createComment(
        "",
        CommentThreadStatus.Active,
        "",
        false,
      );

      // Assert
      verify(
        azureReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).once();
      verify(
        gitHubReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).never();
      verify(logger.logDebug("* ReposInvoker.createComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.createComment(
        "",
        CommentThreadStatus.Active,
        "",
        false,
      );

      // Assert
      verify(
        azureReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).never();
      verify(
        gitHubReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).once();
      verify(logger.logDebug("* ReposInvoker.createComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          await reposInvoker.createComment(
            "",
            CommentThreadStatus.Active,
            "",
            false,
          );

          // Assert
          verify(
            azureReposInvoker.createComment(
              "",
              CommentThreadStatus.Active,
              "",
              false,
            ),
          ).never();
          verify(
            gitHubReposInvoker.createComment(
              "",
              CommentThreadStatus.Active,
              "",
              false,
            ),
          ).once();
          verify(logger.logDebug("* ReposInvoker.createComment()")).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.createComment("", CommentThreadStatus.Active, "", false);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'BUILD_REPOSITORY_PROVIDER', accessed within 'ReposInvoker.getReposInvoker()', is invalid, null, or undefined 'undefined'.",
      );
      verify(
        azureReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).never();
      verify(
        gitHubReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).never();
      verify(logger.logDebug("* ReposInvoker.createComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      const func: () => Promise<void> = async () =>
        reposInvoker.createComment("", CommentThreadStatus.Active, "", false);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "BUILD_REPOSITORY_PROVIDER 'Other' is unsupported.",
      );
      verify(
        azureReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).never();
      verify(
        gitHubReposInvoker.createComment(
          "",
          CommentThreadStatus.Active,
          "",
          false,
        ),
      ).never();
      verify(logger.logDebug("* ReposInvoker.createComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("updateComment()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.updateComment(0, null, null);

      // Assert
      verify(azureReposInvoker.updateComment(0, null, null)).once();
      verify(gitHubReposInvoker.updateComment(0, null, null)).never();
      verify(logger.logDebug("* ReposInvoker.updateComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const reposInvoker: ReposInvoker = new ReposInvoker(
        instance(azureReposInvoker),
        instance(gitHubReposInvoker),
        instance(logger),
      );

      // Act
      await reposInvoker.updateComment(0, null, null);

      // Assert
      verify(azureReposInvoker.updateComment(0, null, null)).never();
      verify(gitHubReposInvoker.updateComment(0, null, null)).once();
      verify(logger.logDebug("* ReposInvoker.updateComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
          const reposInvoker: ReposInvoker = new ReposInvoker(
            instance(azureReposInvoker),
            instance(gitHubReposInvoker),
            instance(logger),
          );

          // Act
          await reposInvoker.updateComment(0, null, null);

          // Assert
          verify(azureReposInvoker.updateComment(0, null, null)).never();
          verify(gitHubReposInvoker.updateComment(0, null, null)).once();
          verify(logger.logDebug("* ReposInvoker.updateComment()")).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
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
      verify(gitHubReposInvoker.updateComment(0, null, null)).never();
      verify(logger.logDebug("* ReposInvoker.updateComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
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
      verify(gitHubReposInvoker.updateComment(0, null, null)).never();
      verify(logger.logDebug("* ReposInvoker.updateComment()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });

  describe("deleteCommentThread()", (): void => {
    it("should invoke Azure Repos when called from an appropriate repo", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
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
      verify(logger.logDebug("* ReposInvoker.deleteCommentThread()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });

    it("should invoke GitHub when called from a GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
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
      verify(logger.logDebug("* ReposInvoker.deleteCommentThread()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should invoke GitHub when called from a repo on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
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
          verify(
            logger.logDebug("* ReposInvoker.deleteCommentThread()"),
          ).once();
          verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw when the repo type is not set", async (): Promise<void> => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
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
      verify(logger.logDebug("* ReposInvoker.deleteCommentThread()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();
    });

    it("should throw when the repo type is set to an invalid value", async (): Promise<void> => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = "Other";
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
      verify(logger.logDebug("* ReposInvoker.deleteCommentThread()")).once();
      verify(logger.logDebug("* ReposInvoker.getReposInvoker()")).once();

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER;
    });
  });
});
