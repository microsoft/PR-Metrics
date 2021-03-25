// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { singleton } from 'tsyringe'
import * as azdev from 'azure-devops-node-api'

/**
 * A wrapper around the Azure Devops Api, to facilitate testability.
 */
@singleton()
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
