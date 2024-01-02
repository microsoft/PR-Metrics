// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { expect } from 'chai'
import 'reflect-metadata'
import { instance, mock, verify } from 'ts-mockito'
import { GitWritableStream } from '../../src/git/gitWritableStream.js'
import Logger from '../../src/utilities/logger.js'

describe('gitWritableStream.ts', (): void => {
  let logger: Logger

  beforeEach((): void => {
    logger = mock(Logger)
  })

  describe('write()', (): void => {
    it('should return the empty string when never called', (): void => {
      // Arrange
      const gitWritableStream: GitWritableStream = new GitWritableStream(instance(logger))

      // Assert
      expect(gitWritableStream.message).to.equal('')
    })

    it('should log the expected message when called once', (): void => {
      // Arrange
      const gitWritableStream: GitWritableStream = new GitWritableStream(instance(logger))

      // Act
      const result: boolean = gitWritableStream.write('Message', (): void => {})

      // Assert
      expect(result).to.equal(true)
      expect(gitWritableStream.message).to.equal('Message')
      verify(logger.logDebug('Message')).once()
    })

    it('should log the expected message when called multiple times', (): void => {
      // Arrange
      const gitWritableStream: GitWritableStream = new GitWritableStream(instance(logger))

      // Act
      const result1: boolean = gitWritableStream.write('Message1', (): void => {})
      const result2: boolean = gitWritableStream.write('Message2', (): void => {})
      const result3: boolean = gitWritableStream.write('Message3', (): void => {})
      const result4: boolean = gitWritableStream.write('Message4', (): void => {})
      const result5: boolean = gitWritableStream.write('Message5', (): void => {})

      // Assert
      expect(result1).to.equal(true)
      expect(result2).to.equal(true)
      expect(result3).to.equal(true)
      expect(result4).to.equal(true)
      expect(result5).to.equal(true)
      expect(gitWritableStream.message).to.equal('Message1Message2Message3Message4Message5')
      verify(logger.logDebug('Message1')).once()
      verify(logger.logDebug('Message2')).once()
      verify(logger.logDebug('Message3')).once()
      verify(logger.logDebug('Message4')).once()
      verify(logger.logDebug('Message5')).once()
    })

    it('should skip logging a command message', (): void => {
      // Arrange
      const gitWritableStream: GitWritableStream = new GitWritableStream(instance(logger))

      // Act
      const result: boolean = gitWritableStream.write('[command]Message', (): void => {})

      // Assert
      expect(result).to.equal(true)
      expect(gitWritableStream.message).to.equal('')
      verify(logger.logDebug('[command]Message')).once()
    })

    it('should skip logging command messages interspersed with standard messages', (): void => {
      // Arrange
      const gitWritableStream: GitWritableStream = new GitWritableStream(instance(logger))

      // Act
      const result1: boolean = gitWritableStream.write('[command]Message1', (): void => {})
      const result2: boolean = gitWritableStream.write('Message1', (): void => {})
      const result3: boolean = gitWritableStream.write('[command]Message2', (): void => {})
      const result4: boolean = gitWritableStream.write('Message2', (): void => {})
      const result5: boolean = gitWritableStream.write('[command]Message3', (): void => {})
      const result6: boolean = gitWritableStream.write('Message3', (): void => {})
      const result7: boolean = gitWritableStream.write('[command]Message4', (): void => {})
      const result8: boolean = gitWritableStream.write('Message4', (): void => {})
      const result9: boolean = gitWritableStream.write('[command]Message5', (): void => {})

      // Assert
      expect(result1).to.equal(true)
      expect(result2).to.equal(true)
      expect(result3).to.equal(true)
      expect(result4).to.equal(true)
      expect(result5).to.equal(true)
      expect(result6).to.equal(true)
      expect(result7).to.equal(true)
      expect(result8).to.equal(true)
      expect(result9).to.equal(true)
      expect(gitWritableStream.message).to.equal('Message1Message2Message3Message4')
      verify(logger.logDebug('[command]Message1')).once()
      verify(logger.logDebug('Message1')).once()
      verify(logger.logDebug('[command]Message2')).once()
      verify(logger.logDebug('Message2')).once()
      verify(logger.logDebug('[command]Message3')).once()
      verify(logger.logDebug('Message3')).once()
      verify(logger.logDebug('[command]Message4')).once()
      verify(logger.logDebug('Message4')).once()
      verify(logger.logDebug('[command]Message5')).once()
    })
  })
})
