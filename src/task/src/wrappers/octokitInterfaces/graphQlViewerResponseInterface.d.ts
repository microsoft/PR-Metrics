/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing the response from a GraphQL query for the viewer, which is the principal associated with
 * the access token in use. This query is used as the REST users API is unavailable to GitHub App installation access
 * tokens, which includes the `GITHUB_TOKEN` used within GitHub Actions.
 */
export default interface GraphQlViewerResponseInterface {
  /**
   * The principal associated with the access token in use.
   */
  viewer: {
    /**
     * The numeric ID of the principal, which is `null` if the principal has no associated numeric ID.
     */
    databaseId: number | null;

    /**
     * The login name of the principal.
     */
    login: string;
  };
}
