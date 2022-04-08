// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import glob from 'glob-promise'
import ResourcesJson from '../../src/jsonTypes/resourcesJson'
import TaskJson from '../jsonTypes/taskJson'

describe('resources.resjson', (): void => {
  const basePath: string = path.join(__dirname, '..', '..')

  const languagesPath: string = path.join(basePath, 'Strings', 'resources.resjson')
  const languages: string[] = fs.readdirSync(languagesPath)
  const resources: Map<string, ResourcesJson> = new Map<string, ResourcesJson>()
  languages.forEach((language: string): void => {
    const resourcesFile: string = path.join(languagesPath, language, 'resources.resjson')
    const resourcesFileContents: string = fs.readFileSync(resourcesFile, 'utf8')
    resources.set(language, JSON.parse(resourcesFileContents) as ResourcesJson)
  })
  const commentSuffix: string = '.comment'
  const schemaEntry: string = '$schema'

  const taskJsonFile: string = path.join(basePath, 'task.json')
  const taskJsonContents: string = fs.readFileSync(taskJsonFile, 'utf8')

  const taskLocJsonFile: string = path.join(basePath, 'task.loc.json')
  const taskLocJsonContents: string = fs.readFileSync(taskLocJsonFile, 'utf8')
  const taskLocJson: TaskJson = JSON.parse(taskLocJsonContents) as TaskJson

  resources.forEach((value: ResourcesJson, key: string): void => {
    it(`should contain a comment for every resource in language '${key}'`, (): void => {
      // Arrange
      const keys: string[] = Object.keys(value)

      // Assert
      keys.forEach((key: string): void => {
        if (key !== schemaEntry && !key.endsWith(commentSuffix)) {
          expect(keys).to.contain(`${key}${commentSuffix}`)
        }
      })
    })

    it(`should contain a resource for every comment in language '${key}'`, (): void => {
      // Arrange
      const keys: string[] = Object.keys(value)

      // Assert
      keys.forEach((key: string): void => {
        if (key !== schemaEntry && key.endsWith(commentSuffix)) {
          expect(keys).to.contain(key.substring(0, key.length - commentSuffix.length))
        }
      })
    })

    it(`should contain the same resources in language '${key}' as in en-US`, (): void => {
      // Arrange
      const keys: string[] = Object.keys(value)
      const englishKeys: string[] = Object.keys(resources.get('en-US') ?? '')

      // Assert
      expect(keys).to.deep.equal(englishKeys)
    })

    it(`should have the same number of placeholders in language '${key}' as in en-US`, (): void => {
      // Arrange
      const entries: Array<[string, string]> = Object.entries(value)
      const englishEntries: Map<string, string> = new Map<string, string>(Object.entries(resources.get('en-US') ?? ''))

      // Assert
      const placeholderRegExp: RegExp = /%s/g
      entries.forEach((entry: [string, string]): void => {
        const placeholders: number = entry[1].match(placeholderRegExp)?.length ?? 0
        const placeholdersEnglishUS: number = (englishEntries.get(entry[0]) ?? '').match(placeholderRegExp)?.length ?? 0
        expect(placeholders).equal(placeholdersEnglishUS)
      })
    })
  })

  it('should have the correct reference ID for all resources in task.loc.json', (): void => {
    // Arrange
    const keysTaskLocJson: Array<[string, string]> = Object.entries(taskLocJson.messages)

    // Assert
    keysTaskLocJson.forEach((entry: [string, string]): void => {
      expect(entry[1]).to.equal(`ms-resource:loc.messages.${entry[0]}`)
    })
  })

  it('should have the same resources references in task.loc.json and in the resources files', (): void => {
    // Arrange
    const taskJsonResources: RegExpMatchArray = taskLocJsonContents.match(/"ms-resource:.+?"/g) ?? []
    const allResources: string[] = []
    taskJsonResources.forEach((taskJsonRegExpMatch: string): void => {
      allResources.push(taskJsonRegExpMatch.substr(13, taskJsonRegExpMatch.length - 14))
    })
    allResources.sort()
    const englishEntries: Array<[string, string]> = Object.entries(resources.get('en-US') ?? '')
    const relevantKeys: string[] = []
    englishEntries.forEach((entry: [string, string]): void => {
      if (entry[0] !== schemaEntry && !entry[0].endsWith(commentSuffix)) {
        relevantKeys.push(entry[0])
      }
    })

    // Assert
    expect(allResources).to.deep.equal(relevantKeys)
  })

  it('should have the same contents in task.json and task.loc.json', (): void => {
    // Arrange
    let fileContents: string = taskLocJsonContents
    const englishEntries: Array<[string, string]> = Object.entries(resources.get('en-US') ?? '')
    englishEntries.forEach((entry: [string, string]): void => {
      fileContents = fileContents.replace(`ms-resource:${entry[0]}`, entry[1])
    })
    const remainingResources: RegExpMatchArray | null = fileContents.match(/"ms-resource:.+?"/g)

    // Assert
    expect(fileContents).to.equal(taskJsonContents)
    expect(remainingResources).to.equal(null)
  })

  it('should have the same number of placeholders across the TypeScript code and resources file', async (): Promise<void> => {
    // Arrange
    const typeScriptFiles1: string[] = await glob(path.join(basePath, '!(node_modules|tests)/**/*.ts'))
    const typeScriptFiles2: string[] = await glob(path.join(basePath, '*.ts'))
    const typeScriptFiles: string[] = typeScriptFiles1.concat(typeScriptFiles2)
    const typeScriptResources: Map<string, number> = new Map<string, number>()
    const resourceRegExp: RegExp = /loc\('.+?'.*?\)/g
    const parameterDelimiterRegExp: RegExp = /,/g
    typeScriptFiles.forEach((file: string): void => {
      const fileContents: string = fs.readFileSync(file, 'utf8')
      const matches: RegExpMatchArray | null = fileContents.match(resourceRegExp)
      if (matches !== null) {
        matches.forEach((match: string): void => {
          const key: string = match.substring(5, match.indexOf('\'', 6))
          const value: number = match.match(parameterDelimiterRegExp)?.length ?? 0
          const existingValue: number | undefined = typeScriptResources.get(key)
          if (existingValue === undefined) {
            typeScriptResources.set(key, value)
          } else {
            expect(value).to.equal(existingValue)
          }
        })
      }
    })
    const englishEntries: Array<[string, string]> = Object.entries(resources.get('en-US') ?? '')
    const relevantEntries: Map<string, number> = new Map<string, number>()
    const expectedPrefix: string = 'loc.messages.'
    const placeholderRegExp: RegExp = /%s/g
    englishEntries.forEach((entry: [string, string]): void => {
      if (entry[0].startsWith(expectedPrefix) && !entry[0].endsWith(commentSuffix)) {
        relevantEntries.set(entry[0].substring(expectedPrefix.length), entry[1].match(placeholderRegExp)?.length ?? 0)
      }
    })

    // Act
    expect(Array.from(typeScriptResources.keys()).sort()).to.deep.equal(Array.from(relevantEntries.keys()).sort())
    typeScriptResources.forEach((value: number, key: string): void => {
      expect(value).to.equal(relevantEntries.get(key) ?? '')
    })
  })
})
