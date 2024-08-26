/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import * as fs from 'fs'
import * as path from 'path'
import ResourcesJson from '../../src/jsonTypes/resourcesJson'
import TaskJson from '../jsonTypes/taskJson'
import assert from 'node:assert/strict'
import { globSync } from 'glob'

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
  const commentSuffix = '.comment'
  const schemaEntry = '$schema'

  const taskJsonFile: string = path.join(basePath, 'task.json')
  const taskJsonContents: string = fs.readFileSync(taskJsonFile, 'utf8')

  const taskLocJsonFile: string = path.join(basePath, 'task.loc.json')
  const taskLocJsonContents: string = fs.readFileSync(taskLocJsonFile, 'utf8')
  const taskLocJson: TaskJson = JSON.parse(taskLocJsonContents) as TaskJson

  resources.forEach((value: ResourcesJson, language: string): void => {
    it(`should contain a comment for every resource in language '${language}'`, (): void => {
      // Arrange
      const keys: string[] = Object.keys(value)

      // Assert
      keys.forEach((key: string): void => {
        if (key !== schemaEntry && !key.endsWith(commentSuffix)) {
          assert(keys.includes(`${key}${commentSuffix}`))
        }
      })
    })

    it(`should contain a resource for every comment in language '${language}'`, (): void => {
      // Arrange
      const keys: string[] = Object.keys(value)

      // Assert
      keys.forEach((key: string): void => {
        if (key !== schemaEntry && key.endsWith(commentSuffix)) {
          assert(keys.includes(key.substring(0, key.length - commentSuffix.length)))
        }
      })
    })

    it(`should contain the same resources in language '${language}' as in en-US`, (): void => {
      // Arrange
      const keys: string[] = Object.keys(value)
      const englishKeys: string[] = Object.keys(resources.get('en-US') ?? '')

      // Assert
      assert.deepEqual(keys, englishKeys)
    })

    it(`should have the same number of placeholders in language '${language}' as in en-US`, (): void => {
      // Arrange
      const entries: [string, string][] = Object.entries(value)
      const englishEntries: Map<string, string> = new Map<string, string>(Object.entries(resources.get('en-US') ?? ''))

      // Assert
      const placeholderRegExp = /%s/gu
      entries.forEach((entry: [string, string]): void => {
        const placeholders: number = entry[1].match(placeholderRegExp)?.length ?? 0
        const placeholdersEnglishUS: number = (englishEntries.get(entry[0]) ?? '').match(placeholderRegExp)?.length ?? 0
        assert.equal(placeholders, placeholdersEnglishUS)
      })
    })
  })

  it('should have the correct reference ID for all resources in task.loc.json', (): void => {
    // Arrange
    const keysTaskLocJson: [string, string][] = Object.entries(taskLocJson.messages as ArrayLike<string>)

    // Assert
    keysTaskLocJson.forEach((entry: [string, string]): void => {
      assert.equal(entry[1], `ms-resource:loc.messages.${entry[0]}`)
    })
  })

  it('should have the same resources references in task.loc.json and in the resources files', (): void => {
    // Arrange
    const taskJsonResources: RegExpMatchArray = taskLocJsonContents.match(/"ms-resource:.+?"/gu) ?? ['']
    const allResources: string[] = []
    taskJsonResources.forEach((taskJsonRegExpMatch: string): void => {
      allResources.push(taskJsonRegExpMatch.substring(13, taskJsonRegExpMatch.length - 1))
    })
    allResources.sort()
    const englishEntries: [string, string][] = Object.entries(resources.get('en-US') ?? '')
    const relevantKeys: string[] = []
    englishEntries.forEach((entry: [string, string]): void => {
      if (entry[0] !== schemaEntry && !entry[0].endsWith(commentSuffix)) {
        relevantKeys.push(entry[0])
      }
    })

    // Assert
    assert.deepEqual(allResources, relevantKeys)
  })

  it('should have the same contents in task.json and task.loc.json', (): void => {
    // Arrange
    let fileContents: string = taskLocJsonContents
    const englishEntries: [string, string][] = Object.entries(resources.get('en-US') ?? '')
    englishEntries.forEach((entry: [string, string]): void => {
      fileContents = fileContents.replace(`ms-resource:${entry[0]}`, entry[1])
    })
    const remainingResources: RegExpMatchArray | null = fileContents.match(/"ms-resource:.+?"/gu)

    // Assert
    assert.equal(fileContents, taskJsonContents)
    assert.equal(remainingResources, null)
  })

  it('should have the same number of placeholders across the TypeScript code and resources file', (): void => {
    // Arrange
    const globBasePath = `${basePath.replace(/\\/gu, '/')  }/`
    const typeScriptFiles1: string[] = globSync(`${globBasePath  }!(node_modules|tests)/**/*.ts`)
    const typeScriptFiles2: string[] = globSync(`${globBasePath  }*.ts`)
    const typeScriptFiles: string[] = typeScriptFiles1.concat(typeScriptFiles2)
    const typeScriptResources: Map<string, number> = new Map<string, number>()
    const resourceRegExp = /loc\('.+?'.*?\)/gu
    const parameterDelimiterRegExp = /,/gu
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
            assert.equal(value, existingValue)
          }
        })
      }
    })
    const englishEntries: [string, string][] = Object.entries(resources.get('en-US') ?? '')
    const relevantEntries: Map<string, number> = new Map<string, number>()
    const expectedPrefix = 'loc.messages.'
    const placeholderRegExp = /%s/gu
    englishEntries.forEach((entry: [string, string]): void => {
      if (entry[0].startsWith(expectedPrefix) && !entry[0].endsWith(commentSuffix)) {
        relevantEntries.set(entry[0].substring(expectedPrefix.length), entry[1].match(placeholderRegExp)?.length ?? 0)
      }
    })

    // Act
    assert.deepEqual(Array.from(typeScriptResources.keys()).sort(), Array.from(relevantEntries.keys()).sort())
    typeScriptResources.forEach((value: number, key: string): void => {
      assert.equal(value, relevantEntries.get(key) ?? '')
    })
  })
})
