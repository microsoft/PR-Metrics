/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import 'reflect-metadata'
import * as path from 'path'
import * as taskLib from 'azure-pipelines-task-lib/task'
import { IExecOptions, IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import { deepEqual, instance, mock, verify, when } from 'ts-mockito'
import AzurePipelinesRunnerInvoker from '../../src/runners/azurePipelinesRunnerInvoker'
import AzurePipelinesRunnerWrapper from '../../src/wrappers/azurePipelinesRunnerWrapper'
import { EndpointAuthorization } from '../../src/runners/endpointAuthorization'
import { ExecOutput } from '@actions/exec'
import { any } from '../testUtilities/mockito'
import assert from 'node:assert/strict'

describe('azurePipelinesRunnerInvoker.ts', (): void => {
  let azurePipelinesRunnerWrapper: AzurePipelinesRunnerWrapper

  beforeEach((): void => {
    azurePipelinesRunnerWrapper = mock(AzurePipelinesRunnerWrapper)
  })

  describe('exec()', (): void => {
    it('should call the underlying method', async (): Promise<void> => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      const execResult: IExecSyncResult = {
        code: 1,
        error: Error('Error'),
        stderr: 'Error',
        stdout: 'Output'
      }
      when(azurePipelinesRunnerWrapper.execSync('TOOL', 'Argument1 Argument2', any())).thenReturn(execResult)

      // Act
      const result: ExecOutput = await azurePipelinesRunnerInvoker.exec('TOOL', 'Argument1 Argument2')

      // Assert
      assert.equal(result.exitCode, 1)
      assert.equal(result.stderr, 'Error')
      assert.equal(result.stdout, 'Output')
      const options: IExecOptions = {
        failOnStdErr: true,
        silent: true
      }
      verify(azurePipelinesRunnerWrapper.execSync('TOOL', 'Argument1 Argument2', deepEqual(options))).once()
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
      assert.equal(result, 'VALUE')
      verify(azurePipelinesRunnerWrapper.getInput('TestSuffix')).once()
    })
  })

  describe('getEndpointAuthorization()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      const endpointAuthorization: taskLib.EndpointAuthorization = {
        parameters: {
          key: 'value'
        },
        scheme: 'scheme'
      }
      when(azurePipelinesRunnerWrapper.getEndpointAuthorization('id', true)).thenReturn(endpointAuthorization)

      // Act
      const result: EndpointAuthorization | undefined = azurePipelinesRunnerInvoker.getEndpointAuthorization('id')

      // Assert
      assert.deepEqual(result?.parameters, endpointAuthorization.parameters)
      assert.equal(result.scheme, endpointAuthorization.scheme)
      verify(azurePipelinesRunnerWrapper.getEndpointAuthorization('id', true)).once()
    })

    it('should call the underlying method and pass undefined to the caller', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      when(azurePipelinesRunnerWrapper.getEndpointAuthorization('id', true)).thenReturn(undefined)

      // Act
      const result: EndpointAuthorization | undefined = azurePipelinesRunnerInvoker.getEndpointAuthorization('id')

      // Assert
      assert.equal(result, undefined)
      verify(azurePipelinesRunnerWrapper.getEndpointAuthorization('id', true)).once()
    })
  })

  describe('getEndpointAuthorizationScheme()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      when(azurePipelinesRunnerWrapper.getEndpointAuthorizationScheme('id', true)).thenReturn('VALUE')

      // Act
      const result: string | undefined = azurePipelinesRunnerInvoker.getEndpointAuthorizationScheme('id')

      // Assert
      assert.equal(result, 'VALUE')
      verify(azurePipelinesRunnerWrapper.getEndpointAuthorizationScheme('id', true)).once()
    })
  })

  describe('getEndpointAuthorizationParameter()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))
      when(azurePipelinesRunnerWrapper.getEndpointAuthorizationParameter('id', 'key', true)).thenReturn('VALUE')

      // Act
      const result: string | undefined = azurePipelinesRunnerInvoker.getEndpointAuthorizationParameter('id', 'key')

      // Assert
      assert.equal(result, 'VALUE')
      verify(azurePipelinesRunnerWrapper.getEndpointAuthorizationParameter('id', 'key', true)).once()
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
      assert.equal(result, 'VALUE')
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

  describe('setSecret()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker = new AzurePipelinesRunnerInvoker(instance(azurePipelinesRunnerWrapper))

      // Act
      azurePipelinesRunnerInvoker.setSecret('value')

      // Assert
      verify(azurePipelinesRunnerWrapper.setSecret('value')).once()
    })
  })
})
