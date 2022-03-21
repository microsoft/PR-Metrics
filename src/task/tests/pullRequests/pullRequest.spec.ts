// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetrics from '../../src/metrics/codeMetrics'
import Logger from '../../src/utilities/logger'
import PullRequest from '../../src/pullRequests/pullRequest'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('pullRequest.ts', (): void => {
  let codeMetrics: CodeMetrics
  let logger: Logger
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    codeMetrics = mock(CodeMetrics)
    when(codeMetrics.getSizeIndicator()).thenResolve('S✔')

    logger = mock(Logger)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeIndicatorFormat', '(XS|S|M|L|\\d*XL)', '(✔|⚠️)?')).thenReturn('(XS|S|M|L|\\d*XL)(✔|⚠️)?')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeL')).thenReturn('L')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeM')).thenReturn('M')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeS')).thenReturn('S')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXL', '\\d*')).thenReturn('\\d*XL')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleSizeXS')).thenReturn('XS')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleTestsInsufficient')).thenReturn('⚠️')
    when(taskLibWrapper.loc('metrics.codeMetrics.titleTestsSufficient')).thenReturn('✔')
    when(taskLibWrapper.loc('pullRequests.pullRequest.addDescription')).thenReturn('❌ **Add a description.**')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', '')).thenReturn('S✔ ◾ ')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'PREFIX', '')).thenReturn('PREFIX ◾ ')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'Title')).thenReturn('S✔ ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'PREFIX', 'Title')).thenReturn('PREFIX ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'PREFIX ◾ Title')).thenReturn('S✔ ◾ PREFIX ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'PREFIX✔ ◾ Title')).thenReturn('S✔ ◾ PREFIX✔ ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'PREFIX⚠️ ◾ Title')).thenReturn('S✔ ◾ PREFIX⚠️ ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'PS ◾ Title')).thenReturn('S✔ ◾ PS ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'PS✔ ◾ Title')).thenReturn('S✔ ◾ PS✔ ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', 'S✔', 'PS⚠️ ◾ Title')).thenReturn('S✔ ◾ PS⚠️ ◾ Title')
    when(taskLibWrapper.loc('pullRequests.pullRequest.titleFormat', '(XS|S|M|L|\\d*XL)(✔|⚠️)?', '(.*)')).thenReturn('(XS|S|M|L|\\d*XL)(✔|⚠️)? ◾ (.*)')
  })

  describe('isPullRequest', (): void => {
    it('should return true when SYSTEM_PULLREQUEST_PULLREQUESTID is defined', (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = 'refs/heads/develop'
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* PullRequest.isPullRequest')).once()

      // Finalization
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    })

    it('should return false when SYSTEM_PULLREQUEST_PULLREQUESTID is not defined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* PullRequest.isPullRequest')).once()
    })
  })

  describe('isSupportedProvider', (): void => {
    it('should throw an error when BUILD_REPOSITORY_PROVIDER is undefined', (): void => {
      // Arrange
      delete process.env.BUILD_REPOSITORY_PROVIDER
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

      // Act
      const func: () => boolean | string = () => pullRequest.isSupportedProvider

      // Assert
      expect(func).to.throw('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'PullRequest.isSupportedProvider\', is invalid, null, or undefined \'undefined\'.')
      verify(logger.logDebug('* PullRequest.isSupportedProvider')).once()
    })

    async.each(
      [
        'TfsGit',
        'GitHub',
        'GitHubEnterprise'
      ], (provider: string): void => {
        it(`should return true when BUILD_REPOSITORY_PROVIDER is set to '${provider}'`, (): void => {
        // Arrange
          process.env.BUILD_REPOSITORY_PROVIDER = provider
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

          // Act
          const result: boolean | string = pullRequest.isSupportedProvider

          // Assert
          expect(result).to.equal(true)
          verify(logger.logDebug('* PullRequest.isSupportedProvider')).once()

          // Finalization
          delete process.env.BUILD_REPOSITORY_PROVIDER
        })
      })

    it('should return the provider when BUILD_REPOSITORY_PROVIDER is not set to TfsGit or GitHub', (): void => {
      // Arrange
      process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

      // Act
      const result: boolean | string = pullRequest.isSupportedProvider

      // Assert
      expect(result).to.equal('Other')
      verify(logger.logDebug('* PullRequest.isSupportedProvider')).once()

      // Finalization
      delete process.env.BUILD_REPOSITORY_PROVIDER
    })
  })

  describe('getUpdatedDescription()', (): void => {
    it('should return null when the current description is set', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedDescription('Description')

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* PullRequest.getUpdatedDescription()')).once()
    })

    async.each(
      [
        undefined,
        '',
        ' '
      ], (currentDescription: string | undefined): void => {
        it(`should return the default description when the current description '${currentDescription}' is empty`, (): void => {
          // Arrange
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

          // Act
          const result: string | null = pullRequest.getUpdatedDescription(currentDescription)

          // Assert
          expect(result).to.equal('❌ **Add a description.**')
          verify(logger.logDebug('* PullRequest.getUpdatedDescription()')).once()
        })
      })
  })

  describe('getUpdatedTitle()', (): void => {
    it('should return null when the current title is set to the expected title', async (): Promise<void> => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

      // Act
      const result: string | null = await pullRequest.getUpdatedTitle('S✔ ◾ Title')

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* PullRequest.getUpdatedTitle()')).once()
    })

    async.each(
      [
        'Title',
        'PREFIX ◾ Title',
        'PREFIX✔ ◾ Title',
        'PREFIX⚠️ ◾ Title',
        'PS ◾ Title',
        'PS✔ ◾ Title',
        'PS⚠️ ◾ Title'
      ], (currentTitle: string): void => {
        it(`should prefix the current title '${currentTitle}' when no prefix exists`, async (): Promise<void> => {
          // Arrange
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

          // Act
          const result: string | null = await pullRequest.getUpdatedTitle(currentTitle)

          // Assert
          expect(result).to.equal(`S✔ ◾ ${currentTitle}`)
          verify(logger.logDebug('* PullRequest.getUpdatedTitle()')).once()
        })
      })

    async.each(
      [
        'XS✔ ◾ Title',
        'XS⚠️ ◾ Title',
        'XS ◾ Title',
        'S✔ ◾ Title',
        'S⚠️ ◾ Title',
        'S ◾ Title',
        'M✔ ◾ Title',
        'M⚠️ ◾ Title',
        'M ◾ Title',
        'L✔ ◾ Title',
        'L⚠️ ◾ Title',
        'L ◾ Title',
        'XL✔ ◾ Title',
        'XL⚠️ ◾ Title',
        'XL ◾ Title',
        '2XL✔ ◾ Title',
        '2XL⚠️ ◾ Title',
        '2XL ◾ Title',
        '20XL✔ ◾ Title',
        '20XL⚠️ ◾ Title',
        '20XL ◾ Title'
      ], (currentTitle: string): void => {
        it(`should update the current title '${currentTitle}' correctly`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.getSizeIndicator()).thenResolve('PREFIX')
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(logger), instance(taskLibWrapper))

          // Act
          const result: string | null = await pullRequest.getUpdatedTitle(currentTitle)

          // Assert
          expect(result).to.equal('PREFIX ◾ Title')
          verify(logger.logDebug('* PullRequest.getUpdatedTitle()')).once()
        })
      })
  })
})
