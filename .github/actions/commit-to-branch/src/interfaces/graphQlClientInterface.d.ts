/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface for performing GraphQL requests.
 */
export default interface GraphQlClientInterface {
  /**
   * Performs a GraphQL request, passing all data as structured variables.
   * @param query The GraphQL query or mutation document.
   * @param variables The variables to associate with the document.
   * @returns A promise containing the `data` payload of the response.
   */
  request: (
    query: string,
    variables: Readonly<Record<string, unknown>>,
  ) => Promise<unknown>;
}
