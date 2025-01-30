/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { RequestError } from "octokit";
import { StatusCodes } from "http-status-codes";

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
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Required for alignment with the HTTP header.
        "Content-Type": "text/html; charset=utf-8",
      },
      status,
      url,
    },
  });
};
