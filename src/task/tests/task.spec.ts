// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { dirname } from 'path'
import { expect } from 'chai'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import ResourcesJson from '../src/jsonTypes/resourcesJson.js'
import PackageJson from './jsonTypes/packageJson.js'
import TaskJson from './jsonTypes/taskJson.js'
import VssExtensionJson from './jsonTypes/vssExtensionJson.js'

describe('task.json', (): void => {
  const workingPath: string = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url))
  const basePath: string = path.join(workingPath, '..')
  const taskJsonFile: string = path.join(basePath, 'task.json')
  const taskJsonContents: string = fs.readFileSync(taskJsonFile, 'utf8')
  const taskJson: TaskJson = JSON.parse(taskJsonContents) as TaskJson
  const version: string = `${taskJson.version.Major}.${taskJson.version.Minor}.${taskJson.version.Patch}`

  const languagesPath: string = path.join(basePath, 'Strings', 'resources.resjson')
  const languages: string[] = fs.readdirSync(languagesPath)
  const resources: Map<string, ResourcesJson> = new Map<string, ResourcesJson>()
  languages.forEach((language: string): void => {
    const resourcesFile: string = path.join(languagesPath, language, 'resources.resjson')
    const resourcesFileContents: string = fs.readFileSync(resourcesFile, 'utf8')
    resources.set(language, JSON.parse(resourcesFileContents) as ResourcesJson)
  })

  it('should have a friendly name ending with the version number', (): void => {
    // Assert
    expect(taskJson.friendlyName.endsWith(version)).to.equal(true)
  })

  resources.forEach((value: ResourcesJson, key: string): void => {
    it(`should have a friendly name including the version number in language '${key}'`, (): void => {
      // Assert
      expect(value['loc.friendlyName']?.includes(version)).to.equal(true)
    })
  })

  it('should have the same version number as task.loc.json', (): void => {
    // Arrange
    const taskLocJsonFile: string = path.join(basePath, 'task.loc.json')
    const taskLocJsonContents: string = fs.readFileSync(taskLocJsonFile, 'utf8')
    const taskLocJson: TaskJson = JSON.parse(taskLocJsonContents) as TaskJson

    // Assert
    expect(taskJson.version.Major).to.equal(taskLocJson.version.Major)
    expect(taskJson.version.Minor).to.equal(taskLocJson.version.Minor)
    expect(taskJson.version.Patch).to.equal(taskLocJson.version.Patch)
  })

  it('should have the same version number as vss-extension.json', (): void => {
    // Arrange
    const vssExtensionJsonFile: string = path.join(basePath, '..', 'vss-extension.json')
    const vssExtensionJsonFileContents: string = fs.readFileSync(vssExtensionJsonFile, 'utf8')
    const vssExtensionJson: VssExtensionJson = JSON.parse(vssExtensionJsonFileContents) as VssExtensionJson

    // Assert
    expect(vssExtensionJson.version).to.equal(version)
  })

  it('should have the same version number as package.json', (): void => {
    // Arrange
    const packageJsonFile: string = path.join(basePath, '..', '..', 'package.json')
    const packageJsonFileContents: string = fs.readFileSync(packageJsonFile, 'utf8')
    const packageJson: PackageJson = JSON.parse(packageJsonFileContents) as PackageJson

    // Assert
    expect(packageJson.version).to.equal(version)
  })

  it('should have the same version number as package-lock.json', (): void => {
    // Arrange
    const packageLockJsonFile: string = path.join(basePath, '..', '..', 'package-lock.json')
    const packageLockJsonFileContents: string = fs.readFileSync(packageLockJsonFile, 'utf8')
    const packageLockJson: PackageJson = JSON.parse(packageLockJsonFileContents) as PackageJson

    // Assert
    expect(packageLockJson.version).to.equal(version)
  })
})
