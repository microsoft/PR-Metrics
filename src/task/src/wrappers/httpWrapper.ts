/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { httpTimeoutMs } from "../utilities/constants.js";

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
    const response: Response = await fetch(url, { signal: AbortSignal.timeout(httpTimeoutMs) });
    if (!response.ok) {
      throw new Error(`HTTP request to '${url}' failed with status ${String(response.status)} (${response.statusText}).`);
    }

    return response.text();
  }
}
