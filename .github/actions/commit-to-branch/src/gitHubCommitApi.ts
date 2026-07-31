/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { readString, readValue } from "./graphQlResponse.js";
import type BranchStateInterface from "./interfaces/branchStateInterface.js";
import type CommitRequestInterface from "./interfaces/commitRequestInterface.js";
import type FileAdditionInterface from "./interfaces/fileAdditionInterface.js";
import type GraphQlClientInterface from "./interfaces/graphQlClientInterface.js";

const branchStateQuery = `query ($owner: String!, $repository: String!, $qualifiedName: String!) {
  repository(owner: $owner, name: $repository) {
    id
    ref(qualifiedName: $qualifiedName) {
      target {
        oid
      }
    }
  }
}`;

const createBranchMutation = `mutation ($input: CreateRefInput!) {
  createRef(input: $input) {
    ref {
      name
    }
  }
}`;

const createCommitMutation = `mutation ($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) {
    commit {
      oid
    }
  }
}`;

const alreadyExistsExpression = /already exists/iu;

/**
 * A class for creating server authored commits via the GitHub GraphQL API. Every value is passed as a structured
 * GraphQL variable, so no data is ever interpolated into a query document.
 */
export default class GitHubCommitApi {
  private readonly _client: GraphQlClientInterface;

  /**
   * Initializes a new instance of the `GitHubCommitApi` class.
   * @param client The GraphQL client.
   */
  public constructor(client: GraphQlClientInterface) {
    this._client = client;
  }

  /**
   * Gets the remote state of a branch.
   * @param owner The owner of the repository.
   * @param repository The name of the repository.
   * @param branch The name of the branch, excluding the `refs/heads/` prefix.
   * @returns A promise containing the branch state.
   */
  public async getBranchState(
    owner: string,
    repository: string,
    branch: string,
  ): Promise<BranchStateInterface> {
    const data: unknown = await this._client.request(branchStateQuery, {
      owner,
      qualifiedName: `refs/heads/${branch}`,
      repository,
    });
    if (readValue(data, ["repository"]) === null) {
      throw new Error(
        `The repository '${owner}/${repository}' could not be read via the GitHub GraphQL API.`,
      );
    }

    const repositoryId: string = readString(data, ["repository", "id"]);
    const objectId: unknown = readValue(data, [
      "repository",
      "ref",
      "target",
      "oid",
    ]);
    return {
      branchObjectId: typeof objectId === "string" ? objectId : null,
      repositoryId,
    };
  }

  /**
   * Creates a branch pointing at the specified commit.
   * @param repositoryId The node ID of the repository.
   * @param branch The name of the branch, excluding the `refs/heads/` prefix.
   * @param objectId The object ID at which the branch is to be created.
   * @returns A promise containing `true` when the branch was created and `false` when it already existed.
   */
  public async createBranch(
    repositoryId: string,
    branch: string,
    objectId: string,
  ): Promise<boolean> {
    try {
      await this._client.request(createBranchMutation, {
        input: {
          name: `refs/heads/${branch}`,
          oid: objectId,
          repositoryId,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        alreadyExistsExpression.test(error.message)
      ) {
        return false;
      }

      throw error;
    }

    return true;
  }

  /**
   * Creates a commit on a branch. The commit is rejected by GitHub when the branch no longer points at the expected
   * commit, and no retry is attempted.
   * @param request The details of the commit to create.
   * @returns A promise containing the object ID of the created commit.
   */
  public async createCommit(request: CommitRequestInterface): Promise<string> {
    const data: unknown = await this._client.request(createCommitMutation, {
      input: {
        branch: {
          branchName: request.branch,
          repositoryNameWithOwner: request.nameWithOwner,
        },
        expectedHeadOid: request.expectedHeadObjectId,
        fileChanges: {
          additions: request.additions.map(
            (value: FileAdditionInterface): FileAdditionInterface => ({
              contents: value.contents,
              path: value.path,
            }),
          ),
          deletions: request.deletions.map(
            (value: string): Record<string, string> => ({ path: value }),
          ),
        },
        message: { headline: request.message },
      },
    });
    return readString(data, ["createCommitOnBranch", "commit", "oid"]);
  }
}
