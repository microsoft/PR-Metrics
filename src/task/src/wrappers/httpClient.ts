/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { singleton } from "tsyringe";

/**
 * A wrapper around the Fetch API, to facilitate testability.
 */
@singleton()
export default class HttpClientWrapper {
  /**
   * Gets the contents of a URL.
   * @param url The URL whose contents should be retrieved.
   * @returns The contents of the URL.
   */
  public async getUrl(url: string): Promise<string> {
    const response: Response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `HTTP request to '${url}' failed with status ${String(response.status)}.`,
      );
    }

    return response.text();
  }
}
