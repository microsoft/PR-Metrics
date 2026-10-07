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
    when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([{ name: "bug" }, { name: "pr-metrics:M" }]);

    assert.deepEqual(await sut.getLabels(), ["bug", "pr-metrics:M"]);
    verify(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).once();
  });

  it("should return an empty list when no labels exist", async (): Promise<void> => {
    when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([]);

    assert.deepEqual(await sut.getLabels(), []);
  });

  [undefined, ""].forEach((name: string | undefined): void => {
    it(`should reject an invalid returned label name '${String(name)}'`, async (): Promise<void> => {
      when(mocks.gitApi.getPullRequestLabels("RepoID", 10, "Project")).thenResolve([{ name }]);

      await assert.rejects(sut.getLabels(), /is invalid, null, or undefined/u);
    });
  });

  it("should add each label by name without replacing others", async (): Promise<void> => {
    await sut.addLabels(["pr-metrics:M", "pr-metrics:tests-sufficient"]);

    verify(mocks.gitApi.createPullRequestLabel(deepEqual({ name: "pr-metrics:M" }), "RepoID", 10, "Project")).once();
    verify(mocks.gitApi.createPullRequestLabel(deepEqual({ name: "pr-metrics:tests-sufficient" }), "RepoID", 10, "Project")).once();
  });

  it("should not initialize for an empty addition", async (): Promise<void> => {
    await sut.addLabels([]);

    verify(mocks.azureDevOpsApiWrapper.getPersonalAccessTokenHandler(any())).never();
    verify(mocks.gitApi.createPullRequestLabel(any(), any(), any(), any())).never();
  });

  it("should remove only the named PR association", async (): Promise<void> => {
    await sut.removeLabel("pr-metrics:XL");

    verify(mocks.gitApi.deletePullRequestLabels("RepoID", 10, "pr-metrics:XL", "Project")).once();
  });

  [httpStatusCodes.unauthorized, httpStatusCodes.forbidden, httpStatusCodes.notFound].forEach((status: number): void => {
    ["list", "add", "remove"].forEach((operation: string): void => {
      it(`should map ${operation} failure ${String(status)} through existing error handling`, async (): Promise<void> => {
        const error: ErrorWithStatus = new ErrorWithStatus("API failed");
        error.statusCode = status;
        when(mocks.gitApi.getPullRequestLabels(any(), any(), any())).thenReject(error);
        when(mocks.gitApi.createPullRequestLabel(any(), any(), any(), any())).thenReject(error);
        when(mocks.gitApi.deletePullRequestLabels(any(), any(), any(), any())).thenReject(error);

        let action: Promise<unknown>;
        if (operation === "list") {
          action = sut.getLabels();
        } else if (operation === "add") {
          action = sut.addLabels(["pr-metrics:M"]);
        } else {
          action = sut.removeLabel("pr-metrics:M");
        }
        await assert.rejects(action, status === httpStatusCodes.notFound ? /The resource could not be found/u : /Could not access the resources/u);
        assert.equal(error.internalMessage, "API failed");
      });
    });
  });

  it("should stop adding labels after an API failure", async (): Promise<void> => {
    const error: Error = new Error("Creation failed");
    when(mocks.gitApi.createPullRequestLabel(deepEqual({ name: "pr-metrics:M" }), "RepoID", 10, "Project")).thenReject(error);

    await assert.rejects(sut.addLabels(["pr-metrics:M", "pr-metrics:tests-sufficient"]), error);
    verify(mocks.gitApi.createPullRequestLabel(deepEqual({ name: "pr-metrics:tests-sufficient" }), "RepoID", 10, "Project")).never();
  });
});
