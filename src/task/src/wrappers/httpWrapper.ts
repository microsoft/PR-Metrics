/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as taskLib from "azure-pipelines-task-lib/task.js";
import { HttpClient } from "typed-rest-client/HttpClient.js";
import { httpTimeoutMs } from "../utilities/constants.js";

const successfulHttpStatusRange = {
  maximumExclusive: 300,
  minimum: 200,
} as const;

interface FormPostClientOptions {
  proxy: taskLib.ProxyConfiguration;
  socketTimeout: number;
}

interface FormPostResponse {
  message: {
    statusCode?: number;
  };
  readBody: () => Promise<string>;
}

interface FormPostResult {
  status?: number;
  readBody: () => Promise<string>;
}

interface FormPostClient {
  post: (
    requestUrl: string,
    data: string,
    additionalHeaders?: Record<string, string>,
  ) => Promise<FormPostResponse>;
}

type GetProxyConfiguration = (
  requestUrl: string,
) => taskLib.ProxyConfiguration | null;

type CreateFormPostClient = (
  requestOptions: FormPostClientOptions,
) => FormPostClient;

const getProxyConfiguration: GetProxyConfiguration = (
  requestUrl: string,
): taskLib.ProxyConfiguration | null =>
  taskLib.getHttpProxyConfiguration(requestUrl);

const createFormPostClient: CreateFormPostClient = (
  requestOptions: FormPostClientOptions,
): FormPostClient => new HttpClient(null, [], requestOptions);

const getErrorName = (error: unknown): string =>
  error instanceof Error ? error.name : "UnknownError";

const createSanitizedCause = (error: unknown): Error => {
  const reason: string = getErrorName(error);
  const cause: Error = new Error(reason);
  cause.name = reason;
  return cause;
};

/**
 * A wrapper around the Fetch API, to facilitate testability.
 */
export default class HttpWrapper {
  private readonly _getProxyConfiguration: GetProxyConfiguration;
  private readonly _createFormPostClient: CreateFormPostClient;

  /**
   * Initializes a new instance of the `HttpWrapper` class.
   * @param proxyConfigurationProvider Gets the Azure Pipelines proxy configuration that applies to a URL.
   * @param formPostClientFactory Creates the proxy-aware HTTP client used for form posts.
   */
  public constructor(
    proxyConfigurationProvider: GetProxyConfiguration = getProxyConfiguration,
    formPostClientFactory: CreateFormPostClient = createFormPostClient,
  ) {
    this._getProxyConfiguration = proxyConfigurationProvider;
    this._createFormPostClient = formPostClientFactory;
  }

  /**
   * Gets the contents of a URL.
   * @param url The URL whose contents should be retrieved.
   * @returns The contents of the URL.
   */
  public async getUrl(url: string): Promise<string> {
    const response: Response = await fetch(url, {
      signal: AbortSignal.timeout(httpTimeoutMs),
    });
    if (!response.ok) {
      throw new Error(
        `HTTP request to '${url}' failed with status ${String(response.status)} (${response.statusText}).`,
      );
    }

    return response.text();
  }

  /**
   * Posts a URL-encoded form body to a URL over HTTPS and returns the `access_token` field from the resulting JSON
   * response. This is a focused helper for OAuth 2.0 client credentials token exchanges – the request body, the
   * response body, and any acquired token are never included in thrown errors.
   * @param url The token endpoint URL to which the form should be posted.
   * @param form The URL-encoded form fields to post as the request body.
   * @returns The nonblank access token returned by the endpoint.
   */
  public async postForm(url: string, form: URLSearchParams): Promise<string> {
    let response: FormPostResult;
    try {
      response = await this.sendForm(url, form);
    } catch (error) {
      const reason: string = getErrorName(error);
      throw new Error(
        `HTTP POST request to '${url}' failed before a response was received (${reason}).`,
        {
          // eslint-disable-next-line preserve-caught-error -- The original error can contain OAuth form or token content.
          cause: createSanitizedCause(error),
        },
      );
    }

    if (
      typeof response.status !== "number" ||
      response.status < successfulHttpStatusRange.minimum ||
      response.status >= successfulHttpStatusRange.maximumExclusive
    ) {
      throw new Error(
        `HTTP POST request to '${url}' failed with status ${String(response.status)}.`,
      );
    }

    let payload: unknown;
    try {
      const responseBody: string = await response.readBody();
      payload = JSON.parse(responseBody) as unknown;
    } catch (error) {
      throw new Error(
        `HTTP POST request to '${url}' returned a response that could not be parsed as JSON.`,
        {
          // eslint-disable-next-line preserve-caught-error -- The original error can contain OAuth response or token content.
          cause: createSanitizedCause(error),
        },
      );
    }

    const accessTokenValue: unknown =
      typeof payload === "object" && payload !== null
        ? Reflect.get(payload, "access_token")
        : null;
    const accessToken: string | null =
      typeof accessTokenValue === "string" ? accessTokenValue.trim() : null;
    if (accessToken === null || accessToken.length === 0) {
      throw new Error(
        `HTTP POST request to '${url}' did not return a valid access token.`,
      );
    }

    return accessToken;
  }

  private async sendForm(
    url: string,
    form: URLSearchParams,
  ): Promise<FormPostResult> {
    const proxyConfiguration: taskLib.ProxyConfiguration | null =
      this._getProxyConfiguration(url);
    if (proxyConfiguration === null) {
      const response: Response = await fetch(url, {
        body: form.toString(),
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- Required for alignment with the HTTP header.
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        signal: AbortSignal.timeout(httpTimeoutMs),
      });
      return {
        readBody: async (): Promise<string> => response.text(),
        status: response.status,
      };
    }

    const client: FormPostClient = this._createFormPostClient({
      proxy: proxyConfiguration,
      socketTimeout: httpTimeoutMs,
    });
    const response: FormPostResponse = await client.post(
      url,
      form.toString(),
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Required for alignment with the HTTP header.
        "Content-Type": "application/x-www-form-urlencoded",
      },
    );
    return {
      readBody: async (): Promise<string> => response.readBody(),
      status: response.message.statusCode,
    };
  }
}
