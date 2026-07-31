/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type GraphQlClientInterface from "./interfaces/graphQlClientInterface.js";
import type HttpClientInterface from "./interfaces/httpClientInterface.js";
import type HttpResponseInterface from "./interfaces/httpResponseInterface.js";
import { readValue } from "./graphQlResponse.js";

const successStatusCode = 200;

/* eslint-disable @typescript-eslint/naming-convention -- Required for alignment with HTTP header names. */
const buildHeaders = (token: string): Record<string, string> => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "User-Agent": "microsoft/PR-Metrics",
});
/* eslint-enable @typescript-eslint/naming-convention -- Required for alignment with HTTP header names. */

/**
 * A class for performing GraphQL requests against the GitHub API. The token is only ever placed in the authorization
 * header, so it never appears in a URL, an argument vector, or the log output.
 */
export default class GitHubGraphQlClient implements GraphQlClientInterface {
  private readonly _endpoint: string;
  private readonly _httpClient: HttpClientInterface;
  private readonly _token: string;

  /**
   * Initializes a new instance of the `GitHubGraphQlClient` class.
   * @param endpoint The URL of the GraphQL endpoint.
   * @param token The token with which to authenticate.
   * @param httpClient The HTTP client.
   */
  public constructor(
    endpoint: string,
    token: string,
    httpClient: HttpClientInterface,
  ) {
    this._endpoint = endpoint;
    this._token = token;
    this._httpClient = httpClient;
  }

  /**
   * Performs a GraphQL request.
   * @param query The GraphQL document.
   * @param variables The variables to associate with the document.
   * @returns A promise containing the `data` payload of the response.
   */
  public async request(
    query: string,
    variables: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    const response: HttpResponseInterface = await this._httpClient.post(
      this._endpoint,
      buildHeaders(this._token),
      JSON.stringify({ query, variables }),
    );
    if (response.status !== successStatusCode) {
      throw new Error(
        `The GitHub GraphQL API returned the status code '${String(response.status)}'.`,
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(response.body);
    } catch {
      throw new Error(
        "The GitHub GraphQL API response could not be parsed as JSON.",
      );
    }

    const errors: unknown = readValue(payload, ["errors"]);
    if (Array.isArray(errors)) {
      const messages: string[] = (errors as unknown[]).map(
        (value: unknown): string => {
          const message: unknown = readValue(value, ["message"]);
          return typeof message === "string" ? message : "Unknown error.";
        },
      );
      throw new Error(
        `The GitHub GraphQL API reported an error: ${messages.join(" ")}`,
      );
    }

    const data: unknown = readValue(payload, ["data"]);
    if (data === null) {
      throw new Error("The GitHub GraphQL API response contained no data.");
    }

    return data;
  }
}
