// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as taskLib from 'azure-pipelines-task-lib/task.js'
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner.js'
import { expect } from 'chai'
import * as path from 'path'
import 'reflect-metadata'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { GitWritableStream } from '../../src/git/gitWritableStream.js'
import AzurePipelinesRunnerInvoker from '../../src/runners/azurePipelinesRunnerInvoker.js'
import Logger from '../../src/utilities/logger.js'
import AzurePipelinesRunnerWrapper from '../../src/wrappers/azurePipelinesRunnerWrapper.js'

describe('azurePipelinesRunnerInvoker.ts', function (): void {
  let azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper

  beforeEach((): void => {
    azurePipelinesRunnerWrapper = mock(AzurePipelinesRunnerWrapper)
  })

  describe('exec()', (): void => {
    it('should call the underlying method', async (): Promise<void> => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(instance(logger))
      const errorStream: GitWritableStream = new GitWritableStream(instance(logger))
      when(azurePipelinesRunnerWrapper.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), anything())).thenResolve(1)

      // Act
      const result: number = await azurePipelinesRunnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      expect(result).to.equal(1)
      const options: IExecOptions = {
        failOnStdErr: true,
        outStream: outputStream,
        errStream: errorStream
      }
      verify(azurePipelinesRunnerWrapper.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), deepEqual(options))).once()
    })
  })

  describe('getInput()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      when(azurePipelinesRunnerWrapper.getInput('TestSuffix')).thenReturn('VALUE')

      // Act
      const result: string | undefined = azurePipelinesRunnerInvoker.getInput(['Test', 'Suffix'])

      // Assert
      expect(result).to.equal('VALUE')
      verify(azurePipelinesRunnerWrapper.getInput('TestSuffix')).once()
    })
  })

  describe('locInitialize()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.locInitialize('/folder1/folder2/')

      // Assert
      verify(azurePipelinesRunnerWrapper.setResourcePath(path.join('/folder1/folder2/', 'task.json'))).once()
    })
  })

  describe('loc()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      when(azurePipelinesRunnerWrapper.loc('TEST %s %s', 'Parameter 1', 'Parameter 2')).thenReturn('VALUE')

      // Act
      const result: string = azurePipelinesRunnerInvoker.loc('TEST %s %s', 'Parameter 1', 'Parameter 2')

      // Assert
      expect(result).to.equal('VALUE')
      verify(azurePipelinesRunnerWrapper.loc('TEST %s %s', 'Parameter 1', 'Parameter 2')).once()
    })
  })

  describe('logDebug()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.logDebug('TEST')

      // Assert
      verify(azurePipelinesRunnerWrapper.debug('TEST')).once()
    })
  })

  describe('logError()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.logError('TEST')

      // Assert
      verify(azurePipelinesRunnerWrapper.error('TEST')).once()
    })
  })

  describe('logWarning()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.logWarning('TEST')

      // Assert
      verify(azurePipelinesRunnerWrapper.warning('TEST')).once()
    })
  })

  describe('setStatusFailed()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.setStatusFailed('TEST')

      // Assert
      verify(azurePipelinesRunnerWrapper.setResult(taskLib.TaskResult.Failed, 'TEST')).once()
    })
  })

  describe('setStatusSkipped()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.setStatusSkipped('TEST')

      // Assert
      verify(azurePipelinesRunnerWrapper.setResult(taskLib.TaskResult.Skipped, 'TEST')).once()
    })
  })

  describe('setStatusSucceeded()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.setStatusSucceeded('TEST')

      // Assert
      verify(azurePipelinesRunnerWrapper.setResult(taskLib.TaskResult.Succeeded, 'TEST')).once()
    })
  })
})
