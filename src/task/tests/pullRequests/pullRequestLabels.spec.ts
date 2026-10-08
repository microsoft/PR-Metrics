/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, mock, verify, when } from "ts-mockito";
import CodeMetrics from "../../src/metrics/codeMetrics.js";
import Logger from "../../src/utilities/logger.js";
import PullRequestLabels from "../../src/pullRequests/pullRequestLabels.js";
import ReposInvoker from "../../src/repos/reposInvoker.js";
import { any } from "../testUtilities/mockito.js";
import assert from "node:assert/strict";

describe("pullRequestLabels.ts", (): void => {
  let codeMetrics: CodeMetrics;
  let logger: Logger;
  let reposInvoker: ReposInvoker;
  let sut: PullRequestLabels;
  let labels: string[];
  let operations: string[];

  beforeEach((): void => {
    codeMetrics = mock(CodeMetrics);
    when(codeMetrics.getSize()).thenResolve("M");
    when(codeMetrics.isSufficientlyTested()).thenResolve(false);
    logger = mock(Logger);
    reposInvoker = mock(ReposInvoker);
    labels = [];
    operations = [];
    when(reposInvoker.getLabels()).thenCall((): string[] => [...labels]);
    when(reposInvoker.addLabels(any())).thenCall((names: string[]): void => {
      operations.push(`add ${names.join(",")}`);
      labels.push(...names);
    });
    when(reposInvoker.removeLabel(any())).thenCall((name: string): void => {
      operations.push(`remove ${name}`);
      labels = labels.filter((label: string): boolean => label !== name);
    });
    sut = new PullRequestLabels(
      instance(codeMetrics),
      instance(logger),
      instance(reposInvoker),
    );
  });

  [
    {
      expected: ["pr-metrics:M", "pr-metrics:tests-sufficient"],
      sufficient: true,
    },
    {
      expected: ["pr-metrics:M", "pr-metrics:tests-insufficient"],
      sufficient: false,
    },
    { expected: ["pr-metrics:M"], sufficient: null },
  ].forEach((testCase): void => {
    [
      [],
      ["pr-metrics:tests-sufficient"],
      ["pr-metrics:tests-insufficient"],
      ["pr-metrics:tests-sufficient", "pr-metrics:tests-insufficient"],
    ].forEach((initial: string[]): void => {
      it(`should converge from '${initial.join(",")}' when test sufficiency is '${String(testCase.sufficient)}'`, async (): Promise<void> => {
        labels = [...initial];
        when(codeMetrics.isSufficientlyTested()).thenResolve(
          testCase.sufficient,
        );

        await sut.updateLabels();
        await sut.updateLabels();

        assert.deepEqual(labels.toSorted(), testCase.expected.toSorted());
        verify(reposInvoker.getLabels()).twice();
        verify(reposInvoker.addLabels(any())).once();
      });
    });
  });

  ["XS", "S", "M", "L", "XL", "2XL", "10XL", "123XL"].forEach(
    (size: string): void => {
      it(`should use the metric size '${size}' without parsing a title`, async (): Promise<void> => {
        when(codeMetrics.getSize()).thenResolve(size);

        await sut.updateLabels();

        assert.deepEqual(labels, [
          `pr-metrics:${size}`,
          "pr-metrics:tests-insufficient",
        ]);
      });
    },
  );

  it("should remove stale size labels and preserve unrelated labels", async (): Promise<void> => {
    const unrelated: string[] = [
      "bug",
      "size:XL",
      "pr-metrics:manual",
      "pr-metrics:0XL",
      "pr-metrics:1XL",
      "pr-metrics:01XL",
      "pr-metrics:2XL-extra",
      "pr-metrics:tests-sufficient-extra",
      "other:pr-metrics:XL",
    ];
    labels = [
      ...unrelated,
      "pr-metrics:XS",
      "pr-metrics:S",
      "pr-metrics:L",
      "pr-metrics:XL",
      "pr-metrics:2XL",
      "pr-metrics:10XL",
      "pr-metrics:123XL",
    ];

    await sut.updateLabels();

    assert.deepEqual(labels, [
      ...unrelated,
      "pr-metrics:M",
      "pr-metrics:tests-insufficient",
    ]);
  });

  it("should make no mutations when desired labels exist with different casing", async (): Promise<void> => {
    labels = ["PR-METRICS:m", "pr-metrics:TESTS-INSUFFICIENT", "bug"];

    await sut.updateLabels();

    assert.deepEqual(operations, []);
    assert.deepEqual(labels, [
      "PR-METRICS:m",
      "pr-metrics:TESTS-INSUFFICIENT",
      "bug",
    ]);
    verify(reposInvoker.getLabels()).once();
  });

  it("should remove stale managed labels using their original casing", async (): Promise<void> => {
    labels = ["PR-METRICS:xl", "PR-METRICS:TESTS-SUFFICIENT"];

    await sut.updateLabels();

    assert.deepEqual(operations, [
      "add pr-metrics:M,pr-metrics:tests-insufficient",
      "remove PR-METRICS:xl",
      "remove PR-METRICS:TESTS-SUFFICIENT",
    ]);
  });

  it("should remove disabled test labels without adding an existing size label", async (): Promise<void> => {
    labels = [
      "pr-metrics:M",
      "pr-metrics:tests-sufficient",
      "pr-metrics:tests-insufficient",
    ];
    when(codeMetrics.isSufficientlyTested()).thenResolve(null);

    await sut.updateLabels();

    assert.deepEqual(labels, ["pr-metrics:M"]);
    assert.deepEqual(operations, [
      "remove pr-metrics:tests-sufficient",
      "remove pr-metrics:tests-insufficient",
    ]);
  });

  it("should not remove labels after an addition fails", async (): Promise<void> => {
    labels = ["pr-metrics:XL", "pr-metrics:tests-sufficient"];
    const error: Error = new Error("Addition failed");
    when(reposInvoker.addLabels(any())).thenReject(error);

    await assert.rejects(sut.updateLabels(), error);

    assert.deepEqual(labels, ["pr-metrics:XL", "pr-metrics:tests-sufficient"]);
    verify(reposInvoker.removeLabel(any())).never();
  });

  it("should stop after a partial removal failure and converge on a later run", async (): Promise<void> => {
    labels = ["pr-metrics:XL", "pr-metrics:tests-sufficient", "pr-metrics:2XL"];
    const error: Error = new Error("Removal failed");
    when(reposInvoker.removeLabel("pr-metrics:tests-sufficient")).thenReject(
      error,
    );

    await assert.rejects(sut.updateLabels(), error);
    assert.deepEqual(labels, [
      "pr-metrics:tests-sufficient",
      "pr-metrics:2XL",
      "pr-metrics:M",
      "pr-metrics:tests-insufficient",
    ]);
    verify(reposInvoker.removeLabel("pr-metrics:2XL")).never();
    when(reposInvoker.removeLabel("pr-metrics:tests-sufficient")).thenCall(
      (name: string): void => {
        labels = labels.filter((label: string): boolean => label !== name);
      },
    );
    await sut.updateLabels();

    assert.deepEqual(labels, ["pr-metrics:M", "pr-metrics:tests-insufficient"]);
    verify(reposInvoker.addLabels(any())).once();
  });

  it("should propagate a listing failure without making mutations", async (): Promise<void> => {
    const error: Error = new Error("Listing failed");
    when(reposInvoker.getLabels()).thenReject(error);

    await assert.rejects(sut.updateLabels(), error);

    assert.deepEqual(operations, []);
  });

  it("should propagate a metrics failure without making mutations", async (): Promise<void> => {
    const error: Error = new Error("Metrics failed");
    when(codeMetrics.getSize()).thenReject(error);

    await assert.rejects(sut.updateLabels(), error);

    assert.deepEqual(operations, []);
  });
});
