// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { expect } from 'chai'
import async from 'async'
import AzureReposInvoker from '../../src/azureRepos/azureReposInvoker'
import CodeMetrics from '../../src/metrics/codeMetrics'
import CodeMetricsCalculator from '../../src/metrics/codeMetricsCalculator'
import CodeMetricsData from '../../src/metrics/codeMetricsData'
import GitInvoker from '../../src/git/gitInvoker'
import IPullRequestMetadata from '../../src/azureRepos/iPullRequestMetadata'
import PullRequest from '../../src/pullRequests/pullRequest'
import PullRequestComments from '../../src/pullRequests/pullRequestComments'
import PullRequestCommentsData from '../../src/pullRequests/pullRequestCommentsData'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('codeMetricsCalculator.ts', (): void => {
  let azureReposInvoker: AzureReposInvoker
  let codeMetrics: CodeMetrics
  let gitInvoker: GitInvoker
  let pullRequest: PullRequest
  let pullRequestComments: PullRequestComments
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker)
    when(azureReposInvoker.isAccessTokenAvailable).thenReturn(true)

    codeMetrics = mock(CodeMetrics)

    gitInvoker = mock(GitInvoker)
    when(gitInvoker.isGitEnlistment()).thenResolve(true)
    when(gitInvoker.isGitHistoryAvailable()).thenResolve(true)

    pullRequest = mock(PullRequest)
    when(pullRequest.isPullRequest).thenReturn(true)
    when(pullRequest.isSupportedProvider).thenReturn(true)

    pullRequestComments = mock(PullRequestComments)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.noAccessToken')).thenReturn('Could not access the OAuth token. Enable \'Allow scripts to access OAuth token\' under the build process phase settings.')
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitEnlistment')).thenReturn('No Git enlistment present. Disable \'Don\'t sync sources\' under the build process phase settings.')
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitHistory')).thenReturn('Could not access sufficient Git history. Disable \'Shallow fetch\' under the build process phase settings.')
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.noPullRequest')).thenReturn('The build is not running against a pull request.')
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.unsupportedProvider', 'Other')).thenReturn('The build is running against a pull request from \'Other\', which is not a supported provider.')
  })

  describe('shouldSkipWithUnsupportedProvider', (): void => {
    it('should return null when the task should not be skipped', (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldSkip')).once()
    })

    it('should return the appropriate message when not a supported provider', (): void => {
      // Arrange
      when(pullRequest.isPullRequest).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal('The build is not running against a pull request.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldSkip')).once()
    })

    it('should return null when the task should not be skipped', (): void => {
      // Arrange
      when(pullRequest.isSupportedProvider).thenReturn('Other')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal('The build is running against a pull request from \'Other\', which is not a supported provider.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldSkip')).once()
    })
  })

  describe('shouldStop()', (): void => {
    it('should return null when the task should not terminate', async (): Promise<void> => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal(null)
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldStop()')).once()
    })

    it('should return the appropriate message when no access token is available', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.isAccessTokenAvailable).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal('Could not access the OAuth token. Enable \'Allow scripts to access OAuth token\' under the build process phase settings.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldStop()')).once()
    })

    it('should return the appropriate message when not called from a Git enlistment', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isGitEnlistment()).thenResolve(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal('No Git enlistment present. Disable \'Don\'t sync sources\' under the build process phase settings.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldStop()')).once()
    })

    it('should return the appropriate message when the Git history is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isGitHistoryAvailable()).thenResolve(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal('Could not access sufficient Git history. Disable \'Shallow fetch\' under the build process phase settings.')
      verify(taskLibWrapper.debug('* CodeMetricsCalculator.shouldStop()')).once()
    })
  })

  describe('updateDetails()', (): void => {
    it('should perform the expected actions', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getTitleAndDescription()).thenResolve({ title: 'Title', description: 'Description' })
      when(pullRequest.getUpdatedTitle('Title')).thenResolve('S✔ ◾ TODO')
      when(pullRequest.getUpdatedDescription('Description')).thenReturn('Description')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

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
      when(pullRequest.getUpdatedTitle('Title')).thenResolve('S✔ ◾ TODO')
      when(pullRequest.getUpdatedDescription(undefined)).thenReturn('Description')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

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
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

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
      when(pullRequestComments.getMetricsComment(1)).thenResolve('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(CommentThreadStatus.Active)
      when(codeMetrics.getMetrics()).thenResolve(new CodeMetricsData(1, 2, 4))
      when(codeMetrics.getSize()).thenResolve('S')
      when(codeMetrics.isSufficientlyTested()).thenResolve(true)
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
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

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
      when(pullRequestComments.getMetricsComment(1)).thenResolve('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(CommentThreadStatus.Active)
      when(codeMetrics.getMetrics()).thenResolve(new CodeMetricsData(1, 2, 4))
      when(codeMetrics.getSize()).thenResolve('S')
      when(codeMetrics.isSufficientlyTested()).thenResolve(null)
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
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

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
      when(pullRequestComments.getMetricsComment(1)).thenResolve('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(CommentThreadStatus.Active)
      when(codeMetrics.getMetrics()).thenResolve(new CodeMetricsData(1, 2, 4))
      when(codeMetrics.getSize()).thenResolve('S')
      when(codeMetrics.isSufficientlyTested()).thenResolve(true)
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
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

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
        [['file1.ts'], 1, 0],
        [['file1.ts', 'file2.ts'], 1, 1],
        [[], 0, 0],
        [['file1.ts', 'file2.ts'], 1, 1]
      ], (data: [string[], number, number]): void => {
        it(`should succeed when comments are to be added to files not requiring review '${JSON.stringify(data[0])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
          const commentData: PullRequestCommentsData = new PullRequestCommentsData(data[0], [])
          commentData.isMetricsCommentPresent = true
          when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
          when(pullRequestComments.noReviewRequiredComment).thenReturn('No Review Required')
          const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

          // Act
          await codeMetricsCalculator.updateComments()

          // Assert
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')).times(data[1] + data[2])
          verify(azureReposInvoker.createCommentThread('No Review Required', CommentThreadStatus.Closed, 'file1.ts', false)).times(data[1])
          verify(azureReposInvoker.createCommentThread('No Review Required', CommentThreadStatus.Closed, 'file2.ts', false)).times(data[2])
        })
      })

    async.each(
      [
        [['file1.ts'], 1, 0],
        [['file1.ts', 'file2.ts'], 1, 1],
        [[], 0, 0],
        [['file1.ts', 'file2.ts'], 1, 1]
      ], (data: [string[], number, number]): void => {
        it(`should succeed when comments are to be added to deleted files not requiring review '${JSON.stringify(data[0])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCurrentIteration()).thenResolve(1)
          const commentData: PullRequestCommentsData = new PullRequestCommentsData([], data[0])
          commentData.isMetricsCommentPresent = true
          when(pullRequestComments.getCommentData(1)).thenResolve(commentData)
          when(pullRequestComments.noReviewRequiredComment).thenReturn('No Review Required')
          const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(codeMetrics), instance(gitInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

          // Act
          await codeMetricsCalculator.updateComments()

          // Assert
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
          verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')).times(data[1] + data[2])
          verify(azureReposInvoker.createCommentThread('No Review Required', CommentThreadStatus.Closed, 'file1.ts', true)).times(data[1])
          verify(azureReposInvoker.createCommentThread('No Review Required', CommentThreadStatus.Closed, 'file2.ts', true)).times(data[2])
        })
      })
  })
})
