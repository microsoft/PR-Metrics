/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type HttpClientInterface from "./interfaces/httpClientInterface.js";
import type HttpResponseInterface from "./interfaces/httpResponseInterface.js";

/**
 * A class for performing HTTP requests via the platform `fetch` implementation.
 */
export default class FetchHttpClient implements HttpClientInterface {
  /**
   * Performs an HTTP `POST` request.
   * @param url The URL to which to post.
   * @param headers The headers to include in the request.
   * @param body The body of the request.
   * @returns A promise containing the response.
   */
  public async post(
    url: string,
    headers: Readonly<Record<string, string>>,
    body: string,
  ): Promise<HttpResponseInterface> {
    const response: Response = await fetch(url, {
      body,
      headers: { ...headers },
      method: "POST",
    });
    return { body: await response.text(), status: response.status };
  }
}
