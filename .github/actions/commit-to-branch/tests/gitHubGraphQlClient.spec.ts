/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "./testUtilities/assertExtensions.js";
import GitHubGraphQlClient from "../src/gitHubGraphQlClient.js";
import type HttpClientInterface from "../src/interfaces/httpClientInterface.js";
import type HttpResponseInterface from "../src/interfaces/httpResponseInterface.js";
import assert from "node:assert/strict";

const endpoint = "https://api.github.com/graphql";
const token = "test-token";

class RecordingHttpClient implements HttpClientInterface {
  public readonly bodies: string[] = [];
  public readonly headers: Readonly<Record<string, string>>[] = [];
  public readonly urls: string[] = [];

  private readonly _response: HttpResponseInterface;

  public constructor(response: HttpResponseInterface) {
    this._response = response;
  }

  public async post(
    url: string,
    headers: Readonly<Record<string, string>>,
    body: string,
  ): Promise<HttpResponseInterface> {
    this.urls.push(url);
    this.headers.push(headers);
    this.bodies.push(body);
    return Promise.resolve(this._response);
  }
}

describe("gitHubGraphQlClient.ts", (): void => {
  describe("request()", (): void => {
    it("should post the query and variables as structured JSON", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: JSON.stringify({ data: { repository: { id: "R_1" } } }),
        status: 200,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act
      const result: unknown = await client.request("query { viewer }", {
        owner: "microsoft",
      });

      // Assert
      assert.deepEqual(result, { repository: { id: "R_1" } });
      assert.deepEqual(httpClient.urls, [endpoint]);
      assert.deepEqual(JSON.parse(httpClient.bodies[0] ?? ""), {
        query: "query { viewer }",
        variables: { owner: "microsoft" },
      });
    });

    it("should send the token only within the authorization header", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: JSON.stringify({ data: {} }),
        status: 200,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act
      await client.request("query { viewer }", {});

      // Assert
      assert.equal(httpClient.urls[0]?.includes(token), false);
      assert.equal(httpClient.bodies[0]?.includes(token), false);
      assert.equal(httpClient.headers[0]?.Authorization, `Bearer ${token}`);
    });

    it("should throw without disclosing the token when the response reports errors", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: JSON.stringify({
          errors: [{ message: "Resource not accessible by integration." }],
        }),
        status: 200,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => client.request("query { viewer }", {}),
        "The GitHub GraphQL API reported an error: Resource not accessible by integration.",
      );
    });

    it("should join multiple error messages", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: JSON.stringify({
          errors: [{ message: "First." }, { message: "Second." }],
        }),
        status: 200,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => client.request("query { viewer }", {}),
        "The GitHub GraphQL API reported an error: First. Second.",
      );
    });

    it("should throw when the status code indicates failure", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: `{"message":"Bad credentials for ${token}"}`,
        status: 401,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => client.request("query { viewer }", {}),
        "The GitHub GraphQL API returned the status code '401'.",
      );
    });

    it("should throw when the response is not JSON", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: "<html>Gateway Timeout</html>",
        status: 200,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => client.request("query { viewer }", {}),
        "The GitHub GraphQL API response could not be parsed as JSON.",
      );
    });

    it("should throw when the response contains no data", async (): Promise<void> => {
      // Arrange
      const httpClient: RecordingHttpClient = new RecordingHttpClient({
        body: JSON.stringify({ message: "Not Found" }),
        status: 200,
      });
      const client: GitHubGraphQlClient = new GitHubGraphQlClient(
        endpoint,
        token,
        httpClient,
      );

      // Act & Assert
      await AssertExtensions.toThrowAsync(
        async (): Promise<unknown> => client.request("query { viewer }", {}),
        "The GitHub GraphQL API response contained no data.",
      );
    });
  });
});
