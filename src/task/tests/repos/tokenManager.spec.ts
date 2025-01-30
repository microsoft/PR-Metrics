/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import { deepEqual, instance, mock, verify, when } from "ts-mockito";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import { EndpointAuthorization } from "azure-pipelines-task-lib";
import { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import { ITaskApi } from "azure-devops-node-api/TaskApi.js";
import Logger from "../../src/utilities/logger.js";
import RunnerInvoker from "../../src/runners/runnerInvoker.js";
import TokenManager from "../../src/repos/tokenManager.js";
import { WebApi } from "azure-devops-node-api";
import assert from "node:assert/strict";
import { resolvableInstance } from "../testUtilities/resolvableInstance.js";

describe("tokenManager.ts", (): void => {
  let taskApi: ITaskApi;
  let azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  beforeEach((): void => {
    process.env.SYSTEM_COLLECTIONURI = "https://dev.azure.com/organization";
    process.env.SYSTEM_TEAMPROJECTID = "TeamProjectId";
    process.env.SYSTEM_HOSTTYPE = "HostType";
    process.env.SYSTEM_PLANID = "PlanId";
    process.env.SYSTEM_JOBID = "JobId";

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
    ).thenReturn("ServicePrincipalId");
    when(
      runnerInvoker.getEndpointAuthorizationParameter("Id", "tenantid"),
    ).thenReturn("TenantId");
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
        "login --service-principal -u ServicePrincipalId --tenant TenantId --allow-no-subscriptions --federated-token OidcToken",
      ),
    ).thenResolve({
      exitCode: 0,
      stderr: "",
      stdout: "",
    });
    when(
      runnerInvoker.exec(
        "az",
        "account get-access-token --query accessToken --resource 499b84ac-1321-427f-aa17-267ca6975798 -o tsv",
      ),
    ).thenResolve({
      exitCode: 0,
      stderr: "",
      stdout: " AccessToken ",
    });
  });

  after(() => {
    delete process.env.SYSTEM_COLLECTIONURI;
    delete process.env.SYSTEM_TEAMPROJECTID;
    delete process.env.SYSTEM_HOSTTYPE;
    delete process.env.SYSTEM_PLANID;
    delete process.env.SYSTEM_JOBID;
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
      ).thenReturn(undefined);

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(result, null);
      verify(logger.logDebug("* TokenManager.getToken()")).once();
      verify(
        logger.logDebug(
          "No workload identity federation specified. Using Personal Access Token (PAT) for authentication.",
        ),
      ).once();
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
      when(
        runnerInvoker.loc(
          "repos.tokenManager.incorrectAuthorizationScheme",
          "WorkloadIdentityFederation",
          "Other",
        ),
      ).thenReturn(
        "Authorization scheme of workload identity federation 'Id' must be 'WorkloadIdentityFederation' instead of 'Other'.",
      );

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(result, null);
      verify(logger.logDebug("* TokenManager.getToken()")).once();
      verify(
        logger.logDebug(
          "Using workload identity federation 'Id' for authentication.",
        ),
      ).once();
    });

    it("throws an error when the service principal ID is undefined", async (): Promise<void> => {
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
      ).thenReturn(undefined);

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'servicePrincipalId', accessed within 'TokenManager.getAccessToken()', is invalid, null, or undefined 'undefined'.",
      );
      verify(logger.logDebug("* TokenManager.getToken()")).once();
      verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    });

    it("throws an error when the tenant ID is undefined", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = new TokenManager(
        instance(azureDevOpsApiWrapper),
        instance(logger),
        instance(runnerInvoker),
      );
      when(
        runnerInvoker.getEndpointAuthorizationParameter("Id", "tenantid"),
      ).thenReturn(undefined);

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'tenantId', accessed within 'TokenManager.getAccessToken()', is invalid, null, or undefined 'undefined'.",
      );
      verify(logger.logDebug("* TokenManager.getToken()")).once();
      verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    });

    {
      const testCases: (EndpointAuthorization | undefined)[] = [
        undefined,
        {
          parameters: {
            other: "Other",
          },
          scheme: "Other",
        },
      ];

      testCases.forEach(
        (endpointAuthorization: EndpointAuthorization | undefined): void => {
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
            verify(logger.logDebug("* TokenManager.getToken()")).once();
            verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
            verify(
              logger.logDebug("* TokenManager.getFederatedToken()"),
            ).once();
            verify(
              logger.logDebug("* TokenManager.getSystemAccessToken()"),
            ).once();
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
  });

  it("throws an error when the collection URI is undefined", async (): Promise<void> => {
    // Arrange
    delete process.env.SYSTEM_COLLECTIONURI;
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
  });

  it("throws an error when the team project URI is undefined", async (): Promise<void> => {
    // Arrange
    delete process.env.SYSTEM_TEAMPROJECTID;
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
  });

  it("throws an error when the host type is undefined", async (): Promise<void> => {
    // Arrange
    delete process.env.SYSTEM_HOSTTYPE;
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
  });

  it("throws an error when the plan ID is undefined", async (): Promise<void> => {
    // Arrange
    delete process.env.SYSTEM_PLANID;
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
  });

  it("throws an error when the job ID is undefined", async (): Promise<void> => {
    // Arrange
    delete process.env.SYSTEM_JOBID;
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
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
        "login --service-principal -u ServicePrincipalId --tenant TenantId --allow-no-subscriptions --federated-token OidcToken",
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
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
        "account get-access-token --query accessToken --resource 499b84ac-1321-427f-aa17-267ca6975798 -o tsv",
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
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
    verify(logger.logDebug("* TokenManager.getToken()")).once();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
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
    verify(logger.logDebug("* TokenManager.getToken()")).twice();
    verify(logger.logDebug("* TokenManager.getAccessToken()")).once();
    verify(logger.logDebug("* TokenManager.getFederatedToken()")).once();
    verify(logger.logDebug("* TokenManager.getSystemAccessToken()")).once();
    verify(
      logger.logDebug(
        "Acquired authorization token from workload identity federation.",
      ),
    ).once();
    verify(runnerInvoker.setSecret("OidcToken")).once();
    verify(runnerInvoker.setSecret("AccessToken")).once();
  });
});
