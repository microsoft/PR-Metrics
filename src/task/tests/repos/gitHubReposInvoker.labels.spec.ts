/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  type GitHubReposInvokerMocks,
  createGitHubReposInvokerMocks,
  createSut,
} from "./gitHubReposInvokerTestSetup.js";
import { deepEqual, verify, when } from "ts-mockito";
import ErrorWithStatus from "../wrappers/errorWithStatus.js";
import type GitHubReposInvoker from "../../src/repos/gitHubReposInvoker.js";
import { RequestError } from "@octokit/request-error";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";
import { httpStatusCodes } from "../../src/utilities/httpStatusCodes.js";

const requestError = (message: string, status: number): RequestError =>
  new RequestError(message, status, {
    request: { headers: {}, method: "GET", url: "/labels" },
  });

describe("gitHubReposInvoker.ts labels", (): void => {
  let mocks: GitHubReposInvokerMocks;
  let sut: GitHubReposInvoker;

  beforeEach((): void => {
    mocks = createGitHubReposInvokerMocks();
    sut = createSut(
      mocks.gitInvoker,
      mocks.logger,
      mocks.octokitWrapper,
      mocks.runnerInvoker,
    );
  });

  it("should return all PR label names without changing labels", async (): Promise<void> => {
    when(mocks.octokitWrapper.getLabels("microsoft", "PR-Metrics", 12345))
      .thenResolve(["bug", "pr-metrics:M"]);

    assert.deepEqual(await sut.getLabels(), ["bug", "pr-metrics:M"]);
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });

  it("should preserve existing definitions and add PR associations", async (): Promise<void> => {
    await sut.addLabels(["pr-metrics:M", "pr-metrics:tests-sufficient"]);

    verify(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M")).once();
    verify(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:tests-sufficient")).once();
    verify(mocks.octokitWrapper.createLabel(any(), any(), any(), any())).never();
    verify(mocks.octokitWrapper.addLabels("microsoft", "PR-Metrics", 12345, deepEqual(["pr-metrics:M", "pr-metrics:tests-sufficient"]))).once();
  });

  it("should not initialize or mutate for an empty addition", async (): Promise<void> => {
    await sut.addLabels([]);

    verify(mocks.octokitWrapper.initialize(any())).never();
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });

  it("should create a missing definition before adding its association", async (): Promise<void> => {
    when(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M"))
      .thenThrow(requestError("Not Found", httpStatusCodes.notFound));

    await sut.addLabels(["pr-metrics:M"]);

    verify(mocks.octokitWrapper.createLabel("microsoft", "PR-Metrics", "pr-metrics:M", "ededed")).calledBefore(
      mocks.octokitWrapper.addLabels("microsoft", "PR-Metrics", 12345, deepEqual(["pr-metrics:M"])),
    );
  });

  it("should confirm a concurrently created definition before adding it", async (): Promise<void> => {
    when(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M"))
      .thenReject(requestError("Not Found", httpStatusCodes.notFound))
      .thenResolve();
    when(mocks.octokitWrapper.createLabel("microsoft", "PR-Metrics", "pr-metrics:M", "ededed"))
      .thenReject(requestError('Validation Failed: {"resource":"Label","code":"already_exists"}', httpStatusCodes.unprocessableEntity));

    await sut.addLabels(["pr-metrics:M"]);

    verify(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M")).twice();
    verify(mocks.octokitWrapper.addLabels("microsoft", "PR-Metrics", 12345, deepEqual(["pr-metrics:M"]))).once();
  });

  [
    new Error("Creation failed"),
    requestError("Forbidden", httpStatusCodes.forbidden),
    requestError("Validation failed", httpStatusCodes.unprocessableEntity),
  ].forEach((error: Error): void => {
    it(`should propagate creation failure '${error.message}' without adding an association`, async (): Promise<void> => {
      when(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M"))
        .thenReject(requestError("Not Found", httpStatusCodes.notFound));
      when(mocks.octokitWrapper.createLabel("microsoft", "PR-Metrics", "pr-metrics:M", "ededed")).thenReject(error);

      await assert.rejects(sut.addLabels(["pr-metrics:M"]), (actual: unknown): boolean => actual === error);
      verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
      verify(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M")).once();
    });
  });

  it("should fail when a creation conflict cannot be confirmed", async (): Promise<void> => {
    when(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M"))
      .thenReject(requestError("Not Found", httpStatusCodes.notFound));
    when(mocks.octokitWrapper.createLabel("microsoft", "PR-Metrics", "pr-metrics:M", "ededed"))
      .thenReject(requestError("already_exists", httpStatusCodes.unprocessableEntity));

    await assert.rejects(sut.addLabels(["pr-metrics:M"]), /The resource could not be found/u);
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });

  it("should remove only the named PR association", async (): Promise<void> => {
    await sut.removeLabel("pr-metrics:XL");

    verify(mocks.octokitWrapper.removeLabel("microsoft", "PR-Metrics", 12345, "pr-metrics:XL")).once();
  });

  [httpStatusCodes.unauthorized, httpStatusCodes.forbidden, httpStatusCodes.notFound].forEach((status: number): void => {
    ["list", "definition", "add", "remove"].forEach((operation: string): void => {
      it(`should map ${operation} failure ${String(status)} through existing error handling`, async (): Promise<void> => {
        const error: ErrorWithStatus = new ErrorWithStatus("API failed");
        error.status = status;
        when(mocks.octokitWrapper.getLabels(any(), any(), any())).thenReject(error);
        when(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).thenReject(error);
        when(mocks.octokitWrapper.removeLabel(any(), any(), any(), any())).thenReject(error);
        if (operation === "definition") {
          when(mocks.octokitWrapper.getLabel(any(), any(), any())).thenReject(error);
        }
        let action: Promise<unknown>;
        if (operation === "list") {
          action = sut.getLabels();
        } else if (operation === "remove") {
          action = sut.removeLabel("pr-metrics:M");
        } else {
          action = sut.addLabels(["pr-metrics:M"]);
        }

        await assert.rejects(action, status === httpStatusCodes.notFound ? /The resource could not be found/u : /Could not access the resources/u);
        assert.equal(error.internalMessage, "API failed");
      });
    });
  });

  it("should propagate an SDK permission failure when looking up a definition", async (): Promise<void> => {
    when(mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics:M"))
      .thenReject(requestError("Forbidden", httpStatusCodes.forbidden));

    await assert.rejects(sut.addLabels(["pr-metrics:M"]), /Could not access the resources/u);
    verify(mocks.octokitWrapper.createLabel(any(), any(), any(), any())).never();
  });
});
