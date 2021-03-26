// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import ResourcesJson from './resourcesJson'

/**
 * An interface defining the format of Azure Pipelines task JSON files.
 */
export default interface TaskJson {
  /**
   * The set of resource messages.
   */
  messages: ResourcesJson;
}
