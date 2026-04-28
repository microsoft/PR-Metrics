/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import * as GitHubReposInvokerConstants from "./gitHubReposInvokerConstants.js";
import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import {
  createGitHubReposInvokerMocks,
  createSut,
  expectedUserAgent,
} from "./gitHubReposInvokerTestSetup.js";
import { verify, when } from "ts-mockito";
import type GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import type GitInvoker from "../../src/git/gitInvoker.js";
import HttpError from "../testUtilities/httpError.js";
import type Logger from "../../src/utilities/logger.js";
import type { OctokitOptions } from "@octokit/core";
import type OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import type { RequestError } from "@octokit/request-error";
import type RunnerInvoker from "../../src/runners/runnerInvoker.js";
import assert from "node:assert/strict";
import { createRequestError } from "../testUtilities/createRequestError.js";
import { httpStatusCodes } from "../../src/utilities/httpStatusCodes.js";

describe("gitHubReposInvoker.ts", (): void => {
  let gitInvoker: GitInvoker;
  let logger: Logger;
  let octokitWrapper: OctokitWrapper;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    ({ gitInvoker, logger, octokitWrapper, runnerInvoker } =
      createGitHubReposInvokerMocks());
  });

  describe("createComment()", (): void => {
    it("should succeed when a file name is specified", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
    });

    it("should throw when the commit list is empty", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      when(
        octokitWrapper.listCommits(
          anyString(),
          anyString(),
          anyNumber(),
          anyNumber(),
        ),
      ).thenResolve({
        data: [],
        headers: {},
        status: httpStatusCodes.ok,
        url: "",
      });
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const func: () => Promise<void> = async () =>
        gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'result.data[-1].sha', accessed within 'GitHubReposInvoker.getCommitId()', is invalid, null, or undefined 'undefined'.",
      );
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
    });

    it("should succeed when there are multiple pages of commits", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      when(
        octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 1),
      ).thenResolve({
        data: [],
        headers: {
          link: '<https://api.github.com/repositories/309438703/pulls/172/commits?page=2>; rel="next", <https://api.github.com/repositories/309438703/pulls/172/commits?page=24>; rel="last"',
        },
        status: httpStatusCodes.ok,
        url: "",
      });
      when(
        octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 24),
      ).thenResolve(GitHubReposInvokerConstants.listCommitsResponse);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
    });

    it("should throw when the link header does not match the expected format", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      when(
        octokitWrapper.listCommits(anyString(), anyString(), anyNumber(), 1),
      ).thenResolve({
        data: [],
        headers: {
          link: "non-matching",
        },
        status: httpStatusCodes.ok,
        url: "",
      });
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      const func: () => Promise<void> = async () =>
        gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "The regular expression did not match 'non-matching'.",
      );
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
    });

    it("should succeed when a file name is specified and the method is called twice", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).twice();
    });

    it("should succeed when createReviewComment() returns null", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      when(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).thenResolve(null);
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.createComment("Content", "file.ts");

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
      ).once();
      verify(
        octokitWrapper.createReviewComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
          "file.ts",
          "sha54321",
        ),
      ).once();
    });

    {
      const testCases: string[] = [
        "file.ts is too big",
        "file.ts diff is too large",
      ];

      testCases.forEach((message: string): void => {
        it(`should succeed when a HTTP 422 error occurs due to: '${message}'`, async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(any())).thenCall(
            (options: OctokitOptions): void => {
              assert.equal(options.auth, "PAT");
              assert.equal(options.userAgent, expectedUserAgent);
              assert.notEqual(options.log, null);
              assert.notEqual(options.log?.debug, null);
              assert.notEqual(options.log?.info, null);
              assert.notEqual(options.log?.warn, null);
              assert.notEqual(options.log?.error, null);
            },
          );
          const errorMessage = `Validation Failed: {"resource":"PullRequestReviewComment","code":"custom","field":"pull_request_review_thread.diff_entry","message":"${message}"}`;
          const error: RequestError = createRequestError(
            httpStatusCodes.unprocessableEntity,
            errorMessage,
          );
          when(
            octokitWrapper.createReviewComment(
              "microsoft",
              "PR-Metrics",
              12345,
              "Content",
              "file.ts",
              "sha54321",
            ),
          ).thenCall((): void => {
            throw error;
          });
          const gitHubReposInvoker: GitHubReposInvoker = createSut(
            gitInvoker,
            logger,
            octokitWrapper,
            runnerInvoker,
          );

          // Act
          await gitHubReposInvoker.createComment("Content", "file.ts");

          // Assert
          verify(octokitWrapper.initialize(any())).once();
          verify(
            octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
          ).once();
          verify(
            octokitWrapper.createReviewComment(
              "microsoft",
              "PR-Metrics",
              12345,
              "Content",
              "file.ts",
              "sha54321",
            ),
          ).once();
          verify(
            logger.logInfo(
              "GitHub createReviewComment() threw a 422 error related to a large diff. Ignoring as this is expected.",
            ),
          ).once();
          verify(logger.logErrorObject(error)).once();
        });
      });
    }

    {
      const testCases: HttpError[] = [
        new HttpError(
          httpStatusCodes.badRequest,
          'Validation Failed: {"resource":"PullRequestReviewComment","code":"custom","field":"pull_request_review_thread.diff_entry","message":"file.ts is too big"}',
        ),
        new HttpError(httpStatusCodes.unprocessableEntity, "Unprocessable Entity"),
      ];

      testCases.forEach((error: HttpError): void => {
        it("should throw when an error occurs that is not a HTTP 422 or is not due to having a too large path diff", async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(any())).thenCall(
            (options: OctokitOptions): void => {
              assert.equal(options.auth, "PAT");
              assert.equal(options.userAgent, expectedUserAgent);
              assert.notEqual(options.log, null);
              assert.notEqual(options.log?.debug, null);
              assert.notEqual(options.log?.info, null);
              assert.notEqual(options.log?.warn, null);
              assert.notEqual(options.log?.error, null);
            },
          );
          when(
            octokitWrapper.createReviewComment(
              "microsoft",
              "PR-Metrics",
              12345,
              "Content",
              "file.ts",
              "sha54321",
            ),
          ).thenCall((): void => {
            throw error;
          });
          const gitHubReposInvoker: GitHubReposInvoker = createSut(
            gitInvoker,
            logger,
            octokitWrapper,
            runnerInvoker,
          );

          // Act
          const func: () => Promise<void> = async () =>
            gitHubReposInvoker.createComment("Content", "file.ts");

          // Assert
          await AssertExtensions.toThrowAsync(func, error.message);
          verify(octokitWrapper.initialize(any())).once();
          verify(
            octokitWrapper.listCommits("microsoft", "PR-Metrics", 12345, 1),
          ).once();
          verify(
            octokitWrapper.createReviewComment(
              "microsoft",
              "PR-Metrics",
              12345,
              "Content",
              "file.ts",
              "sha54321",
            ),
          ).once();
        });
      });
    }

    it("should succeed when no file name is specified", async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(any())).thenCall(
        (options: OctokitOptions): void => {
          assert.equal(options.auth, "PAT");
          assert.equal(options.userAgent, expectedUserAgent);
          assert.notEqual(options.log, null);
          assert.notEqual(options.log?.debug, null);
          assert.notEqual(options.log?.info, null);
          assert.notEqual(options.log?.warn, null);
          assert.notEqual(options.log?.error, null);
        },
      );
      const gitHubReposInvoker: GitHubReposInvoker = createSut(
        gitInvoker,
        logger,
        octokitWrapper,
        runnerInvoker,
      );

      // Act
      await gitHubReposInvoker.createComment("Content", null);

      // Assert
      verify(octokitWrapper.initialize(any())).once();
      verify(
        octokitWrapper.createIssueComment(
          "microsoft",
          "PR-Metrics",
          12345,
          "Content",
        ),
      ).once();
    });
  });
});
