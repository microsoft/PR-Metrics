/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type HttpResponseInterface from "./httpResponseInterface.js";

/**
 * An interface for performing HTTP requests.
 */
export default interface HttpClientInterface {
  /**
   * Performs an HTTP `POST` request.
   * @param url The URL to which to post, which must never contain credentials.
   * @param headers The headers to include in the request.
   * @param body The body of the request.
   * @returns A promise containing the response.
   */
  post: (
    url: string,
    headers: Readonly<Record<string, string>>,
    body: string,
  ) => Promise<HttpResponseInterface>;
}
