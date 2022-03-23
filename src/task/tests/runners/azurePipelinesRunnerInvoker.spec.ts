// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { deepEqual, instance, mock, verify } from 'ts-mockito'
import { GitWritableStream } from '../../src/git/gitWritableStream'
import { IExecOptions } from 'azure-pipelines-task-lib/toolrunner'
import * as taskLib from 'azure-pipelines-task-lib/task'
import AzurePipelinesRunnerInvoker from '../../src/runners/azurePipelinesRunnerInvoker'
import AzurePipelinesRunnerWrapper from '../../src/wrappers/azurePipelinesRunnerWrapper'
import Logger from '../../src/utilities/logger'

describe('azurePipelinesRunnerInvoker.ts', function (): void {
  let azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper

  beforeEach((): void => {
    azurePipelinesRunnerWrapper = mock(AzurePipelinesRunnerWrapper)
  })

  describe('exec()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(logger)
      const errorStream: GitWritableStream = new GitWritableStream(logger)

      // Act
      azurePipelinesRunnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      const options: IExecOptions = {
        failOnStdErr: true,
        outStream: outputStream,
        errStream: errorStream
      }
      verify(azurePipelinesRunnerWrapper.exec('TOOL', ['Argument 1', 'Argument 2'], deepEqual(options))).once()
    })
  })

  describe('getInput()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.getInput(['Test', 'Suffix'])

      // Assert
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
      verify(azurePipelinesRunnerWrapper.setResourcePath('/folder1/folder2/task.json')).once()
    })
  })

  describe('loc()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.loc('TEST %s %s', 'Parameter 1', 'Parameter 2')

      // Assert
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
