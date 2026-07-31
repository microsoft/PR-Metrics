/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as path from "node:path";
import {
  validateGuid,
  validateString,
  validateVariable,
} from "../utilities/validator.js";
import type AzureDevOpsApiWrapper from "../wrappers/azureDevOpsApiWrapper.js";
import type { EndpointAuthorization } from "../runners/endpointAuthorization.js";
import type ExecOptions from "../runners/execOptions.js";
import type ExecOutput from "../runners/execOutput.js";
import type FileSystemWrapper from "../wrappers/fileSystemWrapper.js";
import type { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import type { ITaskApi } from "azure-devops-node-api/TaskApi.js";
import type Logger from "../utilities/logger.js";
import type RunnerInvoker from "../runners/runnerInvoker.js";
import type { TaskHubOidcToken } from "azure-devops-node-api/interfaces/TaskAgentInterfaces.js";
import type { WebApi } from "azure-devops-node-api";
import { azureCliConfigDirectoryMode } from "../utilities/constants.js";

/**
 * A class for invoking authorization token management functionality, used for retrieving identity information from a
 * workload identity federation.
 */
export default class TokenManager {
  private static readonly _azureConfigDirEnvironmentVariable =
    "AZURE_CONFIG_DIR";
  private static readonly _isolatedAzureCliConfigDirectoryPrefix =
    "azure-cli-config-";

  private readonly _azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  private readonly _fileSystemWrapper: FileSystemWrapper;
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;

  private _previouslyInvoked = false;

  /**
   * Initializes a new instance of the `TokenManager` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param fileSystemWrapper The wrapper around the file system.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(
    azureDevOpsApiWrapper: AzureDevOpsApiWrapper,
    fileSystemWrapper: FileSystemWrapper,
    logger: Logger,
    runnerInvoker: RunnerInvoker,
  ) {
    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper;
    this._fileSystemWrapper = fileSystemWrapper;
    this._logger = logger;
    this._runnerInvoker = runnerInvoker;
  }

  /**
   * Gets the access token.
   * @returns A promise containing a string to display if the operation failed.
   */
  public async getToken(): Promise<string | null> {
    this._logger.logDebug("* TokenManager.getToken()");

    if (this._previouslyInvoked) {
      return null;
    }

    const workloadIdentityFederation: string | null =
      this._runnerInvoker.getInput(["Workload", "Identity", "Federation"]);
    if (workloadIdentityFederation === null) {
      this._logger.logDebug(
        "No workload identity federation specified. Using Personal Access Token (PAT) for authentication.",
      );
      return null;
    }

    this._logger.logDebug(
      `Using workload identity federation '${workloadIdentityFederation}' for authentication.`,
    );
    const authorizationScheme: string | null =
      this._runnerInvoker.getEndpointAuthorizationScheme(
        workloadIdentityFederation,
      );
    if (authorizationScheme !== "WorkloadIdentityFederation") {
      return this._runnerInvoker.loc(
        "repos.tokenManager.incorrectAuthorizationScheme",
        workloadIdentityFederation,
        String(authorizationScheme),
      );
    }

    process.env.PR_METRICS_ACCESS_TOKEN = await this.getAccessToken(
      workloadIdentityFederation,
    );
    this._previouslyInvoked = true;
    return null;
  }

  private async getAccessToken(
    workloadIdentityFederation: string,
  ): Promise<string> {
    this._logger.logDebug("* TokenManager.getAccessToken()");

    const servicePrincipalId: string = validateString(
      this._runnerInvoker.getEndpointAuthorizationParameter(
        workloadIdentityFederation,
        "serviceprincipalid",
      ),
      "servicePrincipalId",
      "TokenManager.getAccessToken()",
    );
    const tenantId: string = validateString(
      this._runnerInvoker.getEndpointAuthorizationParameter(
        workloadIdentityFederation,
        "tenantid",
      ),
      "tenantId",
      "TokenManager.getAccessToken()",
    );

    validateGuid(
      servicePrincipalId,
      "servicePrincipalId",
      "TokenManager.getAccessToken()",
    );
    validateGuid(tenantId, "tenantId", "TokenManager.getAccessToken()");

    const federatedToken: string = await this.getFederatedToken(
      workloadIdentityFederation,
    );
    this._runnerInvoker.setSecret(federatedToken);

    /*
     * Isolate the Azure CLI configuration state in a unique, ephemeral directory for the duration of this
     * invocation only, so that self-hosted agent jobs cannot read or reuse credentials cached by other jobs.
     */
    const isolatedConfigDirectory: string =
      await this.createIsolatedAzureCliConfigDirectory();
    const isolatedEnvironment: Record<string, string> =
      this.buildIsolatedEnvironment(isolatedConfigDirectory);

    let accessToken: string;
    try {
      accessToken = await this.authenticateWithAzureCli(
        servicePrincipalId,
        tenantId,
        federatedToken,
        isolatedEnvironment,
      );
    } catch (authenticationError: unknown) {
      await this.cleanUpIsolatedAzureCliConfigDirectoryAfterFailure(
        isolatedConfigDirectory,
      );
      throw authenticationError instanceof Error
        ? authenticationError
        : new Error(String(authenticationError));
    }

    // Cleanup failure after a successful authentication is treated as a security failure: the token is not released.
    await this.cleanUpIsolatedAzureCliConfigDirectoryAfterSuccess(
      isolatedConfigDirectory,
    );

    this._runnerInvoker.setSecret(accessToken);
    return accessToken;
  }

  private buildIsolatedEnvironment(
    isolatedConfigDirectory: string,
  ): Record<string, string> {
    const environment: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      // Remove any inherited AZURE_CONFIG_DIR entries case-insensitively, which matters on Windows.
      if (
        typeof value === "string" &&
        key.toUpperCase() !== TokenManager._azureConfigDirEnvironmentVariable
      ) {
        environment[key] = value;
      }
    }

    environment[TokenManager._azureConfigDirEnvironmentVariable] =
      isolatedConfigDirectory;
    return environment;
  }

  private async createIsolatedAzureCliConfigDirectory(): Promise<string> {
    this._logger.logDebug(
      "* TokenManager.createIsolatedAzureCliConfigDirectory()",
    );

    const agentTempDirectory: string = validateVariable(
      "AGENT_TEMPDIRECTORY",
      "TokenManager.createIsolatedAzureCliConfigDirectory()",
    );
    if (!path.isAbsolute(agentTempDirectory)) {
      throw new Error(
        "'AGENT_TEMPDIRECTORY' must be an absolute path to isolate the Azure CLI configuration state.",
      );
    }

    const agentTempDirectoryExists: boolean =
      await this._fileSystemWrapper.directoryExists(agentTempDirectory);
    if (!agentTempDirectoryExists) {
      throw new Error(
        "'AGENT_TEMPDIRECTORY' must reference an existing directory to isolate the Azure CLI configuration state.",
      );
    }

    const isolatedConfigDirectory: string =
      await this._fileSystemWrapper.mkdtemp(
        path.join(
          agentTempDirectory,
          TokenManager._isolatedAzureCliConfigDirectoryPrefix,
        ),
      );

    try {
      await this._fileSystemWrapper.chmod(
        isolatedConfigDirectory,
        azureCliConfigDirectoryMode,
      );
    } catch {
      this._logger.logDebug(
        "Failed to restrict permissions on the isolated Azure CLI configuration directory.",
      );
    }

    return isolatedConfigDirectory;
  }

  private async authenticateWithAzureCli(
    servicePrincipalId: string,
    tenantId: string,
    federatedToken: string,
    isolatedEnvironment: Record<string, string>,
  ): Promise<string> {
    this._logger.logDebug("* TokenManager.authenticateWithAzureCli()");

    const execOptions: ExecOptions = {
      env: isolatedEnvironment,
    };

    // Sign in to Azure using the federated token.
    const signInResult: ExecOutput = await this._runnerInvoker.exec(
      "az",
      [
        "login",
        "--service-principal",
        "-u",
        servicePrincipalId,
        "--tenant",
        tenantId,
        "--allow-no-subscriptions",
        "--federated-token",
        federatedToken,
      ],
      execOptions,
    );
    if (signInResult.exitCode !== 0) {
      throw new Error(signInResult.stderr);
    }

    /*
     * Acquire an access token for the Azure DevOps API. This uses the resource ID for Azure DevOps in Microsoft Entra,
     * 499b84ac-1321-427f-aa17-267ca6975798, as documented at https://learn.microsoft.com/rest/api/azure/devops/tokens/
     * and https://learn.microsoft.com/azure/devops/integrate/get-started/authentication/service-principal-managed-identity.
     */
    const accessTokenResult: ExecOutput = await this._runnerInvoker.exec(
      "az",
      [
        "account",
        "get-access-token",
        "--query",
        "accessToken",
        "--resource",
        "499b84ac-1321-427f-aa17-267ca6975798",
        "-o",
        "tsv",
      ],
      execOptions,
    );
    if (accessTokenResult.exitCode !== 0) {
      throw new Error(accessTokenResult.stderr);
    }

    return accessTokenResult.stdout.trim();
  }

  private async cleanUpIsolatedAzureCliConfigDirectoryAfterFailure(
    isolatedConfigDirectory: string,
  ): Promise<void> {
    this._logger.logDebug(
      "* TokenManager.cleanUpIsolatedAzureCliConfigDirectoryAfterFailure()",
    );

    try {
      await this._fileSystemWrapper.rm(isolatedConfigDirectory);
    } catch (cleanupError: unknown) {
      const cleanupMessage: string =
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError);
      this._logger.logWarning(
        `Azure CLI authentication failed and the isolated configuration state could not be cleaned up: ${cleanupMessage}`,
      );
    }
  }

  private async cleanUpIsolatedAzureCliConfigDirectoryAfterSuccess(
    isolatedConfigDirectory: string,
  ): Promise<void> {
    this._logger.logDebug(
      "* TokenManager.cleanUpIsolatedAzureCliConfigDirectoryAfterSuccess()",
    );

    try {
      await this._fileSystemWrapper.rm(isolatedConfigDirectory);
    } catch (cleanupError: unknown) {
      const cleanupMessage: string =
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError);
      throw new Error(
        `Azure CLI authentication succeeded, but the isolated configuration state could not be cleaned up, so the access token cannot be trusted: ${cleanupMessage}`,
        {
          cause: cleanupError,
        },
      );
    }
  }

  private async getFederatedToken(
    workloadIdentityFederation: string,
  ): Promise<string> {
    this._logger.logDebug("* TokenManager.getFederatedToken()");

    const systemAccessToken: string = this.getSystemAccessToken();
    const authorizationHandler: IRequestHandler =
      this._azureDevOpsApiWrapper.getHandlerFromToken(systemAccessToken);

    const collectionUri: string = validateVariable(
      "SYSTEM_COLLECTIONURI",
      "TokenManager.getFederatedToken()",
    );
    const connection: WebApi = this._azureDevOpsApiWrapper.getWebApiInstance(
      collectionUri,
      authorizationHandler,
    );

    const taskApi: ITaskApi = await connection.getTaskApi();
    const teamProjectId: string = validateVariable(
      "SYSTEM_TEAMPROJECTID",
      "TokenManager.getFederatedToken()",
    );
    const hostType: string = validateVariable(
      "SYSTEM_HOSTTYPE",
      "TokenManager.getFederatedToken()",
    );
    const planId: string = validateVariable(
      "SYSTEM_PLANID",
      "TokenManager.getFederatedToken()",
    );
    const jobId: string = validateVariable(
      "SYSTEM_JOBID",
      "TokenManager.getFederatedToken()",
    );
    const response: TaskHubOidcToken = await taskApi.createOidcToken(
      {},
      teamProjectId,
      hostType,
      planId,
      jobId,
      workloadIdentityFederation,
    );

    return validateString(
      response.oidcToken,
      "response.oidcToken",
      "TokenManager.getFederatedToken()",
    );
  }

  private getSystemAccessToken(): string {
    this._logger.logDebug("* TokenManager.getSystemAccessToken()");

    const endpointAuthorization: EndpointAuthorization | null =
      this._runnerInvoker.getEndpointAuthorization("SYSTEMVSSCONNECTION");

    const scheme: string | undefined = endpointAuthorization?.scheme;
    if (scheme !== "OAuth") {
      throw new Error(
        `Could not acquire authorization token from workload identity federation as the scheme was '${scheme ?? ""}'.`,
      );
    }

    this._logger.logDebug(
      "Acquired authorization token from workload identity federation.",
    );
    return validateString(
      endpointAuthorization?.parameters.AccessToken,
      "endpointAuthorization.parameters.AccessToken",
      "TokenManager.getSystemAccessToken()",
    );
  }
}
