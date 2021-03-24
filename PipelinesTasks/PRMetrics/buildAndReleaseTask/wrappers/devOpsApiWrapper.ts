// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as azdev from 'azure-devops-node-api'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'

/**
 * A wrapper around the Azure Devops Api, to facilitate testability.
 */
class DevOpsApiWrapper {
  /**
   * Returns a personal access token handler.
   * @param token azure devops api token.
   */
  public getPersonalAccessTokenHandler (token: string): IRequestHandler {
    return azdev.getPersonalAccessTokenHandler(token)
  }

  /**
    * Returns a webApi instance.
    * @param baseUri base uri.
    * @param authHandler authentication handler instance.
    */
  public getWebApiInstance (baseUri: string, authHandler: IRequestHandler): azdev.WebApi {
    return new azdev.WebApi(baseUri, authHandler)
  }
}

export default DevOpsApiWrapper
