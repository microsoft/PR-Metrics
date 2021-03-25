// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetrics from '../../updaters/codeMetrics'
import PullRequest from '../../updaters/pullRequest'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'

describe('pullRequest.ts', (): void => {
  let codeMetrics: CodeMetrics
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    codeMetrics = mock(CodeMetrics)
    when(codeMetrics.sizeIndicator).thenReturn('S✔')

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeIndicatorFormat', '(XS|S|M|L|\\d*XL)', '(✔|⚠️)?')).thenReturn('(XS|S|M|L|\\d*XL)(✔|⚠️)?')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeL')).thenReturn('L')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeM')).thenReturn('M')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeS')).thenReturn('S')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeXL', '\\d*')).thenReturn('\\d*XL')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleSizeXS')).thenReturn('XS')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleTestsInsufficient')).thenReturn('⚠️')
    when(taskLibWrapper.loc('updaters.codeMetrics.titleTestsSufficient')).thenReturn('✔')
    when(taskLibWrapper.loc('updaters.pullRequest.addDescription')).thenReturn('❌ **Add a description.**')
    when(taskLibWrapper.loc('updaters.pullRequest.titleFormat', '(XS|S|M|L|\\d*XL)(✔|⚠️)?', '(.*)')).thenReturn('(XS|S|M|L|\\d*XL)(✔|⚠️)? ◾ (.*)')
  })

  describe('isPullRequest', (): void => {
    it('should return true when SYSTEM_PULLREQUEST_PULLREQUESTID is defined', (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = 'refs/heads/develop'
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* PullRequest.isPullRequest')).once()

      // Finalization
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    })

    it('should return false when SYSTEM_PULLREQUEST_PULLREQUESTID is not defined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest

      // Assert
      expect(result).to.equal(false)
      verify(taskLibWrapper.debug('* PullRequest.isPullRequest')).once()
    })
  })

  describe('getUpdatedDescription()', (): void => {
    it('should return null when the current description is set', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedDescription('Description')

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')).once()
    })

    async.each(
      [
        undefined,
        '',
        ' '
      ], (currentDescription: string | undefined): void => {
        it(`should return the default description when the current description '${currentDescription}' is empty`, (): void => {
          // Arrange
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

          // Act
          const result: string | null = pullRequest.getUpdatedDescription(currentDescription)

          // Assert
          expect(result).to.equal('❌ **Add a description.**')
          verify(taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')).once()
        })
      })
  })

  describe('getUpdatedTitle()', (): void => {
    it('should return null when the current title is set to the expected title', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedTitle('S✔ ◾ Title')

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')).once()
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
        it(`should prefix the current title '${currentTitle}' when no prefix exists`, (): void => {
          // Arrange
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

          // Act
          const result: string | null = pullRequest.getUpdatedTitle(currentTitle)

          // Assert
          expect(result).to.equal(`S✔ ◾ ${currentTitle}`)
          verify(taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')).once()
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
        it(`should update the current title '${currentTitle}' correctly`, (): void => {
          // Arrange
          when(codeMetrics.sizeIndicator).thenReturn('PREFIX')
          const pullRequest: PullRequest = new PullRequest(instance(codeMetrics), instance(taskLibWrapper))

          // Act
          const result: string | null = pullRequest.getUpdatedTitle(currentTitle)

          // Assert
          expect(result).to.equal('PREFIX ◾ Title')
          verify(taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')).once()
        })
      })
  })
})
