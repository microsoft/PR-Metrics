// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import async from 'async'
import AzureReposInvoker from '../invokers/azureReposInvoker'
import CodeMetrics from '../updaters/codeMetrics'
import CodeMetricsCalculator from '../codeMetricsCalculator'
import CodeMetricsData from '../updaters/codeMetricsData'
import IPullRequestMetadata from '../invokers/iPullRequestMetadata'
import PullRequest from '../updaters/pullRequest'
import PullRequestComments from '../updaters/pullRequestComments'
import PullRequestCommentsData from '../updaters/pullRequestCommentsData'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

describe('codeMetricsCalculator.ts', (): void => {
  let azureReposInvoker: AzureReposInvoker
  let codeMetrics: CodeMetrics
  let pullRequest: PullRequest
  let pullRequestComments: PullRequestComments
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker)
    when(azureReposInvoker.isAccessTokenAvailable).thenReturn(true)

    codeMetrics = mock(CodeMetrics)

    pullRequest = mock(PullRequest)
    when(pullRequest.isPullRequest).thenReturn(true)

    pullRequestComments = mock(PullRequestComments)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('codeMetricsCalculator.noAccessToken')).thenReturn('Could not access the OAuth token. Enable the option \'Allow scripts to access OAuth token\' under the build process phase settings.')
    when(taskLibWrapper.loc('codeMetricsCalculator.noPullRequest')).thenReturn('The build is not running against a pull request. Canceling task with warning.')
  })

  describe('shouldSkip', (): void => {
    it('should return null when the task should not be skipped', (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldSkip')).once()
    })

    it('should return the appropriate message when not a pull request', (): void => {
      // Arrange
      when(pullRequest.isPullRequest).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal('The build is not running against a pull request. Canceling task with warning.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldSkip')).once()
    })
  })

  describe('shouldTerminate', (): void => {
    it('should return null when the task should not terminate', (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldTerminate

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldTerminate')).once()
    })

    it('should return the appropriate message when no access token is available', (): void => {
      // Arrange
      when(azureReposInvoker.isAccessTokenAvailable).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldTerminate

      // Assert
      expect(result).to.equal('Could not access the OAuth token. Enable the option \'Allow scripts to access OAuth token\' under the build process phase settings.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldTerminate')).once()
    })
  })

  describe('updateDetails()', (): void => {
    it('should perform the expected actions', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getTitleAndDescription()).thenResolve({ title: 'Title', description: 'Description' })
      when(pullRequest.getUpdatedTitle('Title')).thenReturn('S✔ ◾ TODO')
      when(pullRequest.getUpdatedDescription('Description')).thenReturn('Description')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      await codeMetricsCalculator.updateDetails()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateDetails()')).once()
      verify(pullRequest.getUpdatedTitle('Title')).once()
      verify(pullRequest.getUpdatedDescription('Description')).once()
      verify(azureReposInvoker.setTitleAndDescription('S✔ ◾ TODO', 'Description')).once()
    })

    it('should perform the expected actions when the description is missing', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getTitleAndDescription()).thenResolve({ title: 'Title' })
      when(pullRequest.getUpdatedTitle('Title')).thenReturn('S✔ ◾ TODO')
      when(pullRequest.getUpdatedDescription(undefined)).thenReturn('Description')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      await codeMetricsCalculator.updateDetails()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateDetails()')).once()
      verify(pullRequest.getUpdatedTitle('Title')).once()
      verify(pullRequest.getUpdatedDescription(undefined)).once()
      verify(azureReposInvoker.setTitleAndDescription('S✔ ◾ TODO', 'Description')).once()
    })
  })

  describe('updateComments()', (): void => {
    it('should succeed when no comment updates are necessary', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      commentData.isMetricsCommentPresent = true
      when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
    })

    it('should perform the expected actions when the metrics comment is to be updated', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      commentData.metricsCommentThreadId = 1
      commentData.metricsCommentId = 2
      when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
      when(pullRequestComments.getMetricsComment(1)).thenReturn('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenReturn(CommentThreadStatus.Active)
      when(codeMetrics.metrics).thenReturn(new CodeMetricsData(1, 2, 4))
      when(codeMetrics.size).thenReturn('S')
      when(codeMetrics.isSufficientlyTested).thenReturn(true)
      const expectedMetadata: IPullRequestMetadata[] = [
        {
          key: 'Size',
          value: 'S'
        },
        {
          key: 'ProductCode',
          value: 1
        },
        {
          key: 'TestCode',
          value: 2
        },
        {
          key: 'Subtotal',
          value: 3
        },
        {
          key: 'IgnoredCode',
          value: 4
        },
        {
          key: 'Total',
          value: 7
        },
        {
          key: 'TestCoverage',
          value: true
        }
      ]
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateMetricsComment()')).once()
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.addMetadata()')).once()
      verify(azureReposInvoker.createComment('Description', 1, 2)).once()
      verify(azureReposInvoker.setCommentThreadStatus(1, CommentThreadStatus.Active)).once()
      verify(azureReposInvoker.addMetadata(deepEqual(expectedMetadata))).once()
    })

    it('should perform the expected actions when the metrics comment is to be updated and test coverage is excluded', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      commentData.metricsCommentThreadId = 1
      commentData.metricsCommentId = 2
      when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
      when(pullRequestComments.getMetricsComment(1)).thenReturn('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenReturn(CommentThreadStatus.Active)
      when(codeMetrics.metrics).thenReturn(new CodeMetricsData(1, 2, 4))
      when(codeMetrics.size).thenReturn('S')
      when(codeMetrics.isSufficientlyTested).thenReturn(null)
      const expectedMetadata: IPullRequestMetadata[] = [
        {
          key: 'Size',
          value: 'S'
        },
        {
          key: 'ProductCode',
          value: 1
        },
        {
          key: 'TestCode',
          value: 2
        },
        {
          key: 'Subtotal',
          value: 3
        },
        {
          key: 'IgnoredCode',
          value: 4
        },
        {
          key: 'Total',
          value: 7
        }
      ]
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateMetricsComment()')).once()
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.addMetadata()')).once()
      verify(azureReposInvoker.createComment('Description', 1, 2)).once()
      verify(azureReposInvoker.setCommentThreadStatus(1, CommentThreadStatus.Active)).once()
      verify(azureReposInvoker.addMetadata(deepEqual(expectedMetadata))).once()
    })

    it('should perform the expected actions when the metrics comment is to be updated and there is no existing thread', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
      when(pullRequestComments.getMetricsComment(1)).thenReturn('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenReturn(CommentThreadStatus.Active)
      when(codeMetrics.metrics).thenReturn(new CodeMetricsData(1, 2, 4))
      when(codeMetrics.size).thenReturn('S')
      when(codeMetrics.isSufficientlyTested).thenReturn(true)
      const expectedMetadata: IPullRequestMetadata[] = [
        {
          key: 'Size',
          value: 'S'
        },
        {
          key: 'ProductCode',
          value: 1
        },
        {
          key: 'TestCode',
          value: 2
        },
        {
          key: 'Subtotal',
          value: 3
        },
        {
          key: 'IgnoredCode',
          value: 4
        },
        {
          key: 'Total',
          value: 7
        },
        {
          key: 'TestCoverage',
          value: true
        }
      ]
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateMetricsComment()')).once()
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.addMetadata()')).once()
      verify(azureReposInvoker.createCommentThread('Description', CommentThreadStatus.Active)).once()
      verify(azureReposInvoker.addMetadata(deepEqual(expectedMetadata))).once()
    })

    async.each(
      [
        [['file1.ts'], [], 1, 0, 0, 0],
        [['file1.ts', 'file2.ts'], [], 1, 1, 0, 0],
        [[], ['file3.ts'], 0, 0, 1, 0],
        [[], ['file3.ts', 'file4.ts'], 0, 0, 1, 1],
        [['file1.ts'], ['file3.ts'], 1, 0, 1, 0],
        [['file1.ts', 'file2.ts'], ['file3.ts', 'file4.ts'], 1, 1, 1, 1]
      ], (data: [string[], string[], number, number, number, number]): void => {
        it(`should succeed when comments are to be added to ignored files '${JSON.stringify(data[0])}' and '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
          const commentData: PullRequestCommentsData = new PullRequestCommentsData(data[0], data[1])
          commentData.isMetricsCommentPresent = true
          when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
          when(pullRequestComments.ignoredComment).thenReturn('Ignored')
          const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

          // Act
          await codeMetricsCalculator.updateComments()

          // Assert
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateIgnoredComment()')).times(data[2] + data[3] + data[4] + data[5])
          verify(azureReposInvoker.createCommentThread('Ignored', CommentThreadStatus.Closed, 'file1.ts', true)).times(data[2])
          verify(azureReposInvoker.createCommentThread('Ignored', CommentThreadStatus.Closed, 'file2.ts', true)).times(data[3])
          verify(azureReposInvoker.createCommentThread('Ignored', CommentThreadStatus.Closed, 'file3.ts', false)).times(data[4])
          verify(azureReposInvoker.createCommentThread('Ignored', CommentThreadStatus.Closed, 'file4.ts', false)).times(data[5])
        })
      })
  })
})
