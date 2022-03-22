// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { singleton } from 'tsyringe'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import ResourcesJson from '../jsonTypes/resourcesJson'

/**
 * A class for managing resource strings within GitHub runners.
 */
@singleton()
export default class GitHubResources {
  private readonly _resources: Map<string, string> = new Map<string, string>()

  /**
   * Initializes the mechanism for getting localized strings from the JSON resource file.
   * @param folder The folder in which the localized resources are stored.
   */
  public initialize (folder: string): void {
    const resourceData: string = fs.readFileSync(path.join(folder, 'resources.resjson'), 'utf8')
    const resources: ResourcesJson = JSON.parse(resourceData) as ResourcesJson

    const entries: [string, string][] = Object.entries(resources)
    const stringPrefix: string = 'loc.messages.'
    entries.forEach((entry: [string, string]): void => {
      if (entry[0].startsWith(stringPrefix)) {
        this._resources.set(entry[0].substring(stringPrefix.length), entry[1])
      }
    })
  }

  /**
   * Gets the localized string from the JSON resource file and optionally formats using the additional parameters.
   * @param key The key of the resources string in the resource file.
   * @param param Optional additional parameters for formatting the string.
   * @returns The localized and formatted string.
   */
  public localize (key: string, ...param: any[]): string {
    return util.format(this._resources.get(key), ...param)
  }
}
