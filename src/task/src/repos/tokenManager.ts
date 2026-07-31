/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import {
  validateGuid,
  validateString,
  validateVariable,
} from "../utilities/validator.js";
import type AzureDevOpsApiWrapper from "../wrappers/azureDevOpsApiWrapper.js";
import type { EndpointAuthorization } from "../runners/endpointAuthorization.js";
import type HttpWrapper from "../wrappers/httpWrapper.js";
import type { IRequestHandler } from "azure-devops-node-api/interfaces/common/VsoBaseInterfaces.js";
import type { ITaskApi } from "azure-devops-node-api/TaskApi.js";
import type Logger from "../utilities/logger.js";
import type RunnerInvoker from "../runners/runnerInvoker.js";
import type { TaskHubOidcToken } from "azure-devops-node-api/interfaces/TaskAgentInterfaces.js";
import type { WebApi } from "azure-devops-node-api";

/**
 * The Microsoft Entra public cloud authority. Sovereign cloud authorities are not supported.
 */
const microsoftEntraPublicCloudAuthority = "https://login.microsoftonline.com";

/**
 * The Microsoft Entra resource ID for Azure DevOps, as documented at
 * https://learn.microsoft.com/rest/api/azure/devops/tokens/ and
 * https://learn.microsoft.com/azure/devops/integrate/get-started/authentication/service-principal-managed-identity.
 */
const azureDevOpsResourceId = "499b84ac-1321-427f-aa17-267ca6975798";

/**
 * A class for invoking authorization token management functionality, used for retrieving identity information from a
 * workload identity federation.
 *
 * Access tokens are acquired by exchanging the workload identity federation's OIDC assertion directly with the
 * Microsoft Entra OAuth 2.0 v2 token endpoint over HTTPS – the assertion is never passed to a subprocess and no
 * Azure CLI state is created. Only the Microsoft Entra public cloud authority is supported; sovereign clouds are
 * out of scope.
 */
export default class TokenManager {
  private readonly _azureDevOpsApiWrapper: AzureDevOpsApiWrapper;
  private readonly _httpWrapper: HttpWrapper;
  private readonly _logger: Logger;
  private readonly _runnerInvoker: RunnerInvoker;

  private _previouslyInvoked = false;

  /**
   * Initializes a new instance of the `TokenManager` class.
   * @param azureDevOpsApiWrapper The wrapper around the Azure DevOps API.
   * @param httpWrapper The wrapper around the Fetch API.
   * @param logger The logger.
   * @param runnerInvoker The runner invoker logic.
   */
  public constructor(
    azureDevOpsApiWrapper: AzureDevOpsApiWrapper,
    httpWrapper: HttpWrapper,
    logger: Logger,
    runnerInvoker: RunnerInvoker,
  ) {
    this._azureDevOpsApiWrapper = azureDevOpsApiWrapper;
    this._httpWrapper = httpWrapper;
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
     * Exchange the federated assertion directly with the Microsoft Entra OAuth 2.0 v2 token endpoint for the
     * validated tenant. The tenant ID is path-encoded even though `validateGuid()` already restricts it to GUID
     * characters, so that this remains safe if that validation is ever loosened.
     */
    const tokenEndpoint = `${microsoftEntraPublicCloudAuthority}/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;

    const form: URLSearchParams = new URLSearchParams();
    form.set("client_id", servicePrincipalId);
    form.set("grant_type", "client_credentials");
    form.set(
      "client_assertion_type",
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    );
    form.set("client_assertion", federatedToken);
    form.set("scope", `${azureDevOpsResourceId}/.default`);

    const accessToken: string = await this._httpWrapper.postForm(
      tokenEndpoint,
      form,
    );
    this._runnerInvoker.setSecret(accessToken);
    return accessToken;
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
