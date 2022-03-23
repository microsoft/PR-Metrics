// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import { GitWritableStream } from '../../src/git/gitWritableStream'
import * as actionsExec from '@actions/exec'
import * as path from 'path'
import ConsoleWrapper from '../../src/wrappers/consoleWrapper'
import GitHubRunnerInvoker from '../../src/runners/gitHubRunnerInvoker'
import GitHubRunnerWrapper from '../../src/wrappers/gitHubRunnerWrapper'
import Logger from '../../src/utilities/logger'

describe('gitHubRunnerInvoker.ts', function (): void {
  const resourcePath: string = path.join(__dirname, '../../Strings/resources.resjson/en-US/')

  let consoleWrapper: ConsoleWrapper
  let gitHubRunnerWrapper: GitHubRunnerWrapper

  beforeEach((): void => {
    consoleWrapper = mock(ConsoleWrapper)
    gitHubRunnerWrapper = mock(GitHubRunnerWrapper)
  })

  describe('exec()', (): void => {
    it('should call the underlying method', async (): Promise<void> => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(instance(logger))
      const errorStream: GitWritableStream = new GitWritableStream(instance(logger))
      when(gitHubRunnerWrapper.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), anything())).thenResolve(1)

      // Act
      const result: number = await gitHubRunnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      expect(result).to.equal(1)
      const options: actionsExec.ExecOptions = {
        failOnStdErr: true,
        outStream: outputStream,
        errStream: errorStream
      }
      verify(gitHubRunnerWrapper.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), deepEqual(options))).once()
    })
  })

  describe('getInput()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))
      when(gitHubRunnerWrapper.getInput('test-suffix')).thenReturn('VALUE')

      // Act
      const result: string | undefined = gitHubRunnerInvoker.getInput(['Test', 'Suffix'])

      // Assert
      expect(result).to.equal('VALUE')
      verify(gitHubRunnerWrapper.getInput('test-suffix')).once()
    })
  })

  describe('locInitialize()', (): void => {
    it('should succeed', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      const func: () => void = () => gitHubRunnerInvoker.locInitialize(resourcePath)

      // Assert
      expect(func).to.not.throw()
    })
  })

  describe('loc()', (): void => {
    it('should retrieve the correct resource when no placeholders are present', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))
      gitHubRunnerInvoker.locInitialize(resourcePath)

      // Act
      const result: string = gitHubRunnerInvoker.loc('metrics.codeMetrics.titleSizeL')

      // Assert
      expect(result).to.equal('L')
    })

    it('should retrieve and format the correct resource when placeholders are present', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))
      gitHubRunnerInvoker.locInitialize(resourcePath)

      // Act
      const result: string = gitHubRunnerInvoker.loc('metrics.codeMetrics.titleSizeIndicatorFormat', 'Parameter 1', '[Parameter 2]')

      // Assert
      expect(result).to.equal('Parameter 1[Parameter 2]')
    })
  })

  describe('logDebug()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.logDebug('TEST')

      // Assert
      verify(gitHubRunnerWrapper.debug('TEST')).once()
    })
  })

  describe('logError()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.logError('TEST')

      // Assert
      verify(gitHubRunnerWrapper.error('TEST')).once()
    })
  })

  describe('logWarning()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.logWarning('TEST')

      // Assert
      verify(gitHubRunnerWrapper.warning('TEST')).once()
    })
  })

  describe('setStatusFailed()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.setStatusFailed('TEST')

      // Assert
      verify(gitHubRunnerWrapper.setFailed('TEST')).once()
    })
  })

  describe('setStatusSkipped()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.setStatusSkipped('TEST')

      // Assert
      verify(consoleWrapper.log('TEST')).once()
    })
  })

  describe('setStatusSucceeded()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.setStatusSucceeded('TEST')

      // Assert
      verify(consoleWrapper.log('TEST')).once()
    })
  })
})
