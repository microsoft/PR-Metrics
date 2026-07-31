/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import type GraphQlClientInterface from "../../src/interfaces/graphQlClientInterface.js";
import type GraphQlRequestInterface from "./graphQlRequestInterface.js";

/**
 * A test double for `GraphQlClientInterface`, which records every request and replays queued responses.
 */
export default class FakeGraphQlClient implements GraphQlClientInterface {
  private readonly _requests: GraphQlRequestInterface[] = [];
  private readonly _responses: unknown[] = [];

  /**
   * Gets the requests performed against the client, in invocation order.
   * @returns The requests.
   */
  public get requests(): GraphQlRequestInterface[] {
    return this._requests;
  }

  /**
   * Queues the next response. An `Error` instance is raised rather than returned.
   * @param response The response to queue.
   */
  public enqueue(response: unknown): void {
    this._responses.push(response);
  }

  /**
   * Performs a GraphQL request.
   * @param query The GraphQL document.
   * @param variables The variables to associate with the document.
   * @returns A promise containing the queued response.
   */
  public async request(
    query: string,
    variables: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    this._requests.push({ query, variables });
    if (this._responses.length === 0) {
      return Promise.reject(new Error("No response queued for the request."));
    }

    const response: unknown = this._responses.shift();
    if (response instanceof Error) {
      return Promise.reject(response);
    }

    return Promise.resolve(response);
  }
}
