// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import async from 'async'
import PullRequest from '../../updaters/pullRequest'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'

describe('pullRequest.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.pullRequest.addDescription')).thenReturn('❌ **Add a description.**')
    when(taskLibWrapper.loc('updaters.pullRequest.titleFormat', '(XS|S|M|L|\\d*XL)(✔|⚠️)?', '(.*)')).thenReturn('(XS|S|M|L|\\d*XL)(✔|⚠️)? ◾ (.*)')
    when(taskLibWrapper.loc('updaters.pullRequest.titleSizeIndicatorFormat', '(XS|S|M|L|\\d*XL)', '(✔|⚠️)?')).thenReturn('(XS|S|M|L|\\d*XL)(✔|⚠️)?')
    when(taskLibWrapper.loc('updaters.pullRequest.titleSizeL')).thenReturn('L')
    when(taskLibWrapper.loc('updaters.pullRequest.titleSizeM')).thenReturn('M')
    when(taskLibWrapper.loc('updaters.pullRequest.titleSizeS')).thenReturn('S')
    when(taskLibWrapper.loc('updaters.pullRequest.titleSizeXL', '\\d*')).thenReturn('\\d*XL')
    when(taskLibWrapper.loc('updaters.pullRequest.titleSizeXS')).thenReturn('XS')
    when(taskLibWrapper.loc('updaters.pullRequest.titleTestsInsufficient')).thenReturn('⚠️')
    when(taskLibWrapper.loc('updaters.pullRequest.titleTestsSufficient')).thenReturn('✔')
  })

  describe('isPullRequest()', (): void => {
    it('should return true when SYSTEM_PULLREQUEST_PULLREQUESTID is defined', (): void => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = 'refs/heads/develop'
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest()

      // Assert
      expect(result).to.equal(true)
      verify(taskLibWrapper.debug('* PullRequest.isPullRequest()')).once()

      // Finalization
      delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTID
    })

    it('should return false when SYSTEM_PULLREQUEST_PULLREQUESTID is not defined', (): void => {
      // Arrange
      delete process.env.SYSTEM_PULLREQUEST_TARGETBRANCH
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: boolean = pullRequest.isPullRequest()

      // Assert
      expect(result).to.equal(false)
      verify(taskLibWrapper.debug('* PullRequest.isPullRequest()')).once()
    })
  })

  describe('getUpdatedDescription()', (): void => {
    it('should return null when the current description is set', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedDescription('Description')

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')).once()
    })

    it('should return the default description when the current description is empty', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedDescription('')

      // Assert
      expect(result).to.equal('❌ **Add a description.**')
      verify(taskLibWrapper.debug('* PullRequest.getUpdatedDescription()')).once()
    })
  })

  describe('getUpdatedTitle()', (): void => {
    it('should return null when the current title is set to the expected title', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: string | null = pullRequest.getUpdatedTitle('S✔ ◾ Title', 'S✔')

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
          const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

          // Act
          const result: string | null = pullRequest.getUpdatedTitle(currentTitle, 'S✔')

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
          const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

          // Act
          const result: string | null = pullRequest.getUpdatedTitle(currentTitle, 'PREFIX')

          // Assert
          expect(result).to.equal('PREFIX ◾ Title')
          verify(taskLibWrapper.debug('* PullRequest.getUpdatedTitle()')).once()
        })
      })
  })

  describe('getCurrentIteration()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequest: PullRequest = new PullRequest(instance(taskLibWrapper))

      // Act
      const result: number = pullRequest.getCurrentIteration()

      // Assert
      expect(result).to.equal(1)
      verify(taskLibWrapper.debug('* PullRequest.getCurrentIteration()')).once()
    })
  })
})
