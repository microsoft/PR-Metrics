/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { httpTimeoutMs } from "../utilities/constants.js";

/* eslint-disable @typescript-eslint/naming-convention -- Required for alignment with the OAuth 2.0 token response schema. */
interface AccessTokenResponse {
  access_token?: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * A wrapper around the Fetch API, to facilitate testability.
 */
export default class HttpWrapper {
  /**
   * Gets the contents of a URL.
   * @param url The URL whose contents should be retrieved.
   * @returns The contents of the URL.
   */
  public async getUrl(url: string): Promise<string> {
    const response: Response = await fetch(url, {
      signal: AbortSignal.timeout(httpTimeoutMs),
    });
    if (!response.ok) {
      throw new Error(
        `HTTP request to '${url}' failed with status ${String(response.status)} (${response.statusText}).`,
      );
    }

    return response.text();
  }

  /**
   * Posts a URL-encoded form body to a URL over HTTPS and returns the `access_token` field from the resulting JSON
   * response. This is a focused helper for OAuth 2.0 client credentials token exchanges – the request body, the
   * response body, and any acquired token are never included in thrown errors.
   * @param url The token endpoint URL to which the form should be posted.
   * @param form The URL-encoded form fields to post as the request body.
   * @returns The nonblank access token returned by the endpoint.
   */
  public async postForm(url: string, form: URLSearchParams): Promise<string> {
    let response: Response;
    try {
      response = await fetch(url, {
        body: form.toString(),
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- Required for alignment with the HTTP header.
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        signal: AbortSignal.timeout(httpTimeoutMs),
      });
    } catch (error) {
      const reason: string =
        error instanceof Error ? error.name : "UnknownError";
      throw new Error(
        `HTTP POST request to '${url}' failed before a response was received (${reason}).`,
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new Error(
        `HTTP POST request to '${url}' failed with status ${String(response.status)}.`,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(
        `HTTP POST request to '${url}' returned a response that could not be parsed as JSON.`,
        { cause: error },
      );
    }

    const accessToken: string | null =
      typeof payload === "object" && payload !== null
        ? ((payload as AccessTokenResponse).access_token ?? null)
        : null;
    if (accessToken === null || accessToken.length === 0) {
      throw new Error(
        `HTTP POST request to '${url}' did not return a valid access token.`,
      );
    }

    return accessToken;
  }
}
