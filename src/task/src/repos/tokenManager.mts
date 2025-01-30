/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import "reflect-metadata";
import { validateString, validateVariable } from "../utilities/validator.mjs";
import AzureDevOpsApiWrapper from "../wrappers/azureDevOpsApiWrapper.mjs";
import { EndpointAuthorization } from "../runners/endpointAuthorization.mjs";
import ExecOutput from "../runners/execOutput.mjs";
import { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces";
import { ITaskApi } from "azure-devops-node-api/TaskApi";
import Logger from "../utilities/logger.mjs";
import RunnerInvoker from "../runners/runnerInvoker.mjs";
import { TaskHubOidcToken } from "azure-devops-node-api/interfaces/TaskAgentInterfaces";
import { WebApi } from "azure-devops-node-api";
import { singleton } from "tsyringe";

/**
 * A class for invoking authorization token management functionality, used for retrieving identity information from a
 * workload identity federation.
 */
@singleton()
export default class TokenManager {
  private readonly _azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;

  private _previouslyInvoked = false;

  /**
   * Initializes a new instance of the `TokenManager` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(
    azureDevOpsApiWrapper: AzureDevOpsApiWrapper,
    logger: Logger,
    runnerInvoker: RunnerInvoker,
  ) {
    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper;
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

    this._previouslyInvoked = true;
    const workloadIdentityFederation: string | undefined =
      this._runnerInvoker.getInput(["Workload", "Identity", "Federation"]);
    if (typeof workloadIdentityFederation === "undefined") {
      this._logger.logDebug(
        "No workload identity federation specified. Using Personal Access Token (PAT) for authentication.",
      );
      return null;
    }

    this._logger.logDebug(
      `Using workload identity federation '${workloadIdentityFederation}' for authentication.`,
    );
    const authorizationScheme: string | undefined =
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

    const federatedToken: string = await this.getFederatedToken(
      workloadIdentityFederation,
    );
    this._runnerInvoker.setSecret(federatedToken);

    // Sign in to Azure using the federated token.
    const signInResult: ExecOutput = await this._runnerInvoker.exec(
      "az",
      `login --service-principal -u ${servicePrincipalId} --tenant ${tenantId} --allow-no-subscriptions --federated-token ${federatedToken}`,
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
      "account get-access-token --query accessToken --resource 499b84ac-1321-427f-aa17-267ca6975798 -o tsv",
    );
    if (accessTokenResult.exitCode !== 0) {
      throw new Error(accessTokenResult.stderr);
    }

    const result: string = accessTokenResult.stdout.trim();
    this._runnerInvoker.setSecret(result);
    return result;
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

    const endpointAuthorization: EndpointAuthorization | undefined =
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
