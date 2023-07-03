// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { instance, mock, verify } from 'ts-mockito'
import RunnerInvoker from '../../src/runners/runnerInvoker'
import Logger from '../../src/utilities/logger'
import ConsoleWrapper from '../../src/wrappers/consoleWrapper'
import HttpError from '../testUtilities/httpError'

describe('logger.ts', (): void => {
  let consoleWrapper: ConsoleWrapper
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    consoleWrapper = mock(ConsoleWrapper)
    runnerInvoker = mock(RunnerInvoker)
  })

  describe('logDebug()', (): void => {
    it('should log the message', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))

      // Act
      logger.logDebug('Message')

      // Assert
      verify(runnerInvoker.logDebug('Message')).once()
    })
  })

  describe('logInfo()', (): void => {
    it('should log the message', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))

      // Act
      logger.logInfo('Message')

      // Assert
      verify(consoleWrapper.log('Message')).once()
    })
  })

  describe('logWarning()', (): void => {
    it('should log the message', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))

      // Act
      logger.logWarning('Message')

      // Assert
      verify(runnerInvoker.logWarning('Message')).once()
    })
  })

  describe('logError()', (): void => {
    it('should log the message', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))

      // Act
      logger.logError('Message')

      // Assert
      verify(runnerInvoker.logError('Message')).once()
    })
  })

  describe('logErrorObject()', (): void => {
    it('should log all properties of the error object', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))
      const error: Error = new Error('Message')
      error.name = 'Error'
      error.stack = 'Stack contents'

      // Act
      logger.logErrorObject(error)

      // Assert
      verify(consoleWrapper.log('Error – name: "Error"')).once()
      verify(consoleWrapper.log('Error – message: "Message"')).once()
      verify(consoleWrapper.log('Error – stack: "Stack contents"')).once()
    })

    it('should log all properties of a complex error object', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))
      const error: HttpError = new HttpError(404, 'Not Found')
      error.stack = 'Stack contents'

      // Act
      logger.logErrorObject(error)

      // Assert
      verify(consoleWrapper.log('HttpError – name: "HttpError"')).once()
      verify(consoleWrapper.log('HttpError – message: "Not Found"')).once()
      verify(consoleWrapper.log('HttpError – stack: "Stack contents"')).once()
      verify(consoleWrapper.log('HttpError – status: 404')).once()
    })
  })

  describe('replay()', (): void => {
    it('should replay all messages', (): void => {
      // Arrange
      const logger: Logger = new Logger(instance(consoleWrapper), instance(runnerInvoker))
      logger.logDebug('Debug Message 1')
      logger.logInfo('Info Message 1')
      logger.logWarning('Warning Message 1')
      logger.logError('Error Message 1')
      logger.logDebug('Debug Message 2')
      logger.logInfo('Info Message 2')
      logger.logWarning('Warning Message 2')
      logger.logError('Error Message 2')

      // Act
      logger.replay()

      // Assert
      verify(runnerInvoker.logDebug('Debug Message 1')).once()
      verify(consoleWrapper.log('Info Message 1')).once()
      verify(runnerInvoker.logWarning('Warning Message 1')).once()
      verify(runnerInvoker.logError('Error Message 1')).once()
      verify(runnerInvoker.logDebug('Debug Message 2')).once()
      verify(consoleWrapper.log('Info Message 2')).once()
      verify(runnerInvoker.logWarning('Warning Message 2')).once()
      verify(runnerInvoker.logError('Error Message 2')).once()
      verify(consoleWrapper.log('🔁 debug   – Debug Message 1')).once()
      verify(consoleWrapper.log('🔁 info    – Info Message 1')).once()
      verify(consoleWrapper.log('🔁 warning – Warning Message 1')).once()
      verify(consoleWrapper.log('🔁 error   – Error Message 1')).once()
      verify(consoleWrapper.log('🔁 debug   – Debug Message 2')).once()
      verify(consoleWrapper.log('🔁 info    – Info Message 2')).once()
      verify(consoleWrapper.log('🔁 warning – Warning Message 2')).once()
      verify(consoleWrapper.log('🔁 error   – Error Message 2')).once()
    })
  })
})
