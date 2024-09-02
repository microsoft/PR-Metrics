/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import * as AssertExtensions from "../testUtilities/assertExtensions";
import { instance, mock, verify, when } from "ts-mockito";
import { ExecOutput } from "@actions/exec";
import GitInvoker from "../../src/git/gitInvoker";
import Logger from "../../src/utilities/logger";
import RunnerInvoker from "../../src/runners/runnerInvoker";
import assert from "node:assert/strict";

describe("gitInvoker.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    process.env.BUILD_REPOSITORY_PROVIDER = "TfsGit";
    process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = "refs/heads/develop";
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = "12345";

    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    when(
      runnerInvoker.exec(
        "git",
        "rev-parse --branch origin/develop...pull/12345/merge",
      ),
    ).thenCall(async (): Promise<ExecOutput> => {
      const testCommitId = "7235cb16e5e6ac83e3cbecae66bab557e9e2cee6";
      return Promise.resolve({
        exitCode: 0,
        stdout: testCommitId,
        stderr: "",
      });
    });
    when(
      runnerInvoker.exec(
        "git",
        "diff --numstat --ignore-all-space origin/develop...pull/12345/merge",
      ),
    ).thenCall(
      async (): Promise<ExecOutput> =>
        Promise.resolve({
          exitCode: 0,
          stdout: "1\t2\tFile.txt",
          stderr: "",
        }),
    );
  });

  afterEach((): void => {
    delete process.env.BUILD_REPOSITORY_PROVIDER;
    delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH;
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
  });

  describe("isGitRepo()", (): void => {
    {
      const testCases: string[] = ["true", "true ", "true\n"];

      testCases.forEach((response: string): void => {
        it(`should return true when called from a Git repo returning '${response.replace(/\n/gu, "\\n")}'`, async (): Promise<void> => {
          // Arrange
          when(
            runnerInvoker.exec("git", "rev-parse --is-inside-work-tree"),
          ).thenCall(
            async (): Promise<ExecOutput> =>
              Promise.resolve({
                exitCode: 0,
                stdout: response,
                stderr: "",
              }),
          );
          const gitInvoker: GitInvoker = new GitInvoker(
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: boolean = await gitInvoker.isGitRepo();

          // Assert
          assert.equal(result, true);
          verify(logger.logDebug("* GitInvoker.isGitRepo()")).once();
          verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
        });
      });
    }

    it("should return false when not called from a Git repo", async (): Promise<void> => {
      // Arrange
      when(
        runnerInvoker.exec("git", "rev-parse --is-inside-work-tree"),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          Promise.resolve({
            exitCode: 1,
            stdout: "",
            stderr: "Failure",
          }),
      );
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = await gitInvoker.isGitRepo();

      // Assert
      assert.equal(result, false);
      verify(logger.logDebug("* GitInvoker.isGitRepo()")).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });
  });

  describe("isPullRequestIdAvailable()", (): void => {
    it("should return true when the GitHub runner is being used", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/12345/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should return false when the GitHub runner is being used and GITHUB_REF is undefined", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
      verify(logger.logWarning("'GITHUB_REF' is undefined.")).once();
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should return false when the GitHub runner is being used and GITHUB_REF is in the incorrect format", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
      verify(
        logger.logWarning(
          "'GITHUB_REF' is in an incorrect format 'refs/pull'.",
        ),
      ).once();
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should return true when the Azure Pipelines runner is being used", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/12345/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should throw an error when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is undefined", (): void => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
      verify(
        logger.logWarning("'BUILD_REPOSITORY_PROVIDER' is undefined."),
      ).once();
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
    });

    it("should throw an error when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is undefined", (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
      verify(
        logger.logWarning("'SYSTEM_PULLREQUEST_PULLREQUESTID' is undefined."),
      ).once();
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should throw an error when the Azure Pipelines runner is being used and the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is undefined`, (): void => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
          const gitInvoker: GitInvoker = new GitInvoker(
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: boolean = gitInvoker.isPullRequestIdAvailable();

          // Assert
          assert.equal(result, false);
          verify(
            logger.logWarning(
              "'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER' is undefined.",
            ),
          ).once();
          verify(
            logger.logDebug("* GitInvoker.isPullRequestIdAvailable()"),
          ).once();
          verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
          verify(
            logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
          ).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw an error when the ID cannot be parsed as an integer", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/PullRequestID/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
      verify(logger.logDebug("* GitInvoker.isPullRequestIdAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });
  });

  describe("isGitHistoryAvailable()", (): void => {
    it("should return true when the Git history is available", async (): Promise<void> => {
      // Arrange
      delete process.env.GITHUB_ACTION;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });

    it("should return true when the Git history is available and the method is called after retrieving the pull request ID", async (): Promise<void> => {
      // Arrange
      delete process.env.GITHUB_ACTION;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result1: number = gitInvoker.pullRequestId;
      const result2: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result1, 12345);
      assert.equal(result2, true);
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).twice();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });

    it("should return true when the Git history is available and the PR is using the GitHub runner", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_BASE_REF = "develop";
      process.env.GITHUB_REF = "refs/pull/12345/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result, true);
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_BASE_REF;
      delete process.env.GITHUB_REF;
    });

    it("should throw an error when the PR is using the GitHub runner and GITHUB_BASE_REF is undefined", async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<boolean> = async () =>
        gitInvoker.isGitHistoryAvailable();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'GITHUB_BASE_REF', accessed within 'GitInvoker.targetBranch', is invalid, null, or undefined 'undefined'.",
      );
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should return true when the Git history is available and the PR is on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
          process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER =
            process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
          delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
          const gitInvoker: GitInvoker = new GitInvoker(
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: boolean = await gitInvoker.isGitHistoryAvailable();

          // Assert
          assert.equal(result, true);
          verify(
            logger.logDebug("* GitInvoker.isGitHistoryAvailable()"),
          ).once();
          verify(logger.logDebug("* GitInvoker.initialize()")).once();
          verify(logger.logDebug("* GitInvoker.targetBranch")).once();
          verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
          verify(
            logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
          ).once();
          verify(logger.logDebug("* GitInvoker.invokeGit()")).once();

          // Finalization
          delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER;
        });
      });
    }

    it("should return false when the Git history is unavailable", async (): Promise<void> => {
      // Arrange
      when(
        runnerInvoker.exec(
          "git",
          "rev-parse --branch origin/develop...pull/12345/merge",
        ),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          Promise.resolve({
            exitCode: 1,
            stdout: "",
            stderr:
              "fatal: ambiguous argument 'origin/develop...pull/12345/merge': unknown revision or path not in the working tree.\n",
          }),
      );
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result, false);
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });

    it("should return true when the Git history is available and the method is called twice", async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result1: boolean = await gitInvoker.isGitHistoryAvailable();
      const result2: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result1, true);
      assert.equal(result2, true);
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).twice();
      verify(logger.logDebug("* GitInvoker.initialize()")).twice();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).twice();
    });

    it("should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined", async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<boolean> = async () =>
        gitInvoker.isGitHistoryAvailable();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'SYSTEM_PULLREQUEST_TARGETBRANCH', accessed within 'GitInvoker.targetBranch', is invalid, null, or undefined 'undefined'.",
      );
      verify(logger.logDebug("* GitInvoker.isGitHistoryAvailable()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
    });
  });

  describe("pullRequestId", (): void => {
    it("should return the correct output when the GitHub runner is being used", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/12345/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: number = gitInvoker.pullRequestId;

      // Assert
      assert.equal(result, 12345);
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should return the correct output when the GitHub runner is being used and it is called multiple times", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/12345/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result1: number = gitInvoker.pullRequestId;
      const result2: number = gitInvoker.pullRequestId;

      // Assert
      assert.equal(result1, 12345);
      assert.equal(result2, 12345);
      verify(logger.logDebug("* GitInvoker.pullRequestId")).twice();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should throw an error when the GitHub runner is being used and GITHUB_REF is undefined", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => void = () => gitInvoker.pullRequestId;

      // Assert
      assert.throws(
        func,
        new TypeError(
          "'Pull Request ID', accessed within 'GitInvoker.pullRequestId', is invalid, null, or undefined 'NaN'.",
        ),
      );
      verify(logger.logWarning("'GITHUB_REF' is undefined.")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
    });

    it("should throw an error when the GitHub runner is being used and GITHUB_REF is in the incorrect format", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => void = () => gitInvoker.pullRequestId;

      // Assert
      assert.throws(
        func,
        new TypeError(
          "'Pull Request ID', accessed within 'GitInvoker.pullRequestId', is invalid, null, or undefined 'NaN'.",
        ),
      );
      verify(
        logger.logWarning(
          "'GITHUB_REF' is in an incorrect format 'refs/pull'.",
        ),
      ).once();
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should return the correct output when the Azure Pipelines runner is being used", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/12345/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: number = gitInvoker.pullRequestId;

      // Assert
      assert.equal(result, 12345);
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });

    it("should throw an error when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is undefined", (): void => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => void = () => gitInvoker.pullRequestId;

      // Assert
      assert.throws(
        func,
        new TypeError(
          "'Pull Request ID', accessed within 'GitInvoker.pullRequestId', is invalid, null, or undefined 'NaN'.",
        ),
      );
      verify(
        logger.logWarning("'BUILD_REPOSITORY_PROVIDER' is undefined."),
      ).once();
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
    });

    it("should throw an error when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is undefined", (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => void = () => gitInvoker.pullRequestId;

      // Assert
      assert.throws(
        func,
        new TypeError(
          "'Pull Request ID', accessed within 'GitInvoker.pullRequestId', is invalid, null, or undefined 'NaN'.",
        ),
      );
      verify(
        logger.logWarning("'SYSTEM_PULLREQUEST_PULLREQUESTID' is undefined."),
      ).once();
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should throw an error when the Azure Pipelines runner is being used and the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is undefined`, (): void => {
          // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = buildRepositoryProvider;
          const gitInvoker: GitInvoker = new GitInvoker(
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const func: () => void = () => gitInvoker.pullRequestId;

          // Assert
          assert.throws(
            func,
            new TypeError(
              "'Pull Request ID', accessed within 'GitInvoker.pullRequestId', is invalid, null, or undefined 'NaN'.",
            ),
          );
          verify(
            logger.logWarning(
              "'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER' is undefined.",
            ),
          ).once();
          verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
          verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
          verify(
            logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
          ).once();

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER;
        });
      });
    }

    it("should throw an error when the ID cannot be parsed as an integer", (): void => {
      // Arrange
      process.env.GITHUB_ACTION = "PR-Metrics";
      process.env.GITHUB_REF = "refs/pull/PullRequestID/merge";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => void = () => gitInvoker.pullRequestId;

      // Assert
      assert.throws(
        func,
        new TypeError(
          "'Pull Request ID', accessed within 'GitInvoker.pullRequestId', is invalid, null, or undefined 'NaN'.",
        ),
      );
      verify(logger.logDebug("* GitInvoker.pullRequestId")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdForGitHub")).once();

      // Finalization
      delete process.env.GITHUB_ACTION;
      delete process.env.GITHUB_REF;
    });
  });

  describe("getDiffSummary()", (): void => {
    it("should return the correct output when no error occurs", async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: string = await gitInvoker.getDiffSummary();

      // Assert
      assert.equal(result, "1\t2\tFile.txt");
      verify(logger.logDebug("* GitInvoker.getDiffSummary()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });

    it("should return the correct output when no error occurs and the target branch is in the GitHub format", async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_TARGETBRANCH = "develop";
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: string = await gitInvoker.getDiffSummary();

      // Assert
      assert.equal(result, "1\t2\tFile.txt");
      verify(logger.logDebug("* GitInvoker.getDiffSummary()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });

    it("should return the correct output when no error occurs and the method is called twice", async (): Promise<void> => {
      // Arrange
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      await gitInvoker.getDiffSummary();
      const result: string = await gitInvoker.getDiffSummary();

      // Assert
      assert.equal(result, "1\t2\tFile.txt");
      verify(logger.logDebug("* GitInvoker.getDiffSummary()")).twice();
      verify(logger.logDebug("* GitInvoker.initialize()")).twice();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).twice();
    });

    it("should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined", async (): Promise<void> => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH;
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<string> = async () =>
        gitInvoker.getDiffSummary();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'SYSTEM_PULLREQUEST_TARGETBRANCH', accessed within 'GitInvoker.targetBranch', is invalid, null, or undefined 'undefined'.",
      );
      verify(logger.logDebug("* GitInvoker.getDiffSummary()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
    });

    it("should throw an error when Git invocation fails", async (): Promise<void> => {
      // Arrange
      when(
        runnerInvoker.exec(
          "git",
          "diff --numstat --ignore-all-space origin/develop...pull/12345/merge",
        ),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          Promise.resolve({
            exitCode: 1,
            stdout: "",
            stderr: "Failure",
          }),
      );
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const func: () => Promise<string> = async () =>
        gitInvoker.getDiffSummary();

      // Assert
      await AssertExtensions.toThrowAsync(func, "Failure");
      verify(logger.logDebug("* GitInvoker.getDiffSummary()")).once();
      verify(logger.logDebug("* GitInvoker.initialize()")).once();
      verify(logger.logDebug("* GitInvoker.targetBranch")).once();
      verify(logger.logDebug("* GitInvoker.pullRequestIdInternal")).once();
      verify(
        logger.logDebug("* GitInvoker.pullRequestIdForAzurePipelines"),
      ).once();
      verify(logger.logDebug("* GitInvoker.invokeGit()")).once();
    });
  });
});
