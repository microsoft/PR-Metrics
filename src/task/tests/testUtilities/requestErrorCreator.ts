/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { RequestError } from 'octokit';

/**
 * Creates a `RequestError` object.
 * @param status The HTTP status code.
 * @param content The content of the error.
 * @returns The `RequestError` object.
 */
export const createRequestError = (status: number, content: string): RequestError => {
  const url = 'https://api.github.com/api'

  return new RequestError(content, status, {
    request: {
      method: 'GET',
      url,
      headers: {
        authorization: 'Token'
      }
    },
    response: {
      status,
      url,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      },
      data: {
        content
      }
    }
  })
}
