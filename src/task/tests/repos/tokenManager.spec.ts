/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as AssertExtensions from "../testUtilities/assertExtensions.js";
import * as os from "node:os";
import { any, anyNumber, anyString } from "../testUtilities/mockito.js";
import { capture, deepEqual, instance, mock, verify, when } from "ts-mockito";
import {
  localize,
  stubLocalization,
} from "../testUtilities/stubLocalization.js";
import AzureDevOpsApiWrapper from "../../src/wrappers/azureDevOpsApiWrapper.js";
import type { EndpointAuthorization } from "azure-pipelines-task-lib";
import type ExecOptions from "../../src/runners/execOptions.js";
import type ExecOutput from "../../src/runners/execOutput.js";
import FileSystemWrapper from "../../src/wrappers/fileSystemWrapper.js";
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
  let fileSystemWrapper: FileSystemWrapper;
  let logger: Logger;
  let runnerInvoker: RunnerInvoker;

  // Fabricated GUIDs for testing. These are not real identifiers.
  const servicePrincipalId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const tenantId = "98765432-abcd-ef01-2345-678901234567";

  const agentTempDirectory: string = os.tmpdir();
  const isolatedConfigDirectoryA = `${agentTempDirectory}/azure-cli-config-mockA`;
  const isolatedConfigDirectoryB = `${agentTempDirectory}/azure-cli-config-mockB`;

  const loginArguments: string[] = [
    "login",
    "--service-principal",
    "-u",
    servicePrincipalId,
    "--tenant",
    tenantId,
    "--allow-no-subscriptions",
    "--federated-token",
    "OidcToken",
  ];
  const accessTokenArguments: string[] = [
    "account",
    "get-access-token",
    "--query",
    "accessToken",
    "--resource",
    "499b84ac-1321-427f-aa17-267ca6975798",
    "-o",
    "tsv",
  ];

  const createTokenManager = (): TokenManager =>
    new TokenManager(
      instance(azureDevOpsApiWrapper),
      instance(fileSystemWrapper),
      instance(logger),
      instance(runnerInvoker),
    );

  const captureExecOptions = (callIndex: number): ExecOptions | undefined => {
    const [, , options]: [string, string[], ExecOptions | undefined] =
      capture<string, string[], ExecOptions | undefined>(
        // eslint-disable-next-line @typescript-eslint/unbound-method -- ts-mockito requires the raw mocked method reference to correlate captured call history.
        runnerInvoker.exec,
      ).byCallIndex(callIndex);
    return options;
  };

  beforeEach((): void => {
    stubEnv(
      ["AGENT_TEMPDIRECTORY", agentTempDirectory],
      ["AZURE_CONFIG_DIR", undefined],
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

    logger = mock(Logger);

    fileSystemWrapper = mock(FileSystemWrapper);
    when(fileSystemWrapper.directoryExists(agentTempDirectory)).thenResolve(
      true,
    );
    when(fileSystemWrapper.mkdtemp(anyString())).thenResolve(
      isolatedConfigDirectoryA,
    );
    when(fileSystemWrapper.chmod(anyString(), anyNumber())).thenResolve();
    when(fileSystemWrapper.rm(anyString())).thenResolve();

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
      runnerInvoker.exec("az", deepEqual(loginArguments), any()),
    ).thenResolve({
      exitCode: 0,
      stderr: "",
      stdout: "",
    });
    when(
      runnerInvoker.exec("az", deepEqual(accessTokenArguments), any()),
    ).thenResolve({
      exitCode: 0,
      stderr: "",
      stdout: " AccessToken ",
    });
  });

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
  });

  describe("Azure CLI configuration isolation", (): void => {
    it("throws an error when AGENT_TEMPDIRECTORY is undefined", async (): Promise<void> => {
      // Arrange
      stubEnv(["AGENT_TEMPDIRECTORY", undefined]);
      const tokenManager: TokenManager = createTokenManager();

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'AGENT_TEMPDIRECTORY', accessed within 'TokenManager.createIsolatedAzureCliConfigDirectory()', is invalid, null, or undefined 'undefined'.",
      );
    });

    it("throws an error when AGENT_TEMPDIRECTORY is not an absolute path", async (): Promise<void> => {
      // Arrange
      stubEnv(["AGENT_TEMPDIRECTORY", "relative/agent/temp"]);
      const tokenManager: TokenManager = createTokenManager();

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'AGENT_TEMPDIRECTORY' must be an absolute path to isolate the Azure CLI configuration state.",
      );
    });

    it("throws an error when AGENT_TEMPDIRECTORY does not reference an existing directory", async (): Promise<void> => {
      // Arrange
      when(fileSystemWrapper.directoryExists(agentTempDirectory)).thenResolve(
        false,
      );
      const tokenManager: TokenManager = createTokenManager();

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "'AGENT_TEMPDIRECTORY' must reference an existing directory to isolate the Azure CLI configuration state.",
      );
    });

    it("continues when restricting the isolated Azure CLI configuration directory permissions fails", async (): Promise<void> => {
      // Arrange
      when(
        fileSystemWrapper.chmod(isolatedConfigDirectoryA, anyNumber()),
      ).thenReject(new Error("Permission Error"));
      const tokenManager: TokenManager = createTokenManager();

      // Act
      const result: string | null = await tokenManager.getToken();

      // Assert
      assert.equal(result, null);
      assert.equal(process.env.PR_METRICS_ACCESS_TOKEN, "AccessToken");
      verify(
        logger.logDebug(
          "Failed to restrict permissions on the isolated Azure CLI configuration directory.",
        ),
      ).once();
    });

    it("removes an inherited AZURE_CONFIG_DIR environment variable regardless of its case", async (): Promise<void> => {
      // Arrange
      stubEnv(["Azure_Config_Dir", "C:\\stale\\inherited\\config"]);
      const tokenManager: TokenManager = createTokenManager();

      // Act
      await tokenManager.getToken();

      // Assert
      const environment: Record<string, string> =
        captureExecOptions(0)?.env ?? {};
      assert.equal(environment.AZURE_CONFIG_DIR, isolatedConfigDirectoryA);
      assert.equal(Object.hasOwn(environment, "Azure_Config_Dir"), false);
    });

    it("does not mutate the current process's environment", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();

      // Act
      await tokenManager.getToken();

      // Assert
      assert.equal(typeof process.env.AZURE_CONFIG_DIR, "undefined");
    });

    it("provides the same isolated Azure CLI configuration directory to both CLI invocations", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();

      // Act
      await tokenManager.getToken();

      // Assert
      const firstOptions: ExecOptions | undefined = captureExecOptions(0);
      const secondOptions: ExecOptions | undefined = captureExecOptions(1);
      assert.equal(
        firstOptions?.env?.AZURE_CONFIG_DIR,
        isolatedConfigDirectoryA,
      );
      assert.equal(
        secondOptions?.env?.AZURE_CONFIG_DIR,
        isolatedConfigDirectoryA,
      );
    });

    it("creates unique isolated Azure CLI configuration directories across separate invocations", async (): Promise<void> => {
      // Arrange
      when(fileSystemWrapper.mkdtemp(anyString())).thenResolve(
        isolatedConfigDirectoryA,
        isolatedConfigDirectoryB,
      );
      const firstTokenManager: TokenManager = createTokenManager();
      const secondTokenManager: TokenManager = createTokenManager();

      // Act
      await firstTokenManager.getToken();
      await secondTokenManager.getToken();

      // Assert
      const firstDirectory: string | undefined =
        captureExecOptions(0)?.env?.AZURE_CONFIG_DIR;
      const secondDirectory: string | undefined =
        captureExecOptions(2)?.env?.AZURE_CONFIG_DIR;
      assert.equal(firstDirectory, isolatedConfigDirectoryA);
      assert.equal(secondDirectory, isolatedConfigDirectoryB);
      assert.notEqual(firstDirectory, secondDirectory);
    });

    it("cleans up the isolated Azure CLI configuration directory after a successful authentication", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();

      // Act
      await tokenManager.getToken();

      // Assert
      verify(fileSystemWrapper.rm(isolatedConfigDirectoryA)).once();
    });

    it("fails token acquisition when cleanup fails after a successful authentication", async (): Promise<void> => {
      // Arrange
      when(fileSystemWrapper.rm(isolatedConfigDirectoryA)).thenReject(
        new Error("Cleanup Error"),
      );
      const tokenManager: TokenManager = createTokenManager();

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Azure CLI authentication succeeded, but the isolated configuration state could not be cleaned up, so the access token cannot be trusted: Cleanup Error",
      );
      assert.equal(typeof process.env.PR_METRICS_ACCESS_TOKEN, "undefined");
      verify(runnerInvoker.setSecret("AccessToken")).once();

      // A subsequent call must retry authentication, proving `_previouslyInvoked` was not set.
      const secondFunc: () => Promise<string | null> = async () =>
        tokenManager.getToken();
      await AssertExtensions.toThrowAsync(
        secondFunc,
        "Azure CLI authentication succeeded, but the isolated configuration state could not be cleaned up, so the access token cannot be trusted: Cleanup Error",
      );
      verify(runnerInvoker.exec("az", deepEqual(loginArguments), any())).twice();
      verify(runnerInvoker.setSecret("AccessToken")).twice();
    });

    it("throws an error when Azure sign in fails", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.exec("az", deepEqual(loginArguments), any()),
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
      verify(fileSystemWrapper.rm(isolatedConfigDirectoryA)).once();
    });

    it("throws an error when access token retrieval fails", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.exec("az", deepEqual(accessTokenArguments), any()),
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
      verify(fileSystemWrapper.rm(isolatedConfigDirectoryA)).once();
    });

    it("preserves the authentication error and logs the cleanup failure when both sign in and cleanup fail", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.exec("az", deepEqual(loginArguments), any()),
      ).thenResolve({
        exitCode: 1,
        stderr: "Error Message",
        stdout: "",
      });
      when(fileSystemWrapper.rm(isolatedConfigDirectoryA)).thenReject(
        new Error("Cleanup Error"),
      );

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(func, "Error Message");
      verify(logger.logWarning(any())).once();
    });

    it("throws an Error when Azure sign in rejects with a non-Error value", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.exec("az", deepEqual(loginArguments), any()),
      ).thenCall(
        async (): Promise<ExecOutput> =>
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Intentionally testing defensive handling of a non-Error rejection value.
          Promise.reject("Non-Error Rejection"),
      );

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(func, "Non-Error Rejection");
    });

    it("logs a generic cleanup message when cleanup rejects with a non-Error value after a failed authentication", async (): Promise<void> => {
      // Arrange
      const tokenManager: TokenManager = createTokenManager();
      when(
        runnerInvoker.exec("az", deepEqual(loginArguments), any()),
      ).thenResolve({
        exitCode: 1,
        stderr: "Error Message",
        stdout: "",
      });
      when(fileSystemWrapper.rm(isolatedConfigDirectoryA)).thenCall(
        async (): Promise<void> =>
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Intentionally testing defensive handling of a non-Error rejection value.
          Promise.reject("Non-Error Cleanup Failure"),
      );

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(func, "Error Message");
      verify(logger.logWarning(any())).once();
    });

    it("fails token acquisition with a generic message when cleanup rejects with a non-Error value after a successful authentication", async (): Promise<void> => {
      // Arrange
      when(fileSystemWrapper.rm(isolatedConfigDirectoryA)).thenCall(
        async (): Promise<void> =>
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Intentionally testing defensive handling of a non-Error rejection value.
          Promise.reject("Non-Error Cleanup Failure"),
      );
      const tokenManager: TokenManager = createTokenManager();

      // Act
      const func: () => Promise<string | null> = async () =>
        tokenManager.getToken();

      // Assert
      await AssertExtensions.toThrowAsync(
        func,
        "Azure CLI authentication succeeded, but the isolated configuration state could not be cleaned up, so the access token cannot be trusted: Non-Error Cleanup Failure",
      );
    });
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
    verify(fileSystemWrapper.rm(isolatedConfigDirectoryA)).once();
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
    verify(fileSystemWrapper.mkdtemp(anyString())).once();
  });
});
