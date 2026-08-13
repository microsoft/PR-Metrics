/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { any, anyString } from "../testUtilities/mockito.js";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import {
  localize,
  stubLocalization,
} from "../testUtilities/stubLocalization.js";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type { EndpointAuthorization } from "azure-pipelines-task-lib";
import HttpWrapper from "../../src/wrappers/httpWrapper.js";
import type { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import type { ITaskApi } from "azure-devops-node-api/TaskApi.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import TokenManager from "../../src/repos/tokenManager.js";
import { WebApi } from "azure-devops-node-api";
import assert from "node:assert/strict";
import { resolvableInstance } from "../testUtilities/resolvableInstance.js";
import { stubEnv } from "../testUtilities/stubEnv.js";

describe("tokenManager.ts", (): void => {
  let taskApi: ITaskApi;
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  let httpWrapper: HttpWrapper;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  // Fabricated GUIDs for testing. These are not real identifiers.
  const servicePrincipalId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const tenantId = "98765432-abcd-ef01-2345-678901234567";
  const expectedForm = (): URLSearchParams => {
    const form: URLSearchParams = new URLSearchParams();
    form.set("client_id", servicePrincipalId);
    form.set("grant_type", "client_credentials");
    form.set(
      "client_assertion_type",
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    );
    form.set("client_assertion", "OidcToken");
    form.set("scope", "499b84ac-1321-427f-aa17-267ca6975798/.default");
    return form;
  };

  beforeEach((): void => {
    stubEnv(
      ["PR_METRICS_ACCESS_TOKEN", undefined],
      ["SYSTEM_COLLECTIONURI", "https://dev.azure.com/organization"],
      ["SYSTEM_HOSTTYPE", "HostType"],
      ["SYSTEM_JOBID", "JobId"],
      ["SYSTEM_PLANID", "PlanId"],
      ["SYSTEM_TEAMPROJECTID", "TeamProjectId"],
    );

    taskApi = mock<ITaskApi>();
    const requestHandler: IRequestHandler = mock<IRequestHandler>();
    const webApi: WebApi = mock(WebApi);
    when(webApi.getTaskApi()).thenResolve(resolvableInstance(taskApi));
    when(
      taskApi.createOidcToken(
        deepEqual({}),
        "TeamProjectId",
        "HostType",
        "PlanId",
        "JobId",
        "Id",
      ),
    ).thenResolve({
      oidcToken: "OidcToken",
    });

    azureDevOpsApiWrapper = mock(AzureDevOpsApiWrapper);
    when(azureDevOpsApiWrapper.getHandlerFromToken("AccessToken")).thenReturn(
      instance(requestHandler),
    );
    when(
      azureDevOpsApiWrapper.getWebApiInstance(
        "https://dev.azure.com/organization",
        deepEqual(instance(requestHandler)),
      ),
    ).thenReturn(instance(webApi));

    httpWrapper = mock(HttpWrapper);
    when(httpWrapper.postForm(anyString(), any<URLSearchParams>())).thenResolve(
      "AccessToken",
    );

    logger = mock(Logger);

    runnerInvoker = mock(RunnerInvoker);
    stubLocalization(runnerInvoker);
    when(
      runnerInvoker.getInput(deepEqual(["Workload", "Identity", "Federation"])),
    ).thenReturn("Id");
    when(runnerInvoker.getEndpointAuthorizationScheme("Id")).thenReturn(
      "WorkloadIdentityFederation",
    );
    when(
      runnerInvoker.getEndpointAuthorizationParameter(
        "Id",
        "serviceprincipalid",
      ),
    ).thenReturn(servicePrincipalId);
    when(
      runnerInvoker.getEndpointAuthorizationParameter("Id", "tenantid"),
    ).thenReturn(tenantId);
    when(
      runnerInvoker.getEndpointDataParameter("Id", "environment"),
    ).thenReturn("AzureCloud");
    when(
      runnerInvoker.getEndpointAuthorization("SYSTEMVSSCONNECTION"),
    ).thenReturn({
      parameters: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Required for alignment with underlying API.
        AccessToken: "AccessToken",
      },
      scheme: "OAuth",
    });
  });

  const createTokenManager = (): TokenManager =>
    new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(httpWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

  describe("getToken()", (): void => {
    it("returns null when no workload identity federation is specified", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.getInput(
          deepEqual(["Workload", "Identity", "Federation"]),
        ),
      ).thenReturn(null);

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(result, null);
      verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
    });

    it("returns a string indicating that the authorization scheme is invalid", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(runnerInvoker.getEndpointAuthorizationScheme("Id")).thenReturn(
        "Other",
      );

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(
        result,
        localize(
          "repos.tokenManager.incorrectAuthorizationScheme",
          "Id",
          "Other",
        ),
      );
      verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
    });

    it("throws an error when the service principal ID is null", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.getEndpointAuthorizationParameter(
          "Id",
          "serviceprincipalid",
        ),
      ).thenReturn(null);

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'servicePrincipalId', accessed within 'TokenManager.getAccessToken()', is invalid, null, or undefined 'null'.",
      );
    });

    it("throws an error when the tenant ID is null", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.getEndpointAuthorizationParameter("Id", "tenantid"),
      ).thenReturn(null);

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'tenantId', accessed within 'TokenManager.getAccessToken()', is invalid, null, or undefined 'null'.",
      );
    });

    it("throws an error when the service principal ID is not a valid GUID", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.getEndpointAuthorizationParameter(
          "Id",
          "serviceprincipalid",
        ),
      ).thenReturn("NotAGuid");

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'servicePrincipalId', accessed within 'TokenManager.getAccessToken()', is not a valid GUID 'NotAGuid'.",
      );
      verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
    });

    it("throws an error when the tenant ID is not a valid GUID", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.getEndpointAuthorizationParameter("Id", "tenantid"),
      ).thenReturn("NotAGuid");

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'tenantId', accessed within 'TokenManager.getAccessToken()', is not a valid GUID 'NotAGuid'.",
      );
      verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
    });

    {
      const testCases: (EndpointAuthorization | null)[] = [
        null,
        {
          parameters: {
            other: "Other",
          },
          scheme: "Other",
        },
      ];

      testCases.forEach(
        (endpointAuthorization: EndpointAuthorization | null): void => {
          it(`throws an error when endpoint authorization scheme is '${endpointAuthorization?.scheme ?? ""}'`, async (): Promise<void> => {
            // Arrange
            const tokenManager: TokenManager = createTokenManager();
            when(
              runnerInvoker.getEndpointAuthorization("SYSTEMVSSCONNECTION"),
            ).thenReturn(endpointAuthorization);

            // Act
            const func: () => Promise<string | null> = async () =>
              tokenManager.getToken();

            // Assert
            await AssertExtensions.toThrowAsync(
              func,
              `Could not acquire authorization token from workload identity federation as the scheme was '${endpointAuthorization?.scheme ?? ""}'.`,
            );
          });
        },
      );
    }
  });

  it("throws an error when the endpoint authorization access token is undefined", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(
      runnerInvoker.getEndpointAuthorization("SYSTEMVSSCONNECTION"),
    ).thenReturn({
      parameters: {
        other: "Other",
      },
      scheme: "OAuth",
    });

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'endpointAuthorization.parameters.AccessToken', accessed within 'TokenManager.getSystemAccessToken()', is invalid, null, or undefined 'undefined'.",
    );
  });

  it("throws an error when the collection URI is undefined", async (): Promise<void> => {
    // Arrange
    stubEnv(["SYSTEM_COLLECTIONURI", undefined]);
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'SYSTEM_COLLECTIONURI', accessed within 'TokenManager.getFederatedToken()', is invalid, null, or undefined 'undefined'.",
    );
  });

  it("throws an error when the team project URI is undefined", async (): Promise<void> => {
    // Arrange
    stubEnv(["SYSTEM_TEAMPROJECTID", undefined]);
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'SYSTEM_TEAMPROJECTID', accessed within 'TokenManager.getFederatedToken()', is invalid, null, or undefined 'undefined'.",
    );
  });

  it("throws an error when the host type is undefined", async (): Promise<void> => {
    // Arrange
    stubEnv(["SYSTEM_HOSTTYPE", undefined]);
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'SYSTEM_HOSTTYPE', accessed within 'TokenManager.getFederatedToken()', is invalid, null, or undefined 'undefined'.",
    );
  });

  it("throws an error when the plan ID is undefined", async (): Promise<void> => {
    // Arrange
    stubEnv(["SYSTEM_PLANID", undefined]);
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'SYSTEM_PLANID', accessed within 'TokenManager.getFederatedToken()', is invalid, null, or undefined 'undefined'.",
    );
  });

  it("throws an error when the job ID is undefined", async (): Promise<void> => {
    // Arrange
    stubEnv(["SYSTEM_JOBID", undefined]);
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'SYSTEM_JOBID', accessed within 'TokenManager.getFederatedToken()', is invalid, null, or undefined 'undefined'.",
    );
  });

  it("throws an error when the OIDC token is undefined", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(
      taskApi.createOidcToken(
        deepEqual({}),
        "TeamProjectId",
        "HostType",
        "PlanId",
        "JobId",
        "Id",
      ),
    ).thenResolve({});

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "'response.oidcToken', accessed within 'TokenManager.getFederatedToken()', is invalid, null, or undefined 'undefined'.",
    );
    verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
  });

  it("never invokes the Azure CLI or any other subprocess", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();

    // Act
    await tokenManager.getToken();

    // Assert
    verify(runnerInvoker.exec(anyString(), any<string[]>())).never();
  });

  {
    const cloudAuthorities: [string, string][] = [
      ["AzureCloud", "https://login.microsoftonline.com"],
      ["AzureUSGovernment", "https://login.microsoftonline.us"],
      ["AzureChinaCloud", "https://login.partner.microsoftonline.cn"],
    ];
    cloudAuthorities.forEach(([environment, authority]): void => {
      it(`exchanges the federated assertion directly with the ${environment} token endpoint`, async (): Promise<void> => {
        // Arrange
        let actualUrl: string | null = null;
        let actualFormString: string | null = null;
        when(
          runnerInvoker.getEndpointDataParameter("Id", "environment"),
        ).thenReturn(environment);
        when(
          httpWrapper.postForm(anyString(), any<URLSearchParams>()),
        ).thenCall(
          async (url: string, form: URLSearchParams): Promise<string> => {
            actualUrl = url;
            actualFormString = form.toString();
            return Promise.resolve("AccessToken");
          },
        );
        const tokenManager: TokenManager = createTokenManager();

        // Act
        await tokenManager.getToken();

        // Assert
        assert.equal(actualUrl, `${authority}/${tenantId}/oauth2/v2.0/token`);
        assert.equal(actualFormString, expectedForm().toString());
        verify(runnerInvoker.exec(anyString(), any<string[]>())).never();
      });
    });
  }

  it("uses Azure CLI when the service connection cloud is unknown", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(
      runnerInvoker.getEndpointDataParameter("Id", "environment"),
    ).thenReturn("AzureCustomCloud");
    when(runnerInvoker.exec("az", any<string[]>()))
      .thenResolve({ exitCode: 0, stderr: "", stdout: "" })
      .thenResolve({ exitCode: 0, stderr: "", stdout: "AccessToken\n" });

    // Act
    await tokenManager.getToken();

    // Assert
    verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
    verify(
      runnerInvoker.exec(
        "az",
        deepEqual([
          "login",
          "--service-principal",
          "-u",
          servicePrincipalId,
          "--tenant",
          tenantId,
          "--allow-no-subscriptions",
          "--federated-token",
          "OidcToken",
        ]),
      ),
    ).once();
    verify(
      runnerInvoker.exec(
        "az",
        deepEqual([
          "account",
          "get-access-token",
          "--query",
          "accessToken",
          "--resource",
          "499b84ac-1321-427f-aa17-267ca6975798",
          "-o",
          "tsv",
        ]),
      ),
    ).once();
  });

  it("uses Azure CLI when the service connection cloud is unavailable", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(
      runnerInvoker.getEndpointDataParameter("Id", "environment"),
    ).thenReturn(null);
    when(runnerInvoker.exec("az", any<string[]>()))
      .thenResolve({ exitCode: 0, stderr: "", stdout: "" })
      .thenResolve({ exitCode: 0, stderr: "", stdout: "AccessToken\n" });

    // Act
    await tokenManager.getToken();

    // Assert
    verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).never();
    verify(runnerInvoker.exec("az", any<string[]>())).twice();
  });

  {
    const testCases: [string, string, string][] = [
      [
        "sign-in",
        "Azure CLI sign-in failed",
        "Azure CLI workload identity sign-in failed.",
      ],
      [
        "access-token",
        "Azure CLI access token failed",
        "Azure CLI access token acquisition failed.",
      ],
    ];
    testCases.forEach(([operation, stderr, expectedErrorMessage]): void => {
      it(`throws the ${operation} failure from Azure CLI fallback`, async (): Promise<void> => {
        // Arrange
        const tokenManager: TokenManager = createTokenManager();
        when(
          runnerInvoker.getEndpointDataParameter("Id", "environment"),
        ).thenReturn("AzureCustomCloud");
        when(runnerInvoker.exec("az", any<string[]>())).thenResolve({
          exitCode: 1,
          stderr,
          stdout: "",
        });
        if (operation === "access-token") {
          when(runnerInvoker.exec("az", any<string[]>()))
            .thenResolve({ exitCode: 0, stderr: "", stdout: "" })
            .thenResolve({ exitCode: 1, stderr, stdout: "" });
        }

        // Act
        const func: () => Promise<string | null> = async () =>
          tokenManager.getToken();

        // Assert
        await AssertExtensions.toThrowAsync(func, expectedErrorMessage);
        verify(
          httpWrapper.postForm(anyString(), any<URLSearchParams>()),
        ).never();
      });
    });
  }

  it("rejects empty access token output from Azure CLI fallback", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(
      runnerInvoker.getEndpointDataParameter("Id", "environment"),
    ).thenReturn("AzureCustomCloud");
    when(runnerInvoker.exec("az", any<string[]>()))
      .thenResolve({ exitCode: 0, stderr: "", stdout: "" })
      .thenResolve({ exitCode: 0, stderr: "", stdout: "  \n" });

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "Azure CLI returned an empty access token.",
    );
    verify(runnerInvoker.setSecret("")).never();
  });

  it("masks the federated assertion before transmission and the access token immediately after receipt", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();

    // Act
    await tokenManager.getToken();

    // Assert
    verify(runnerInvoker.setSecret("OidcToken")).calledBefore(
      httpWrapper.postForm(anyString(), any<URLSearchParams>()),
    );
    verify(
      httpWrapper.postForm(anyString(), any<URLSearchParams>()),
    ).calledBefore(runnerInvoker.setSecret("AccessToken"));
  });

  it("sets PR_METRICS_ACCESS_TOKEN", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const result: string | null = await tokenManager.getToken();

    // Assert
    assert.equal(result, null);
    assert.equal(process.env.PR_METRICS_ACCESS_TOKEN, "AccessToken");
    verify(runnerInvoker.setSecret("OidcToken")).once();
    verify(runnerInvoker.setSecret("AccessToken")).once();
  });

  it("when called multiple times skips expensive operations", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();

    // Act
    const result1: string | null = await tokenManager.getToken();
    const result2: string | null = await tokenManager.getToken();

    // Assert
    assert.equal(result1, null);
    assert.equal(result2, null);
    assert.equal(process.env.PR_METRICS_ACCESS_TOKEN, "AccessToken");
    verify(runnerInvoker.setSecret("OidcToken")).once();
    verify(runnerInvoker.setSecret("AccessToken")).once();
    verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).once();
  });

  it("throws the sanitized token exchange error, sets the federated assertion secret, and does not set PR_METRICS_ACCESS_TOKEN when the exchange fails", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(httpWrapper.postForm(anyString(), any<URLSearchParams>())).thenReject(
      new Error(
        "HTTP POST request to 'https://login.microsoftonline.com/98765432-abcd-ef01-2345-678901234567/oauth2/v2.0/token' failed with status 401.",
      ),
    );

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(
      func,
      "HTTP POST request to 'https://login.microsoftonline.com/98765432-abcd-ef01-2345-678901234567/oauth2/v2.0/token' failed with status 401.",
    );
    assert.equal(process.env.PR_METRICS_ACCESS_TOKEN, undefined);
    verify(runnerInvoker.setSecret("OidcToken")).once();
    verify(runnerInvoker.setSecret("AccessToken")).never();
  });

  it("retries the token exchange on the next call after a failure", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = createTokenManager();
    when(httpWrapper.postForm(anyString(), any<URLSearchParams>()))
      .thenReject(new Error("Error Message"))
      .thenResolve("AccessToken");

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();
    await AssertExtensions.toThrowAsync(func, "Error Message");
    const result: string | null = await tokenManager.getToken();

    // Assert
    assert.equal(result, null);
    assert.equal(process.env.PR_METRICS_ACCESS_TOKEN, "AccessToken");
    verify(httpWrapper.postForm(anyString(), any<URLSearchParams>())).twice();
    verify(runnerInvoker.setSecret("OidcToken")).twice();
    verify(runnerInvoker.setSecret("AccessToken")).once();
  });
});
