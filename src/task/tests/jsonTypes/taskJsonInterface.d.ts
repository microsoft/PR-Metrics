/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import ResourcesJson from '../jsonTypes/resourcesJson'

/**
 * An interface defining the format of Azure Pipelines task JSON files.
 */
export default interface TaskJsonInterface {
  /**
   * The friendly name of the task.
   */
  friendlyName: string

  /**
   * The version number of the task.
   */
  version: {
    /**
     * The major element of the version number.
     */
    Major: number

    /**
     * The minor element of the version number.
     */
    Minor: number

    /**
     * The patch element of the version number.
     */
    Patch: number
  }

  /**
   * The set of resource messages.
   */
  messages: ResourcesJson
}
