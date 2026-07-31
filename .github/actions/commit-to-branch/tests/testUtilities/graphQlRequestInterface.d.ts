/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing a recorded GraphQL request.
 */
export default interface GraphQlRequestInterface {
  /**
   * The GraphQL document.
   */
  query: string;

  /**
   * The variables associated with the document.
   */
  variables: Readonly<Record<string, unknown>>;
}
