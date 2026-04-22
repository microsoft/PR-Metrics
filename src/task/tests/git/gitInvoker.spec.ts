/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import type { ExecOutput } from "@actions/exec";
import GitInvoker from "../../src/git/gitInvoker.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { stubEnv } from "../testUtilities/stubEnv.js";

describe("gitInvoker.ts", (): void => {
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    stubEnv(["BUILD_REPOSITORY_PROVIDER", "TfsGit"]);
    stubEnv(["SYSTEM_PULLREQUEST_TARGETBRANCH", "refs/heads/develop"]);
    stubEnv(["SYSTEM_PULLREQUEST_PULLREQUESTID", "12345"]);

    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    when(
      runnerInvoker.exec(
        "git",
        deepEqual([
          "rev-parse",
          "--branch",
          "origin/develop...pull/12345/merge",
        ]),
      ),
    ).thenCall(async (): Promise<ExecOutput> => {
      const testCommitId = "7235cb16e5e6ac83e3cbecae66bab557e9e2cee6";
      return Promise.resolve({
        exitCode: 0,
        stderr: "",
        stdout: testCommitId,
      });
    });
    when(
      runnerInvoker.exec(
        "git",
        deepEqual([
          "diff",
          "--numstat",
          "--ignore-all-space",
          "origin/develop...pull/12345/merge",
        ]),
      ),
    ).thenCall(
      async (): Promise<ExecOutput> =>
        Promise.resolve({
          exitCode: 0,
          stderr: "",
          stdout: "1\t2\tFile.txt",
        }),
    );
  });

  describe("pullRequestId", (): void => {
    it("should return the correct output when the GitHub runner is being used", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/12345/merge"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: number = gitInvoker.pullRequestId;

      // Assert
      assert.equal(result, 12345);
    });

    it("should return the correct output when the GitHub runner is being used and it is called multiple times", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/12345/merge"]);
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
    });

    it("should throw an error when the GitHub runner is being used and GITHUB_REF is undefined", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
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
    });

    it("should throw an error when the GitHub runner is being used and GITHUB_REF is in the incorrect format", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull"]);
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
    });

    it("should return the correct output when the Azure Pipelines runner is being used", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/12345/merge"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: number = gitInvoker.pullRequestId;

      // Assert
      assert.equal(result, 12345);
    });

    it("should throw an error when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is undefined", (): void => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
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
    });

    it("should throw an error when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is undefined", (): void => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_PULLREQUESTID", undefined]);
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
    });

    it("should throw an error when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is not numeric", (): void => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_PULLREQUESTID", "abc"]);
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
          "'SYSTEM_PULLREQUEST_PULLREQUESTID' is not numeric 'abc'.",
        ),
      ).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should throw an error when the Azure Pipelines runner is being used and the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is undefined`, (): void => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
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
        });
      });
    }

    it("should throw an error when the ID cannot be parsed as an integer", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/PullRequestID/merge"]);
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
          "Pull request ID 'PullRequestID' from 'GITHUB_REF' is not numeric.",
        ),
      ).once();
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should throw an error when the Azure Pipelines runner is being used and the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is not numeric`, (): void => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
          stubEnv(["SYSTEM_PULLREQUEST_PULLREQUESTNUMBER", "abc"]);
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
              "'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER' is not numeric 'abc'.",
            ),
          ).once();
        });
      });
    }
  });

  describe("isGitRepo()", (): void => {
    {
      const testCases: string[] = ["true", "true ", "true\n"];

      testCases.forEach((response: string): void => {
        it(`should return true when called from a Git repo returning '${response.replace(/\n/gu, "\\n")}'`, async (): Promise<void> => {
          // Arrange
          when(
            runnerInvoker.exec(
              "git",
              deepEqual(["rev-parse", "--is-inside-work-tree"]),
            ),
          ).thenCall(
            async (): Promise<ExecOutput> =>
              Promise.resolve({
                exitCode: 0,
                stderr: "",
                stdout: response,
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
        });
      });
    }

    it("should return false when not called from a Git repo", async (): Promise<void> => {
      // Arrange
      when(
        runnerInvoker.exec(
          "git",
          deepEqual(["rev-parse", "--is-inside-work-tree"]),
        ),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          Promise.resolve({
            exitCode: 1,
            stderr: "Failure",
            stdout: "",
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
    });
  });

  describe("isPullRequestIdAvailable()", (): void => {
    it("should return true when the GitHub runner is being used", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/12345/merge"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, true);
    });

    it("should return false when the GitHub runner is being used and GITHUB_REF is undefined", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
      verify(logger.logWarning("'GITHUB_REF' is undefined.")).once();
    });

    it("should return false when the GitHub runner is being used and GITHUB_REF is in the incorrect format", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull"]);
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
    });

    it("should return true when the Azure Pipelines runner is being used", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/12345/merge"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, true);
    });

    it("should throw an error when the Azure Pipelines runner is being used and BUILD_REPOSITORY_PROVIDER is undefined", (): void => {
      // Arrange
      stubEnv(["BUILD_REPOSITORY_PROVIDER", undefined]);
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
    });

    it("should throw an error when the Azure Pipelines runner is being used and SYSTEM_PULLREQUEST_PULLREQUESTID is undefined", (): void => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_PULLREQUESTID", undefined]);
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
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should throw an error when the Azure Pipelines runner is being used and the PR is on '${buildRepositoryProvider}' and SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is undefined`, (): void => {
          // Arrange
          stubEnv(["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider]);
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
        });
      });
    }

    it("should throw an error when the ID cannot be parsed as an integer", (): void => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_REF", "refs/pull/PullRequestID/merge"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = gitInvoker.isPullRequestIdAvailable();

      // Assert
      assert.equal(result, false);
    });
  });

  describe("isGitHistoryAvailable()", (): void => {
    it("should return true when the Git history is available", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", undefined]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result, true);
    });

    it("should return true when the Git history is available and the method is called after retrieving the pull request ID", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", undefined]);
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
    });

    it("should return true when the Git history is available and the PR is using the GitHub runner", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
      stubEnv(["GITHUB_BASE_REF", "develop"]);
      stubEnv(["GITHUB_REF", "refs/pull/12345/merge"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: boolean = await gitInvoker.isGitHistoryAvailable();

      // Assert
      assert.equal(result, true);
    });

    it("should throw an error when the PR is using the GitHub runner and GITHUB_BASE_REF is undefined", async (): Promise<void> => {
      // Arrange
      stubEnv(["GITHUB_ACTION", "PR-Metrics"]);
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
    });

    {
      const testCases: string[] = ["GitHub", "GitHubEnterprise"];

      testCases.forEach((buildRepositoryProvider: string): void => {
        it(`should return true when the Git history is available and the PR is on '${buildRepositoryProvider}'`, async (): Promise<void> => {
          // Arrange
          stubEnv(
            ["BUILD_REPOSITORY_PROVIDER", buildRepositoryProvider],
            ["SYSTEM_PULLREQUEST_PULLREQUESTID", undefined],
            [
              "SYSTEM_PULLREQUEST_PULLREQUESTNUMBER",
              process.env.SYSTEM_PULLREQUEST_PULLREQUESTID,
            ],
          );
          const gitInvoker: GitInvoker = new GitInvoker(
            instance(logger),
            instance(runnerInvoker),
          );

          // Act
          const result: boolean = await gitInvoker.isGitHistoryAvailable();

          // Assert
          assert.equal(result, true);
        });
      });
    }

    it("should return false when the Git history is unavailable", async (): Promise<void> => {
      // Arrange
      when(
        runnerInvoker.exec(
          "git",
          deepEqual([
            "rev-parse",
            "--branch",
            "origin/develop...pull/12345/merge",
          ]),
        ),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          Promise.resolve({
            exitCode: 1,
            stderr:
              "fatal: ambiguous argument 'origin/develop...pull/12345/merge': unknown revision or path not in the working tree.\n",
            stdout: "",
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
    });

    it("should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined", async (): Promise<void> => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_TARGETBRANCH", undefined]);
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
    });

    it("should throw an error when the target branch contains whitespace", async (): Promise<void> => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_TARGETBRANCH", "refs/heads/main branch"]);
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
        "Target branch 'main branch' contains whitespace or control characters, which is not allowed in command-line arguments.",
      );
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
    });

    it("should return the correct output when no error occurs and the target branch is in the GitHub format", async (): Promise<void> => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_TARGETBRANCH", "develop"]);
      const gitInvoker: GitInvoker = new GitInvoker(
        instance(logger),
        instance(runnerInvoker),
      );

      // Act
      const result: string = await gitInvoker.getDiffSummary();

      // Assert
      assert.equal(result, "1\t2\tFile.txt");
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
    });

    it("should throw an error when SYSTEM_PULLREQUEST_TARGETBRANCH is undefined", async (): Promise<void> => {
      // Arrange
      stubEnv(["SYSTEM_PULLREQUEST_TARGETBRANCH", undefined]);
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
    });

    it("should throw an error when Git invocation fails", async (): Promise<void> => {
      // Arrange
      when(
        runnerInvoker.exec(
          "git",
          deepEqual([
            "diff",
            "--numstat",
            "--ignore-all-space",
            "origin/develop...pull/12345/merge",
          ]),
        ),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          Promise.resolve({
            exitCode: 1,
            stderr: "Failure",
            stdout: "",
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
    });
  });
});
