/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { RequestError } from "octokit";
import type { StatusCodes } from "http-status-codes";

/**
 * Creates a `RequestError` object.
 * @param status The HTTP status code.
 * @param content The content of the error.
 * @returns The `RequestError` object.
 */
export const createRequestError = (
  status: StatusCodes,
  content: string,
): RequestError => {
  const url = "https://api.github.com/api";

  return new RequestError(content, status, {
    request: {
      headers: {
        authorization: "SampleToken",
      },
      method: "GET",
      url,
    },
    response: {
      data: {
        content,
      },
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
      status,
      url,
    },
  });
};
