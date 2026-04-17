/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type { EndpointAuthorization } from "azure-pipelines-task-lib";
import type { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import type { ITaskApi } from "azure-devops-node-api/TaskApi.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import TokenManager from "../../src/repos/tokenManager.js";
import { WebApi } from "azure-devops-node-api";
import assert from "node:assert/strict";
import { resolvableInstance } from "../testUtilities/resolvableInstance.js";
import { stubEnv } from "../testUtilities/stubEnv.js";
import { stubLocalization } from "../testUtilities/stubLocalization.js";

describe("tokenManager.ts", (): void => {
  let taskApi: ITaskApi;
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  // Fabricated GUIDs for testing. These are not real identifiers.
  const servicePrincipalId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const tenantId = "98765432-abcd-ef01-2345-678901234567";

  beforeEach((): void => {
    stubEnv(
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
      runnerInvoker.getEndpointAuthorization("SYSTEMVSSCONNECTION"),
    ).thenReturn({
      parameters: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Required for alignment with underlying API.
        AccessToken: "AccessToken",
      },
      scheme: "OAuth",
    });
    when(
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
    ).thenResolve({
      exitCode: 0,
      stderr: "",
      stdout: "",
    });
    when(
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
    ).thenResolve({
      exitCode: 0,
      stderr: "",
      stdout: " AccessToken ",
    });
  });

  describe("getToken()", (): void => {
    it("returns null when no workload identity federation is specified", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
      when(
        runnerInvoker.getInput(
          deepEqual(["Workload", "Identity", "Federation"]),
        ),
      ).thenReturn(null);

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(result, null);
    });

    it("returns a string indicating that the authorization scheme is invalid", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
      when(runnerInvoker.getEndpointAuthorizationScheme("Id")).thenReturn(
        "Other",
      );

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(
        result,
        "Authorization scheme of workload identity federation 'Id' must be 'WorkloadIdentityFederation' instead of 'Other'.",
      );
    });

    it("throws an error when the service principal ID is null", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
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
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
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
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
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
    });

    it("throws an error when the tenant ID is not a valid GUID", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
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
            const tokenManager: TokenManager = new TokenManager(
              instance(azureDevOpsApiWrapper),
              instance(logger),
              instance(runnerInvoker),
            );
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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );
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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );
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
  });

  it("throws an error when Azure sign in fails", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );
    when(
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
    ).thenResolve({
      exitCode: 1,
      stderr: "Error Message",
      stdout: "",
    });

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(func, "Error Message");
    verify(runnerInvoker.setSecret("OidcToken")).once();
  });

  it("throws an error when access token retrieval fails", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );
    when(
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
    ).thenResolve({
      exitCode: 1,
      stderr: "Error Message",
      stdout: "",
    });

    // Act
    const func: () => Promise<string | null> = async () =>
      tokenManager.getToken();

    // Assert
    await AssertExtensions.toThrowAsync(func, "Error Message");
    verify(runnerInvoker.setSecret("OidcToken")).once();
  });

  it("sets PR_METRICS_ACCESS_TOKEN", async (): Promise<void> => {
    // Arrange
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

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
    const tokenManager: TokenManager = new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

    // Act
    const result1: string | null = await tokenManager.getToken();
    const result2: string | null = await tokenManager.getToken();

    // Assert
    assert.equal(result1, null);
    assert.equal(result2, null);
    assert.equal(process.env.PR_METRICS_ACCESS_TOKEN, "AccessToken");
    verify(runnerInvoker.setSecret("OidcToken")).once();
    verify(runnerInvoker.setSecret("AccessToken")).once();
  });
});
