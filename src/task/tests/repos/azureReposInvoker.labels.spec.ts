/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  type AzureReposInvokerMocks,
  createAzureReposInvokerMocks,
  createSut,
} from "./azureReposInvokerTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import type AzureReposInvoker from "../../src/repos/azureReposInvoker.js";
import ErrorWithStatus from "../wrappers/errorWithStatus.js";
import type { WebApiTagDefinition } from "azure-devops-node-api/interfaces/CoreInterfaces.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";
import { httpStatusCodes } from "../../src/utilities/httpStatusCodes.js";

describe("azureReposInvoker.ts labels", (): void => {
  let mocks: AzureReposInvokerMocks;
  let sut: AzureReposInvoker;

  beforeEach((): void => {
    mocks = createAzureReposInvokerMocks();
    sut = createSut(
      mocks.azureDevOpsApiWrapper,
      mocks.gitInvoker,
      mocks.logger,
      mocks.runnerInvoker,
      mocks.tokenManager,
    );
  });

  it("should return all native PR labels", async (): Promise<void> => {
    // Arrange
    when(
      mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project"),
    ).thenResolve([{ name: "bug" }, { name: "pr-metrics:M" }]);

    // Act
    const labels: string[] = await sut.getLabels();

    // Assert
    assert.deepEqual(labels, ["bug", "pr-metrics:M"]);
    verify(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).once();
  });

  it("should return an empty list when no labels exist", async (): Promise<void> => {
    // Arrange
    when(
      mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project"),
    ).thenResolve([]);

    // Act
    const labels: string[] = await sut.getLabels();

    // Assert
    assert.deepEqual(labels, []);
  });

  [undefined, ""].forEach((name: string | undefined): void => {
    it(`should reject an invalid returned label name '${String(name)}'`, async (): Promise<void> => {
      // Arrange
      when(
        mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project"),
      ).thenResolve([{ name }]);

      // Act
      const labels: Promise<string[]> = sut.getLabels();

      // Assert
      await assert.rejects(labels, /is invalid, null, or undefined/u);
    });
  });

  it("should add each label by name without replacing others", async (): Promise<void> => {
    // Arrange
    const names: string[] = ["pr-metrics:M", "pr-metrics:tests-sufficient"];

    // Act
    await sut.addLabels(names);

    // Assert
    verify(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:M" }),
        "RepoID",
        10,
        "Project",
      ),
    ).once();
    verify(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:tests-sufficient" }),
        "RepoID",
        10,
        "Project",
      ),
    ).once();
  });

  it("should not initialize for an empty addition", async (): Promise<void> => {
    // Arrange
    const names: string[] = [];

    // Act
    await sut.addLabels(names);

    // Assert
    verify(
      mocks.azureDevOpsApiWrapper.getPersonalAccessTokenHandler(any()),
    ).never();
    verify(
      mocks.gitApi.createPullRequestLabel(any(), any(), any(), any()),
    ).never();
  });

  it("should remove only the named PR association", async (): Promise<void> => {
    // Arrange
    const name = "pr-metrics:XL";
    when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([
      { id: "12", name },
      { id: "13", name: "bug" },
    ]);

    // Act
    await sut.removeLabel(name);

    // Assert
    verify(
      mocks.gitApi.deletePullRequestLabels("RepoID", 10, "12", "Project"),
    ).once();
    verify(
      mocks.gitApi.deletePullRequestLabels("RepoID", 10, "13", "Project"),
    ).never();
  });

  it("should delete a stale colon-containing label by its ID", async (): Promise<void> => {
    // Arrange
    when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([
      { id: "42", name: "pr-metrics:S" },
      { id: "43", name: "pr-metrics:M" },
    ]);

    // Act
    await sut.removeLabel("pr-metrics:S");

    // Assert
    verify(
      mocks.gitApi.deletePullRequestLabels("RepoID", 10, "42", "Project"),
    ).once();
    verify(
      mocks.gitApi.deletePullRequestLabels("RepoID", 10, "pr-metrics:S", "Project"),
    ).never();
  });

  it("should skip deletion when a stale label disappears before removal", async (): Promise<void> => {
    when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([
      { id: "43", name: "pr-metrics:M" },
    ]);

    await sut.removeLabel("pr-metrics:S");

    verify(mocks.gitApi.deletePullRequestLabels(any(), any(), any(), any())).never();
  });

  it("should reject a matching label without an ID rather than deleting by name", async (): Promise<void> => {
    when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([
      { name: "pr-metrics:S" },
    ]);

    await assert.rejects(sut.removeLabel("pr-metrics:S"), /is invalid, null, or undefined/u);
    verify(mocks.gitApi.deletePullRequestLabels(any(), any(), any(), any())).never();
  });

  [
    httpStatusCodes.unauthorized,
    httpStatusCodes.forbidden,
    httpStatusCodes.notFound,
  ].forEach((status: number): void => {
    ["list", "add", "remove"].forEach((operation: string): void => {
      it(`should map ${operation} failure ${String(status)} through existing error handling`, async (): Promise<void> => {
        // Arrange
        const error: ErrorWithStatus = new ErrorWithStatus("API failed");
        error.statusCode = status;
        when(mocks.gitApi.getPullRequestLabels(any(), any(), any())).thenReject(
          error,
        );
        when(
          mocks.gitApi.createPullRequestLabel(any(), any(), any(), any()),
        ).thenReject(error);
        when(
          mocks.gitApi.deletePullRequestLabels(any(), any(), any(), any()),
        ).thenReject(error);

        // Act
        let action: Promise<unknown>;
        if (operation === "list") {
          action = sut.getLabels();
        } else if (operation === "add") {
          action = sut.addLabels(["pr-metrics:M"]);
        } else {
          when(
            mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project"),
          ).thenResolve([{ id: "42", name: "pr-metrics:M" }]);
          action = sut.removeLabel("pr-metrics:M");
        }
        // Assert
        await assert.rejects(
          action,
          status === httpStatusCodes.notFound
            ? /The resource could not be found/u
            : /Could not access the resources/u,
        );
        assert.equal(error.internalMessage, "API failed");
      });
    });
  });

  it("should stop adding labels after an API failure", async (): Promise<void> => {
    // Arrange
    const error: Error = new Error("Creation failed");
    when(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:M" }),
        "RepoID",
        10,
        "Project",
      ),
    ).thenReject(error);

    // Act
    const addition: Promise<void> = sut.addLabels([
      "pr-metrics:M",
      "pr-metrics:tests-sufficient",
    ]);

    // Assert
    await assert.rejects(addition, error);
    verify(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:tests-sufficient" }),
        "RepoID",
        10,
        "Project",
      ),
    ).never();
  });

  it("should wait for the last label creation before completing", async (): Promise<void> => {
    // Arrange
    const creation = Promise.withResolvers<WebApiTagDefinition>();
    const started = Promise.withResolvers<undefined>();
    let completed = false;
    when(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:tests-sufficient" }),
        "RepoID",
        10,
        "Project",
      ),
    ).thenCall(async (): Promise<WebApiTagDefinition> => {
      started.resolve(undefined);
      return creation.promise;
    });

    // Act
    const addition: Promise<void> = sut
      .addLabels(["pr-metrics:M", "pr-metrics:tests-sufficient"])
      .then((): void => {
        completed = true;
      });
    await started.promise;

    // Assert
    assert.equal(completed, false);
    verify(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:M" }),
        "RepoID",
        10,
        "Project",
      ),
    ).calledBefore(
      mocks.gitApi.createPullRequestLabel(
        deepEqual({ name: "pr-metrics:tests-sufficient" }),
        "RepoID",
        10,
        "Project",
      ),
    );

    // Act
    creation.resolve({ name: "pr-metrics:tests-sufficient" });
    await addition;

    // Assert
    assert.equal(completed, true);
  });
});
