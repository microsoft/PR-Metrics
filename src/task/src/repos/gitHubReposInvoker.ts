/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as Validator from "../utilities/validator.js";
import {
  commentsPageSize,
  decimalRadix,
  maxCommentPages,
  userAgent,
} from "../utilities/constants.js";
import BaseReposInvoker from "./baseReposInvoker.js";
import CommentData from "./interfaces/commentData.js";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces.js";
import type CreateIssueCommentResponse from "../wrappers/octokitInterfaces/createIssueCommentResponse.js";
import type CreateReviewCommentResponse from "../wrappers/octokitInterfaces/createReviewCommentResponse.js";
import type DeleteReviewCommentResponse from "../wrappers/octokitInterfaces/deleteReviewCommentResponse.js";
import FileCommentData from "./interfaces/fileCommentData.js";
import type GetAuthenticatedUserResponse from "../wrappers/octokitInterfaces/getAuthenticatedUserResponse.js";
import type GetIssueCommentsResponse from "../wrappers/octokitInterfaces/getIssueCommentsResponse.js";
import type GetPullResponse from "../wrappers/octokitInterfaces/getPullResponse.js";
import type GetReviewCommentsResponse from "../wrappers/octokitInterfaces/getReviewCommentsResponse.js";
import type GitInvoker from "../git/gitInvoker.js";
import type GraphQlViewerResponseInterface from "../wrappers/octokitInterfaces/graphQlViewerResponseInterface.js";
import type ListCommitsResponse from "../wrappers/octokitInterfaces/listCommitsResponse.js";
import type Logger from "../utilities/logger.js";
import type { OctokitOptions } from "@octokit/core";
import type OctokitWrapper from "../wrappers/octokitWrapper.js";
import PullRequestCommentData from "./interfaces/pullRequestCommentData.js";
import type PullRequestDetailsInterface from "./interfaces/pullRequestDetailsInterface.js";
import { RequestError } from "@octokit/request-error";
import RunnerInvoker from "../runners/runnerInvoker.js";
import type UpdateIssueCommentResponse from "../wrappers/octokitInterfaces/updateIssueCommentResponse.js";
import type UpdatePullResponse from "../wrappers/octokitInterfaces/updatePullResponse.js";
import { httpStatusCodes } from "../utilities/httpStatusCodes.js";

/**
 * A class for invoking GitHub Repos functionality.
 */
export default class GitHubReposInvoker extends BaseReposInvoker {
  private readonly _gitInvoker: GitInvoker;
  private readonly _logger: Logger;
  private readonly _octokitWrapper: OctokitWrapper;
  private readonly _runnerInvoker: RunnerInvoker;

  private _isInitialized = false;
  private _owner = "";
  private _repo = "";
  private _pullRequestId = 0;
  private _commitId = "";
  private _authenticatedUserId: number | null = null;

  /**
   * Initializes a new instance of the `GitHubReposInvoker` class.
   * @param gitInvoker The Git invoker.
   * @param logger The logger.
   * @param octokitWrapper The wrapper around the Octokit library.
   * @param runnerInvoker The runner invoker functionality.
   */
  public constructor(
    gitInvoker: GitInvoker,
    logger: Logger,
    octokitWrapper: OctokitWrapper,
    runnerInvoker: RunnerInvoker,
  ) {
    super();

    this._gitInvoker = gitInvoker;
    this._logger = logger;
    this._octokitWrapper = octokitWrapper;
    this._runnerInvoker = runnerInvoker;
  }

  public async isAccessTokenAvailable(): Promise<string | null> {
    this._logger.logDebug("* GitHubReposInvoker.isAccessTokenAvailable()");

    if (
      typeof process.env.PR_METRICS_ACCESS_TOKEN === "undefined" ||
      process.env.PR_METRICS_ACCESS_TOKEN.trim() === ""
    ) {
      return Promise.resolve(
        this._runnerInvoker.loc("repos.gitHubReposInvoker.noGitHubAccessToken"),
      );
    }

    return Promise.resolve(null);
  }

  public async getTitleAndDescription(): Promise<PullRequestDetailsInterface> {
    this._logger.logDebug("* GitHubReposInvoker.getTitleAndDescription()");

    this.initialize();
    const result: GetPullResponse = await this.invokeApiCall(
      async (): Promise<GetPullResponse> => {
        const internalResult: GetPullResponse =
          await this._octokitWrapper.getPull(
            this._owner,
            this._repo,
            this._pullRequestId,
          );
        this._logger.logDebug(JSON.stringify(internalResult));

        return internalResult;
      },
    );

    return {
      description: result.data.body ?? null,
      title: result.data.title,
    };
  }

  public async getComments(): Promise<CommentData> {
    this._logger.logDebug("* GitHubReposInvoker.getComments()");

    this.initialize();

    const [authenticatedUserId, pullRequestComments, fileComments]: [
      number,
      GetIssueCommentsResponse["data"],
      GetReviewCommentsResponse["data"],
    ] = await Promise.all([
      this.getAuthenticatedUserId(),
      this.getAllPullRequestComments(),
      this.getAllFileComments(),
    ]);

    return this.convertPullRequestComments(
      authenticatedUserId,
      pullRequestComments,
      fileComments,
    );
  }

  public async setTitleAndDescription(
    title: string | null,
    description: string | null,
  ): Promise<void> {
    this._logger.logDebug("* GitHubReposInvoker.setTitleAndDescription()");

    if (title === null && description === null) {
      return;
    }

    this.initialize();

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdatePullResponse = await this._octokitWrapper.updatePull(
        this._owner,
        this._repo,
        this._pullRequestId,
        title,
        description,
      );
      this._logger.logDebug(JSON.stringify(result));
    });
  }

  public async createComment(
    content: string,
    fileName: string | null,
  ): Promise<void> {
    this._logger.logDebug("* GitHubReposInvoker.createComment()");

    this.initialize();

    if (fileName === null) {
      await this.invokeApiCall(async (): Promise<void> => {
        const result: CreateIssueCommentResponse =
          await this._octokitWrapper.createIssueComment(
            this._owner,
            this._repo,
            this._pullRequestId,
            content,
          );
        this._logger.logDebug(JSON.stringify(result));
      });
    } else {
      if (this._commitId === "") {
        await this.getCommitId();
      }

      await this.invokeApiCall(async (): Promise<void> => {
        try {
          const result: CreateReviewCommentResponse | null =
            await this._octokitWrapper.createReviewComment(
              this._owner,
              this._repo,
              this._pullRequestId,
              content,
              fileName,
              this._commitId,
            );
          this._logger.logDebug(JSON.stringify(result));
        } catch (error: unknown) {
          if (
            error instanceof RequestError &&
            error.status === httpStatusCodes.unprocessableEntity &&
            (error.message.includes("is too big") ||
              error.message.includes("diff is too large"))
          ) {
            this._logger.logInfo(
              "GitHub createReviewComment() threw a 422 error related to a large diff. Ignoring as this is expected.",
            );
            this._logger.logErrorObject(error);
          } else {
            throw error;
          }
        }
      });
    }
  }

  public async updateComment(
    commentThreadId: number,
    content: string | null,
  ): Promise<void> {
    this._logger.logDebug("* GitHubReposInvoker.updateComment()");

    if (content === null) {
      return;
    }

    this.initialize();

    await this.invokeApiCall(async (): Promise<void> => {
      const result: UpdateIssueCommentResponse =
        await this._octokitWrapper.updateIssueComment(
          this._owner,
          this._repo,
          this._pullRequestId,
          commentThreadId,
          content,
        );
      this._logger.logDebug(JSON.stringify(result));
    });
  }

  public async deleteCommentThread(commentThreadId: number): Promise<void> {
    this._logger.logDebug("* GitHubReposInvoker.deleteCommentThread()");

    this.initialize();

    await this.invokeApiCall(async (): Promise<void> => {
      const result: DeleteReviewCommentResponse =
        await this._octokitWrapper.deleteReviewComment(
          this._owner,
          this._repo,
          commentThreadId,
        );
      this._logger.logDebug(JSON.stringify(result));
    });
  }

  protected async invokeApiCall<Response>(
    action: () => Promise<Response>,
  ): Promise<Response> {
    return BaseReposInvoker.invokeApiCall(
      action,
      this._runnerInvoker.loc(
        "repos.gitHubReposInvoker.insufficientGitHubAccessTokenPermissions",
      ),
      this._runnerInvoker.loc("repos.baseReposInvoker.resourceNotFound"),
    );
  }

  private initialize(): void {
    this._logger.logDebug("* GitHubReposInvoker.initialize()");

    if (this._isInitialized) {
      return;
    }

    const options: OctokitOptions = {
      auth: process.env.PR_METRICS_ACCESS_TOKEN,
      log: {
        debug: (message: string): void => {
          this._logger.logDebug(`Octokit – ${message}`);
        },
        error: (message: string): void => {
          this._logger.logError(`Octokit – ${message}`);
        },
        info: (message: string): void => {
          this._logger.logInfo(`Octokit – ${message}`);
        },
        warn: (message: string): void => {
          this._logger.logWarning(`Octokit – ${message}`);
        },
      },
      userAgent,
    };

    if (RunnerInvoker.isGitHub) {
      options.baseUrl = this.initializeForGitHub();
    } else {
      options.baseUrl = this.initializeForAzureDevOps();
    }

    this._logger.logDebug(`Using Base URL '${options.baseUrl}'.`);
    this._octokitWrapper.initialize(options);
    this._pullRequestId = this._gitInvoker.pullRequestId;
    this._isInitialized = true;
  }

  private initializeForGitHub(): string {
    this._logger.logDebug("* GitHubReposInvoker.initializeForGitHub()");

    const baseUrl: string = Validator.validateVariable(
      "GITHUB_API_URL",
      "GitHubReposInvoker.initializeForGitHub()",
    );
    this._owner = Validator.validateVariable(
      "GITHUB_REPOSITORY_OWNER",
      "GitHubReposInvoker.initializeForGitHub()",
    );

    const gitHubRepository: string = Validator.validateVariable(
      "GITHUB_REPOSITORY",
      "GitHubReposInvoker.initializeForGitHub()",
    );
    const gitHubRepositoryElements: string[] = gitHubRepository.split("/");
    if (typeof gitHubRepositoryElements[1] === "undefined") {
      throw new Error(
        `GITHUB_REPOSITORY '${gitHubRepository}' is in an unexpected format.`,
      );
    }

    [, this._repo] = gitHubRepositoryElements;
    return baseUrl;
  }

  private initializeForAzureDevOps(): string {
    this._logger.logDebug("* GitHubReposInvoker.initializeForAzureDevOps()");

    const sourceRepositoryUri: string = Validator.validateVariable(
      "SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI",
      "GitHubReposInvoker.initializeForAzureDevOps()",
    );

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(sourceRepositoryUri);
    } catch {
      throw new Error(
        `SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${sourceRepositoryUri}' is in an unexpected format.`,
      );
    }

    const pathSegments: string[] = parsedUrl.pathname
      .split("/")
      .filter(Boolean);
    const owner: string | undefined = pathSegments[0];
    const repo: string | undefined = pathSegments[1];
    if (typeof owner === "undefined" || typeof repo === "undefined") {
      throw new Error(
        `SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${sourceRepositoryUri}' is in an unexpected format.`,
      );
    }

    this._owner = owner;
    this._repo = repo;

    if (this._repo.endsWith(".git")) {
      this._repo = this._repo.substring(0, this._repo.length - ".git".length);
    }

    // Handle GitHub Enterprise invocations.
    if (parsedUrl.hostname !== "github.com") {
      return `${parsedUrl.origin}/api/v3`;
    }

    return "";
  }

  private convertPullRequestComments(
    authenticatedUserId: number,
    pullRequestComments: GetIssueCommentsResponse["data"],
    fileComments: GetReviewCommentsResponse["data"],
  ): CommentData {
    this._logger.logDebug("* GitHubReposInvoker.convertPullRequestComments()");

    const result: CommentData = new CommentData();
    result.authenticatedUserId = authenticatedUserId;

    for (const value of pullRequestComments) {
      const content: string | undefined = value.body;
      if (typeof content !== "undefined") {
        result.pullRequestComments.push(
          new PullRequestCommentData(
            value.id,
            content,
            CommentThreadStatus.Unknown,
            value.user?.id ?? null,
          ),
        );
      }
    }

    for (const value of fileComments) {
      const content: string = value.body;
      const file: string = value.path;
      result.fileComments.push(
        new FileCommentData(
          value.id,
          content,
          file,
          CommentThreadStatus.Unknown,
          value.user.id,
        ),
      );
    }

    return result;
  }

  private async getAllPullRequestComments(): Promise<
    GetIssueCommentsResponse["data"]
  > {
    this._logger.logDebug("* GitHubReposInvoker.getAllPullRequestComments()");

    return this.getAllComments(
      async (page: number): Promise<GetIssueCommentsResponse> =>
        this._octokitWrapper.getIssueComments(
          this._owner,
          this._repo,
          this._pullRequestId,
          page,
          commentsPageSize,
        ),
    );
  }

  private async getAllFileComments(): Promise<
    GetReviewCommentsResponse["data"]
  > {
    this._logger.logDebug("* GitHubReposInvoker.getAllFileComments()");

    return this.getAllComments(
      async (page: number): Promise<GetReviewCommentsResponse> =>
        this._octokitWrapper.getReviewComments(
          this._owner,
          this._repo,
          this._pullRequestId,
          page,
          commentsPageSize,
        ),
    );
  }

  private async getAllComments<Comment>(
    action: (page: number) => Promise<{ data: Comment[] }>,
  ): Promise<Comment[]> {
    this._logger.logDebug("* GitHubReposInvoker.getAllComments()");

    const result: Comment[] = [];

    /* eslint-disable no-await-in-loop -- Each page must be read before determining whether a further page exists. */
    for (let page = 1; page <= maxCommentPages; page += 1) {
      const response: { data: Comment[] } = await this.invokeApiCall(
        async (): Promise<{ data: Comment[] }> => action(page),
      );
      this._logger.logDebug(JSON.stringify(response));
      result.push(...response.data);

      if (response.data.length < commentsPageSize) {
        return result;
      }
    }
    /* eslint-enable no-await-in-loop */

    throw new Error(
      this._runnerInvoker.loc(
        "repos.gitHubReposInvoker.tooManyComments",
        (commentsPageSize * maxCommentPages).toLocaleString(),
      ),
    );
  }

  private async getAuthenticatedUserId(): Promise<number> {
    this._logger.logDebug("* GitHubReposInvoker.getAuthenticatedUserId()");

    if (this._authenticatedUserId !== null) {
      return this._authenticatedUserId;
    }

    /*
     * The GraphQL viewer query is attempted first as the REST users API is unavailable to GitHub App installation
     * access tokens, which includes the GITHUB_TOKEN used within GitHub Actions. Invoking the REST API first would
     * therefore result in a logged authorization failure during every default GitHub Actions run. The REST API is
     * retained as a fallback for the token types for which the GraphQL API is unavailable.
     */
    let userId: number | null = await this.getAuthenticatedUserIdViaGraphQl();
    userId ??= await this.getAuthenticatedUserIdViaRest();

    if (userId === null) {
      throw new Error(
        this._runnerInvoker.loc(
          "repos.gitHubReposInvoker.unidentifiablePrincipal",
        ),
      );
    }

    this._authenticatedUserId = userId;
    return userId;
  }

  private async getAuthenticatedUserIdViaGraphQl(): Promise<number | null> {
    this._logger.logDebug(
      "* GitHubReposInvoker.getAuthenticatedUserIdViaGraphQl()",
    );

    try {
      const viewer: GraphQlViewerResponseInterface =
        await this._octokitWrapper.getAuthenticatedViewer();
      this._logger.logDebug(JSON.stringify(viewer));
      return viewer.viewer.databaseId;
    } catch {
      // The error is deliberately not logged, as it can include the access token used for the request.
      this._logger.logDebug(
        "The authenticated principal could not be read via the GraphQL APIs. Falling back to the REST APIs.",
      );
      return null;
    }
  }

  private async getAuthenticatedUserIdViaRest(): Promise<number | null> {
    this._logger.logDebug(
      "* GitHubReposInvoker.getAuthenticatedUserIdViaRest()",
    );

    try {
      const response: GetAuthenticatedUserResponse =
        await this._octokitWrapper.getAuthenticatedUser();
      return response.data.id;
    } catch {
      // The error is deliberately not logged, as it can include the access token used for the request.
      this._logger.logDebug(
        "The authenticated principal could not be read via the REST APIs.",
      );
      return null;
    }
  }

  private async getCommitId(): Promise<void> {
    this._logger.logDebug("* GitHubReposInvoker.getCommitId()");

    let result: ListCommitsResponse = await this.invokeApiCall(
      async (): Promise<ListCommitsResponse> => {
        const internalResult: ListCommitsResponse =
          await this._octokitWrapper.listCommits(
            this._owner,
            this._repo,
            this._pullRequestId,
            1,
          );
        this._logger.logDebug(JSON.stringify(internalResult));
        return internalResult;
      },
    );

    // Get the last page of commits so that the last commit can be located.
    if (typeof result.headers.link !== "undefined") {
      const commitsLink: string = result.headers.link;
      const matches: RegExpMatchArray | null =
        /<.+?page=(?<pageNumber>\d+)>;\s*rel="last"/u.exec(commitsLink);
      if (typeof matches?.groups?.pageNumber === "undefined") {
        throw new Error(
          `The regular expression did not match '${commitsLink}'.`,
        );
      }

      const match: number = parseInt(matches.groups.pageNumber, decimalRadix);
      result = await this.invokeApiCall(
        async (): Promise<ListCommitsResponse> => {
          const internalResult: ListCommitsResponse =
            await this._octokitWrapper.listCommits(
              this._owner,
              this._repo,
              this._pullRequestId,
              match,
            );
          this._logger.logDebug(JSON.stringify(internalResult));
          return internalResult;
        },
      );
    }

    this._commitId = Validator.validateString(
      result.data[result.data.length - 1]?.sha,
      `result.data[${String(result.data.length - 1)}].sha`,
      "GitHubReposInvoker.getCommitId()",
    );
  }
}
