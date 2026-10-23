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

const requestError = (
  message: string,
  status: number,
  data?: unknown,
): RequestError =>
  new RequestError(message, status, {
    request: { headers: {}, method: "GET", url: "/labels" },
    response:
      data === undefined
        ? undefined
        : { data, headers: {}, status, url: "/labels" },
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
    // Arrange
    when(
      mocks.octokitWrapper.getLabels("microsoft", "PR-Metrics", 12345),
    ).thenResolve(["bug", "pr-metrics-M"]);

    // Act
    const labels: string[] = await sut.getLabels();

    // Assert
    assert.deepEqual(labels, ["bug", "pr-metrics-M"]);
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });

  it("should preserve existing definitions and add PR associations", async (): Promise<void> => {
    // Arrange
    const names: string[] = ["pr-metrics-M", "pr-metrics-tests-sufficient"];

    // Act
    await sut.addLabels(names);

    // Assert
    verify(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).once();
    verify(
      mocks.octokitWrapper.getLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-tests-sufficient",
      ),
    ).once();
    verify(
      mocks.octokitWrapper.createLabel(any(), any(), any(), any()),
    ).never();
    verify(
      mocks.octokitWrapper.addLabels(
        "microsoft",
        "PR-Metrics",
        12345,
        deepEqual(["pr-metrics-M", "pr-metrics-tests-sufficient"]),
      ),
    ).once();
  });

  it("should not initialize or mutate for an empty addition", async (): Promise<void> => {
    // Arrange
    const names: string[] = [];

    // Act
    await sut.addLabels(names);

    // Assert
    verify(mocks.octokitWrapper.initialize(any())).never();
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });

  it("should create a missing definition before adding its association", async (): Promise<void> => {
    // Arrange
    when(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).thenThrow(requestError("Not Found", httpStatusCodes.notFound));

    // Act
    await sut.addLabels(["pr-metrics-M"]);

    // Assert
    verify(
      mocks.octokitWrapper.createLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-M",
        "ededed",
      ),
    ).calledBefore(
      mocks.octokitWrapper.addLabels(
        "microsoft",
        "PR-Metrics",
        12345,
        deepEqual(["pr-metrics-M"]),
      ),
    );
  });

  it("should confirm a concurrently created definition before adding it", async (): Promise<void> => {
    // Arrange
    when(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    )
      .thenReject(requestError("Not Found", httpStatusCodes.notFound))
      .thenResolve();
    when(
      mocks.octokitWrapper.createLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-M",
        "ededed",
      ),
    ).thenReject(
      requestError("Validation Failed", httpStatusCodes.unprocessableEntity, {
        errors: [{ code: "already_exists", field: "name", resource: "Label" }],
        message: "Validation Failed",
      }),
    );

    // Act
    await sut.addLabels(["pr-metrics-M"]);

    // Assert
    verify(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).twice();
    verify(
      mocks.octokitWrapper.addLabels(
        "microsoft",
        "PR-Metrics",
        12345,
        deepEqual(["pr-metrics-M"]),
      ),
    ).once();
  });

  [
    new Error("Creation failed"),
    requestError("Forbidden", httpStatusCodes.forbidden),
    requestError("Validation failed", httpStatusCodes.unprocessableEntity),
    requestError("already_exists", httpStatusCodes.unprocessableEntity),
    ...[
      null,
      "already_exists",
      {},
      { errors: null },
      { errors: [] },
      {
        errors: [
          null,
          "already_exists",
          {},
          { code: "already_exists" },
          { code: "already_exists", resource: "Issue" },
          { resource: "Label" },
          { code: "invalid", resource: "Label" },
        ],
      },
    ].map((data: unknown): RequestError =>
      requestError(
        "Validation Failed",
        httpStatusCodes.unprocessableEntity,
        data,
      ),
    ),
  ].forEach((error: Error): void => {
    it(`should propagate creation failure '${error.message}' without adding an association`, async (): Promise<void> => {
      // Arrange
      when(
        mocks.octokitWrapper.getLabel(
          "microsoft",
          "PR-Metrics",
          "pr-metrics-M",
        ),
      ).thenReject(requestError("Not Found", httpStatusCodes.notFound));
      when(
        mocks.octokitWrapper.createLabel(
          "microsoft",
          "PR-Metrics",
          "pr-metrics-M",
          "ededed",
        ),
      ).thenReject(error);

      // Act
      const addition: Promise<void> = sut.addLabels(["pr-metrics-M"]);

      // Assert
      await assert.rejects(
        addition,
        (actual: unknown): boolean => actual === error,
      );
      verify(
        mocks.octokitWrapper.addLabels(any(), any(), any(), any()),
      ).never();
      verify(
        mocks.octokitWrapper.getLabel(
          "microsoft",
          "PR-Metrics",
          "pr-metrics-M",
        ),
      ).once();
    });
  });

  it("should fail when a creation conflict cannot be confirmed", async (): Promise<void> => {
    // Arrange
    when(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).thenReject(requestError("Not Found", httpStatusCodes.notFound));
    when(
      mocks.octokitWrapper.createLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-M",
        "ededed",
      ),
    ).thenReject(
      requestError("Validation Failed", httpStatusCodes.unprocessableEntity, {
        errors: [{ code: "already_exists", field: "name", resource: "Label" }],
      }),
    );

    // Act
    const addition: Promise<void> = sut.addLabels(["pr-metrics-M"]);

    // Assert
    await assert.rejects(addition, /The resource could not be found/u);
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });

  it("should remove only the named PR association", async (): Promise<void> => {
    // Arrange
    const name = "pr-metrics-XL";

    // Act
    await sut.removeLabel(name);

    // Assert
    verify(
      mocks.octokitWrapper.removeLabel(
        "microsoft",
        "PR-Metrics",
        12345,
        "pr-metrics-XL",
      ),
    ).once();
  });

  [
    httpStatusCodes.unauthorized,
    httpStatusCodes.forbidden,
    httpStatusCodes.notFound,
  ].forEach((status: number): void => {
    ["list", "definition", "add", "remove"].forEach(
      (operation: string): void => {
        it(`should map ${operation} failure ${String(status)} through existing error handling`, async (): Promise<void> => {
          // Arrange
          const error: ErrorWithStatus = new ErrorWithStatus("API failed");
          error.status = status;
          when(mocks.octokitWrapper.getLabels(any(), any(), any())).thenReject(
            error,
          );
          when(
            mocks.octokitWrapper.addLabels(any(), any(), any(), any()),
          ).thenReject(error);
          when(
            mocks.octokitWrapper.removeLabel(any(), any(), any(), any()),
          ).thenReject(error);
          if (operation === "definition") {
            when(mocks.octokitWrapper.getLabel(any(), any(), any())).thenReject(
              error,
            );
          }
          // Act
          let action: Promise<unknown>;
          if (operation === "list") {
            action = sut.getLabels();
          } else if (operation === "remove") {
            action = sut.removeLabel("pr-metrics-M");
          } else {
            action = sut.addLabels(["pr-metrics-M"]);
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
      },
    );
  });

  it("should propagate an SDK permission failure when looking up a definition", async (): Promise<void> => {
    // Arrange
    when(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).thenReject(requestError("Forbidden", httpStatusCodes.forbidden));

    // Act
    const addition: Promise<void> = sut.addLabels(["pr-metrics-M"]);

    // Assert
    await assert.rejects(addition, /Could not access the resources/u);
    verify(
      mocks.octokitWrapper.createLabel(any(), any(), any(), any()),
    ).never();
  });

  it("should check definitions sequentially before adding associations", async (): Promise<void> => {
    // Arrange
    const definition = Promise.withResolvers<undefined>();
    const started = Promise.withResolvers<undefined>();
    when(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).thenCall(async (): Promise<void> => {
      started.resolve(undefined);
      return definition.promise;
    });

    // Act
    const addition: Promise<void> = sut.addLabels([
      "pr-metrics-M",
      "pr-metrics-tests-sufficient",
    ]);
    await started.promise;

    // Assert
    verify(
      mocks.octokitWrapper.getLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-tests-sufficient",
      ),
    ).never();
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();

    // Act
    definition.resolve(undefined);
    await addition;

    // Assert
    verify(
      mocks.octokitWrapper.getLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-tests-sufficient",
      ),
    ).calledBefore(
      mocks.octokitWrapper.addLabels(
        "microsoft",
        "PR-Metrics",
        12345,
        deepEqual(["pr-metrics-M", "pr-metrics-tests-sufficient"]),
      ),
    );
  });

  it("should stop checking definitions after a failure", async (): Promise<void> => {
    // Arrange
    const error: Error = new Error("Definition lookup failed");
    when(
      mocks.octokitWrapper.getLabel("microsoft", "PR-Metrics", "pr-metrics-M"),
    ).thenReject(error);

    // Act
    const addition: Promise<void> = sut.addLabels([
      "pr-metrics-M",
      "pr-metrics-tests-sufficient",
    ]);

    // Assert
    await assert.rejects(addition, error);
    verify(
      mocks.octokitWrapper.getLabel(
        "microsoft",
        "PR-Metrics",
        "pr-metrics-tests-sufficient",
      ),
    ).never();
    verify(mocks.octokitWrapper.addLabels(any(), any(), any(), any())).never();
  });
});
