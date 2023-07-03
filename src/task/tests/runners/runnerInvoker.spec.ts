// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import 'reflect-metadata'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { GitWritableStream } from '../../src/git/gitWritableStream'
import AzurePipelinesRunnerInvoker from '../../src/runners/azurePipelinesRunnerInvoker'
import GitHubRunnerInvoker from '../../src/runners/gitHubRunnerInvoker'
import RunnerInvoker from '../../src/runners/runnerInvoker'
import Logger from '../../src/utilities/logger'

describe('runnerInvoker.ts', function (): void {
  let azurePipelinesRunnerInvoker: AzurePipelinesRunnerInvoker
  let gitHubRunnerInvoker: GitHubRunnerInvoker

  beforeEach((): void => {
    azurePipelinesRunnerInvoker = mock(AzurePipelinesRunnerInvoker)
    gitHubRunnerInvoker = mock(GitHubRunnerInvoker)
  })

  describe('isGitHub()', (): void => {
    it('should return false when running on Azure Pipelines', async (): Promise<void> => {
      // Act
      const result: boolean = RunnerInvoker.isGitHub

      // Assert
      expect(result).to.equal(false)
    })

    it('should return true when running on GitHub', async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'

      // Act
      const result: boolean = RunnerInvoker.isGitHub

      // Assert
      expect(result).to.equal(true)

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('exec()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', async (): Promise<void> => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(instance(logger))
      const errorStream: GitWritableStream = new GitWritableStream(instance(logger))
      when(azurePipelinesRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, anything(), anything())).thenResolve(1)

      // Act
      const result: number = await runnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      expect(result).to.equal(1)
      verify(azurePipelinesRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, outputStream, errorStream)).once()
      verify(gitHubRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, outputStream, errorStream)).never()
    })

    it('should call the underlying method when running on GitHub', async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(instance(logger))
      const errorStream: GitWritableStream = new GitWritableStream(instance(logger))
      when(gitHubRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, anything(), anything())).thenResolve(1)

      // Act
      const result: number = await runnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      expect(result).to.equal(1)
      verify(azurePipelinesRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, outputStream, errorStream)).never()
      verify(gitHubRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, outputStream, errorStream)).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })

    it('should call the underlying method each time when running on GitHub', async (): Promise<void> => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      const logger: Logger = mock(Logger)
      const outputStream: GitWritableStream = new GitWritableStream(instance(logger))
      const errorStream: GitWritableStream = new GitWritableStream(instance(logger))
      when(gitHubRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, anything(), anything())).thenResolve(1)

      // Act
      const result1: number = await runnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)
      const result2: number = await runnerInvoker.exec('TOOL', ['Argument 1', 'Argument 2'], true, outputStream, errorStream)

      // Assert
      expect(result1).to.equal(1)
      expect(result2).to.equal(1)
      verify(azurePipelinesRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, outputStream, errorStream)).never()
      verify(gitHubRunnerInvoker.exec('TOOL', deepEqual(['Argument 1', 'Argument 2']), true, outputStream, errorStream)).twice()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('getInput()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      when(azurePipelinesRunnerInvoker.getInput(deepEqual(['Test', 'Suffix']))).thenReturn('VALUE')

      // Act
      const result: string | undefined = runnerInvoker.getInput(['Test', 'Suffix'])

      // Assert
      expect(result).to.equal('VALUE')
      verify(azurePipelinesRunnerInvoker.getInput(deepEqual(['Test', 'Suffix']))).once()
      verify(gitHubRunnerInvoker.getInput(deepEqual(['Test', 'Suffix']))).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      when(gitHubRunnerInvoker.getInput(deepEqual(['Test', 'Suffix']))).thenReturn('VALUE')

      // Act
      const result: string | undefined = runnerInvoker.getInput(['Test', 'Suffix'])

      // Assert
      expect(result).to.equal('VALUE')
      verify(azurePipelinesRunnerInvoker.getInput(deepEqual(['Test', 'Suffix']))).never()
      verify(gitHubRunnerInvoker.getInput(deepEqual(['Test', 'Suffix']))).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('locInitialize()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.locInitialize('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.locInitialize('TEST')).once()
      verify(gitHubRunnerInvoker.locInitialize('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.locInitialize('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.locInitialize('TEST')).never()
      verify(gitHubRunnerInvoker.locInitialize('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })

    it('should throw when locInitialize is called twice', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.locInitialize('TEST')
      const func: () => void = () => runnerInvoker.locInitialize('TEST')

      // Assert
      expect(func).to.throw('RunnerInvoker.locInitialize must not be called multiple times.')
    })
  })

  describe('loc()', (): void => {
    it('should throw when locInitialize is not called beforehand', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      const func: () => void = () => runnerInvoker.loc('TEST')

      // Assert
      expect(func).to.throw('RunnerInvoker.locInitialize must be called before RunnerInvoker.loc.')
    })

    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      runnerInvoker.locInitialize('TEST')
      when(azurePipelinesRunnerInvoker.loc('TEST')).thenReturn('VALUE')

      // Act
      const result: string = runnerInvoker.loc('TEST')

      // Assert
      expect(result).to.equal('VALUE')
      verify(azurePipelinesRunnerInvoker.loc('TEST')).once()
      verify(gitHubRunnerInvoker.loc('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))
      runnerInvoker.locInitialize('TEST')
      when(gitHubRunnerInvoker.loc('TEST')).thenReturn('VALUE')

      // Act
      const result: string = runnerInvoker.loc('TEST')

      // Assert
      expect(result).to.equal('VALUE')
      verify(azurePipelinesRunnerInvoker.loc('TEST')).never()
      verify(gitHubRunnerInvoker.loc('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('logDebug()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.logDebug('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.logDebug('TEST')).once()
      verify(gitHubRunnerInvoker.logDebug('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.logDebug('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.logDebug('TEST')).never()
      verify(gitHubRunnerInvoker.logDebug('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('logError()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.logError('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.logError('TEST')).once()
      verify(gitHubRunnerInvoker.logError('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.logError('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.logError('TEST')).never()
      verify(gitHubRunnerInvoker.logError('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('logWarning()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.logWarning('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.logWarning('TEST')).once()
      verify(gitHubRunnerInvoker.logWarning('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.logWarning('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.logWarning('TEST')).never()
      verify(gitHubRunnerInvoker.logWarning('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('setStatusFailed()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.setStatusFailed('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusFailed('TEST')).once()
      verify(gitHubRunnerInvoker.setStatusFailed('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.setStatusFailed('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusFailed('TEST')).never()
      verify(gitHubRunnerInvoker.setStatusFailed('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('setStatusSkipped()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.setStatusSkipped('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSkipped('TEST')).once()
      verify(gitHubRunnerInvoker.setStatusSkipped('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.setStatusSkipped('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSkipped('TEST')).never()
      verify(gitHubRunnerInvoker.setStatusSkipped('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })

  describe('setStatusSucceeded()', (): void => {
    it('should call the underlying method when running on Azure Pipelines', (): void => {
      // Arrange
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.setStatusSucceeded('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSucceeded('TEST')).once()
      verify(gitHubRunnerInvoker.setStatusSucceeded('TEST')).never()
    })

    it('should call the underlying method when running on GitHub', (): void => {
      // Arrange
      process.env.GITHUB_ACTION = 'PR-Metrics'
      const runnerInvoker: RunnerInvoker = new RunnerInvoker(instance(azurePipelinesRunnerInvoker), instance(gitHubRunnerInvoker))

      // Act
      runnerInvoker.setStatusSucceeded('TEST')

      // Assert
      verify(azurePipelinesRunnerInvoker.setStatusSucceeded('TEST')).never()
      verify(gitHubRunnerInvoker.setStatusSucceeded('TEST')).once()

      // Finalization
      delete process.env.GITHUB_ACTION
    })
  })
})
