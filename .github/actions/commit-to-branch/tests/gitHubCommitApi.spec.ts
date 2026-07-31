/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "./testUtilities/assertExtensions.js";
import { commitObjectId, headObjectId } from "./testUtilities/rawIndex.js";
import FakeGraphQlClient from "./testUtilities/fakeGraphQlClient.js";
import GitHubCommitApi from "../src/gitHubCommitApi.js";
import assert from "node:assert/strict";

const repositoryId = "R_kgDOABCDEF";

describe("gitHubCommitApi.ts", (): void => {
  describe("getBranchState()", (): void => {
    it("should request the branch state with structured variables", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({
        repository: {
          id: repositoryId,
          ref: { target: { oid: headObjectId } },
        },
      });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act
      const result: unknown = await api.getBranchState(
        "microsoft",
        "PR-Metrics",
        "release/v1.7.16",
      );

      // Assert
      assert.deepEqual(result, {
        branchObjectId: headObjectId,
        repositoryId,
      });
      assert.equal(client.requests.length, 1);
      const [request] = client.requests;
      assert.ok(typeof request !== "undefined");
      assert.deepEqual(request.variables, {
        owner: "microsoft",
        qualifiedName: "refs/heads/release/v1.7.16",
        repository: "PR-Metrics",
      });
      assert.ok(request.query.includes("ref(qualifiedName:"));
    });

    it("should return no object ID when the branch does not exist", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({ repository: { id: repositoryId, ref: null } });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act
      const result: unknown = await api.getBranchState(
        "microsoft",
        "PR-Metrics",
        "release/v1.7.16",
      );

      // Assert
      assert.deepEqual(result, { branchObjectId: null, repositoryId });
    });

    it("should throw when the repository is not returned", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({ repository: null });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          api.getBranchState("microsoft", "PR-Metrics", "release/v1.7.16"),
        "The repository 'microsoft/PR-Metrics' could not be read via the GitHub GraphQL API.",
      );
    });

    it("should throw when the response is malformed", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({ repository: { ref: null } });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          api.getBranchState("microsoft", "PR-Metrics", "release/v1.7.16"),
        "The GitHub GraphQL API response did not include 'repository.id'.",
      );
    });
  });

  describe("createBranch()", (): void => {
    it("should create the branch with structured variables", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({
        createRef: { ref: { name: "refs/heads/release/v1.7.16" } },
      });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act
      const result: boolean = await api.createBranch(
        repositoryId,
        "release/v1.7.16",
        headObjectId,
      );

      // Assert
      assert.equal(result, true);
      assert.equal(client.requests.length, 1);
      const [request] = client.requests;
      assert.ok(typeof request !== "undefined");
      assert.deepEqual(request.variables, {
        input: {
          name: "refs/heads/release/v1.7.16",
          oid: headObjectId,
          repositoryId,
        },
      });
      assert.ok(request.query.includes("createRef(input: $input)"));
    });

    it("should report that the branch already exists when the reference is taken", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(
        new Error(
          "A ref named 'refs/heads/release/v1.7.16' already exists in the repository.",
        ),
      );
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act
      const result: boolean = await api.createBranch(
        repositoryId,
        "release/v1.7.16",
        headObjectId,
      );

      // Assert
      assert.equal(result, false);
    });

    it("should propagate unrelated failures", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue(new Error("Resource not accessible by integration."));
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          api.createBranch(repositoryId, "release/v1.7.16", headObjectId),
        "Resource not accessible by integration.",
      );
    });
  });

  describe("createCommit()", (): void => {
    it("should create the commit with structured variables", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({
        createCommitOnBranch: { commit: { oid: commitObjectId } },
      });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act
      const result: string = await api.createCommit({
        additions: [{ contents: "Y29udGVudHM=", path: "$(whoami).txt" }],
        branch: "release/v1.7.16",
        deletions: ["deleted;file.txt"],
        expectedHeadObjectId: headObjectId,
        message: "feat: release v1.7.16",
        nameWithOwner: "microsoft/PR-Metrics",
      });

      // Assert
      assert.equal(result, commitObjectId);
      assert.equal(client.requests.length, 1);
      const [request] = client.requests;
      assert.ok(typeof request !== "undefined");
      assert.deepEqual(request.variables, {
        input: {
          branch: {
            branchName: "release/v1.7.16",
            repositoryNameWithOwner: "microsoft/PR-Metrics",
          },
          expectedHeadOid: headObjectId,
          fileChanges: {
            additions: [{ contents: "Y29udGVudHM=", path: "$(whoami).txt" }],
            deletions: [{ path: "deleted;file.txt" }],
          },
          message: { headline: "feat: release v1.7.16" },
        },
      });
      assert.ok(request.query.includes("createCommitOnBranch(input: $input)"));
      assert.ok(request.query.includes("$input: CreateCommitOnBranchInput!"));
    });

    it("should throw when the response is malformed", async (): Promise<void> => {
      // Arrange
      const client: FakeGraphQlClient = new FakeGraphQlClient();
      client.enqueue({ createCommitOnBranch: { commit: null } });
      const api: GitHubCommitApi = new GitHubCommitApi(client);

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> =>
          api.createCommit({
            additions: [],
            branch: "release/v1.7.16",
            deletions: ["deleted.txt"],
            expectedHeadObjectId: headObjectId,
            message: "feat: release v1.7.16",
            nameWithOwner: "microsoft/PR-Metrics",
          }),
        "The GitHub GraphQL API response did not include 'createCommitOnBranch.commit.oid'.",
      );
    });
  });
});
