/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * The subset of HTTP status codes referenced by the task.
 */
export const httpStatusCodes = {
  badRequest: 400,
  forbidden: 403,
  notFound: 404,
  ok: 200,
  unauthorized: 401,
  unprocessableEntity: 422,
} as const;
