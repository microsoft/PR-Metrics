/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { instance, mock } from "ts-mockito";
import OctokitGitDiffParser from "../../src/git/octokitGitDiffParser.js";
import OctokitWrapper from "../../src/wrappers/octokitWrapper.js";
import assert from "node:assert/strict";

/* eslint-disable @typescript-eslint/naming-convention -- Native GitHub response fields and HTTP headers. */

type FetchOptions = Parameters<typeof globalThis.fetch>[1];

describe("octokitWrapper.ts labels", (): void => {
  it("should paginate and send native label requests without replacing labels", async (): Promise<void> => {
    const requests: { url: string; options: FetchOptions }[] = [];
    const sut: OctokitWrapper = new OctokitWrapper(
      instance(mock(OctokitGitDiffParser)),
    );
    const pageSize = 100;
    sut.initialize({
      auth: "test-token",
      request: {
        fetch: async (
          input: Parameters<typeof globalThis.fetch>[0],
          options?: FetchOptions,
        ): Promise<Response> => {
          assert.ok(typeof input === "string");
          const url: string = input;
          requests.push({ options, url });
          if (new URL(url).searchParams.get("page") === "1") {
            return Promise.resolve(
              new Response(
                JSON.stringify(
                  Array.from(
                    { length: pageSize },
                    (_unused: unknown, index: number): object => ({
                      color: "ededed",
                      default: false,
                      description: null,
                      id: index + 1,
                      name: `label-${String(index)}`,
                      node_id: `node-${String(index)}`,
                      url: `https://api.github.com/repos/owner/repo/labels/label-${String(index)}`,
                    }),
                  ),
                ),
                {
                  headers: {
                    "content-type": "application/json",
                    link: '<https://api.github.com/repos/owner/repo/issues/42/labels?per_page=100&page=2>; rel="next"',
                  },
                },
              ),
            );
          }
          return Promise.resolve(
            new Response(
              JSON.stringify(
                url.includes("page=2")
                  ? [
                      {
                        color: "ededed",
                        default: false,
                        description: null,
                        id: 101,
                        name: "pr-metrics:M",
                        node_id: "node-101",
                        url: "https://api.github.com/repos/owner/repo/labels/pr-metrics%3AM",
                      },
                    ]
                  : {},
              ),
              { headers: { "content-type": "application/json" } },
            ),
          );
        },
      },
    });

    const labels: string[] = await sut.getLabels("owner", "repo", 42);
    await sut.getLabel("owner", "repo", "pr-metrics:M");
    await sut.createLabel("owner", "repo", "pr-metrics:M", "ededed");
    await sut.addLabels("owner", "repo", 42, ["pr-metrics:M"]);
    await sut.removeLabel("owner", "repo", 42, "pr-metrics:XL");

    assert.equal(labels.length, pageSize + 1);
    assert.equal(labels[0], "label-0");
    assert.equal(labels[pageSize], "pr-metrics:M");
    assert.deepEqual(
      requests.map(
        (request): string => `${request.options?.method ?? ""} ${request.url}`,
      ),
      [
        "GET https://api.github.com/repos/owner/repo/issues/42/labels?page=1&per_page=100",
        "GET https://api.github.com/repos/owner/repo/issues/42/labels?per_page=100&page=2",
        "GET https://api.github.com/repos/owner/repo/labels/pr-metrics%3AM",
        "POST https://api.github.com/repos/owner/repo/labels",
        "POST https://api.github.com/repos/owner/repo/issues/42/labels",
        "DELETE https://api.github.com/repos/owner/repo/issues/42/labels/pr-metrics%3AXL",
      ],
    );
    const definitionBody = requests[3]?.options?.body;
    const associationBody = requests[4]?.options?.body;
    assert.ok(typeof definitionBody === "string");
    assert.ok(typeof associationBody === "string");
    assert.deepEqual(JSON.parse(definitionBody), {
      color: "ededed",
      name: "pr-metrics:M",
    });
    assert.deepEqual(JSON.parse(associationBody), { labels: ["pr-metrics:M"] });
  });
});
