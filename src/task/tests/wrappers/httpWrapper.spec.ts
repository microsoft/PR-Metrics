/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import HttpWrapper from "../../src/wrappers/httpWrapper.js";
import assert from "node:assert/strict";
import { httpTimeoutMs } from "../../src/utilities/constants.js";

/* eslint-disable @typescript-eslint/naming-convention -- Required for alignment with the OAuth 2.0 token response schema. */

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

type FetchFunction = (
  input: string | URL | Request,
  init?: FetchInit,
) => Promise<Response>;

interface ProxyConfiguration {
  proxyBypassHosts?: string[];
  proxyFormattedUrl: string;
  proxyPassword?: string;
  proxyUrl: string;
  proxyUsername?: string;
}

interface ProxyRequestOptions {
  proxy?: {
    proxyBypassHosts?: string[];
    proxyPassword?: string;
    proxyUrl: string;
    proxyUsername?: string;
  };
  socketTimeout?: number;
}

interface ProxyResponse {
  message: {
    statusCode?: number;
  };
  readBody: () => Promise<string>;
}

interface ProxyClient {
  post: (
    requestUrl: string,
    data: string,
    additionalHeaders?: Record<string, string>,
  ) => Promise<ProxyResponse>;
}

type GetProxyConfiguration = (
  requestUrl: string,
) => ProxyConfiguration | null;

type CreateProxyClient = (
  requestOptions: ProxyRequestOptions,
) => ProxyClient;

describe("httpWrapper.ts", (): void => {
  const originalFetch: typeof fetch = globalThis.fetch;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- `AbortSignal.timeout` is a static factory that does not use `this`.
  const originalAbortSignalTimeout: typeof AbortSignal.timeout = AbortSignal.timeout;

  let httpWrapper: HttpWrapper;
  let fetchCallCount: number;
  let capturedInput: string | URL | Request | null;
  let capturedInit: FetchInit | null;
  let capturedTimeoutMs: number | null;

  const stubFetch = (handler: FetchFunction): void => {
    globalThis.fetch = async (
      input: string | URL | Request,
      init?: FetchInit,
    ): Promise<Response> => {
      fetchCallCount += 1;
      capturedInput = input;
      capturedInit = init ?? null;
      return handler(input, init);
    };
  };

  beforeEach((): void => {
    httpWrapper = new HttpWrapper((): null => null);
    fetchCallCount = 0;
    capturedInput = null;
    capturedInit = null;
    capturedTimeoutMs = null;

    AbortSignal.timeout = ((ms: number): AbortSignal => {
      capturedTimeoutMs = ms;
      return originalAbortSignalTimeout(ms);
    });
  });

  afterEach((): void => {
    globalThis.fetch = originalFetch;
    AbortSignal.timeout = originalAbortSignalTimeout;
  });

  describe("postForm()", (): void => {
    it("passes an applicable Azure Pipelines proxy configuration to the proxy-aware client", async (): Promise<void> => {
      // Arrange
      const tokenUrl =
        "https://login.microsoftonline.com/TenantId/oauth2/v2.0/token";
      const proxyConfiguration: ProxyConfiguration = {
        proxyBypassHosts: [".*\\.internal\\.example$"],
        proxyFormattedUrl: "http://ProxyUser:ProxyPassword@proxy.example:8080",
        proxyPassword: "ProxyPassword",
        proxyUrl: "http://proxy.example:8080",
        proxyUsername: "ProxyUser",
      };
      const captured: {
        requestOptions?: ProxyRequestOptions;
      } = {};
      const getProxyConfiguration: GetProxyConfiguration = (
        requestUrl: string,
      ): ProxyConfiguration | null =>
        requestUrl === tokenUrl ? proxyConfiguration : null;
      const proxyClient: ProxyClient = {
        post: async (): Promise<ProxyResponse> =>
          Promise.resolve({
            message: {
              statusCode: 200,
            },
            readBody: async (): Promise<string> =>
              Promise.resolve(JSON.stringify({ access_token: "AccessToken" })),
          }),
      };
      const createProxyClient: CreateProxyClient = (
        requestOptions: ProxyRequestOptions,
      ): ProxyClient => {
        captured.requestOptions = requestOptions;
        return proxyClient;
      };
      httpWrapper = new HttpWrapper(
        getProxyConfiguration,
        createProxyClient,
      );
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ access_token: "AccessToken" }), {
              status: 200,
            }),
          ),
      );

      // Act
      const result: string = await httpWrapper.postForm(tokenUrl, form);

      // Assert
      assert.equal(result, "AccessToken");
      assert.equal(fetchCallCount, 0);
      assert.ok(captured.requestOptions);
      assert.equal(captured.requestOptions.proxy, proxyConfiguration);
      assert.equal(captured.requestOptions.socketTimeout, httpTimeoutMs);
    });

    it("uses native fetch with the expected request when no Azure Pipelines proxy applies", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      form.set("client_id", "ClientId");
      form.set("client_assertion", "Assertion");
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ access_token: "AccessToken" }), {
              status: 200,
            }),
          ),
      );

      // Act
      const result: string = await httpWrapper.postForm(
        "https://login.microsoftonline.com/TenantId/oauth2/v2.0/token",
        form,
      );

      // Assert
      assert.equal(result, "AccessToken");
      assert.equal(fetchCallCount, 1);
      assert.equal(
        capturedInput,
        "https://login.microsoftonline.com/TenantId/oauth2/v2.0/token",
      );
      assert.ok(capturedInit);
      assert.equal(capturedInit.method, "POST");
      assert.equal(
        (capturedInit.headers as Record<string, string>)["Content-Type"],
        "application/x-www-form-urlencoded",
      );
      assert.equal(
        capturedInit.body,
        "client_id=ClientId&client_assertion=Assertion",
      );
      assert.equal(capturedTimeoutMs, httpTimeoutMs);
    });

    it("never includes the request body in a thrown error", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      form.set("client_assertion", "SuperSecretAssertion");
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response("SuperSecretAssertion should never appear here", {
              status: 401,
              statusText: "Unauthorized",
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      const error: Error = await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' failed with status 401.",
      );
      assert.equal(error.message.includes("SuperSecretAssertion"), false);
    });

    it("throws a sanitized error when the response body cannot be parsed as JSON", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response("SecretAccessTokenLookingText", {
              status: 200,
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      const error: Error = await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' returned a response that could not be parsed as JSON.",
      );
      assert.equal(
        error.message.includes("SecretAccessTokenLookingText"),
        false,
      );
    });

    it("throws a sanitized error when the access token field is missing", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ tokenType: "Bearer" }), {
              status: 200,
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' did not return a valid access token.",
      );
    });

    it("throws a sanitized error when the access token field is blank", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ access_token: "" }), {
              status: 200,
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' did not return a valid access token.",
      );
    });

    it("throws a sanitized error when the access token field is not a string number", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ access_token: 123 }), {
              status: 200,
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' did not return a valid access token.",
      );
    });

    it("throws a sanitized error when the access token field is not a string object", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify({ access_token: {} }), {
              status: 200,
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' did not return a valid access token.",
      );
    });

    it("throws a sanitized error when the response body is not a JSON object", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      stubFetch(
        async (): Promise<Response> =>
          Promise.resolve(
            new Response(JSON.stringify("AccessToken"), {
              status: 200,
            }),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' did not return a valid access token.",
      );
    });

    it("throws a sanitized error when the request cannot complete, without leaking the underlying reason", async (): Promise<void> => {
      // Arrange
      const form: URLSearchParams = new URLSearchParams();
      form.set("client_assertion", "SuperSecretAssertion");
      stubFetch(
        async (): Promise<Response> =>
          Promise.reject(
            new DOMException(
              "SuperSecretAssertion leaked in a network stack trace",
              "TimeoutError",
            ),
          ),
      );

      // Act
      const func: () => Promise<string> = async () =>
        httpWrapper.postForm("https://login.microsoftonline.com/x", form);

      // Assert
      const error: Error = await AssertExtensions.toThrowAsync(
        func,
        "HTTP POST request to 'https://login.microsoftonline.com/x' failed before a response was received (TimeoutError).",
      );
      assert.equal(error.message.includes("SuperSecretAssertion"), false);
      assert.equal(String(error.cause).includes("SuperSecretAssertion"), false);
    });
  });
});
