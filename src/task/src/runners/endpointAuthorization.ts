/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * An interface representing endpoint authorization data.
 */
export interface EndpointAuthorization {
  /**
   * A dictionary of authorization data parameters.
   */
  parameters: Record<string, string>

  /**
   * The authorization scheme, e.g., OAuth or username/password.
   */
  scheme: string
}
