// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { deepEqual, instance, mock, verify } from 'ts-mockito'
import { GitWritableStream } from '../../src/git/gitWritableStream'
import * as actionsExec from '@actions/exec'
import ConsoleWrapper from '../../src/wrappers/consoleWrapper'
import GitHubRunnerInvoker from '../../src/runners/gitHubRunnerInvoker'
import GitHubRunnerWrapper from '../../src/wrappers/gitHubRunnerWrapper'
import Logger from '../../src/utilities/logger'

describe('gitHubRunnerInvoker.ts', function (): void {
  let consoleWrapper: ConsoleWrapper
  let gitHubRunnerWrapper: GitHubRunnerWrapper

  beforeEach((): void => {
    consoleWrapper = mock(ConsoleWrapper)
    gitHubRunnerWrapper = mock(GitHubRunnerWrapper)
  })

  describe('exec()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(logger)
      const errorStream: GitWritableStream = new GitWritableStream(logger)

      // Act
      gitHubRunnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      const options: actionsExec.ExecOptions = {
        failOnStdErr: true,
        outStream: outputStream,
        errStream: errorStream
      }
      verify(gitHubRunnerWrapper.exec('TOOL', ['Argument 1', 'Argument 2'], deepEqual(options))).once()
    })
  })

  describe('getInput()', (): void => {
    it('should call the underlying method', (): void => {
      // Arrange
      const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

      // Act
      gitHubRunnerInvoker.getInput(['Test', 'Suffix'])

      // Assert
      verify(gitHubRunnerWrapper.getInput('test-suffix')).once()
    })
  })

  // describe('locInitialize()', (): void => {
  //   it('should call the underlying method', (): void => {
  //     // Arrange
  //     const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

  //     // Act
  //     gitHubRunnerInvoker.locInitialize('/folder1/folder2/')

  //     // Assert
  //     verify(gitHubRunnerWrapper.setResourcePath('/folder1/folder2/task.json')).once()
  //   })
  // })

  // describe('loc()', (): void => {
  //   it('should call the underlying method', (): void => {
  //     // Arrange
  //     const gitHubRunnerInvoker: GitHubRunnerInvoker = new GitHubRunnerInvoker(instance(consoleWrapper), instance(gitHubRunnerWrapper))

  //     // Act
  //     gitHubRunnerInvoker.loc('TEST %s %s', 'Parameter 1', 'Parameter 2')

  //     // Assert
  //     verify(gitHubRunnerWrapper.loc('TEST %s %s', 'Parameter 1', 'Parameter 2')).once()
  //   })
  // })

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
