// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetricsCalculator from '../../src/metrics/codeMetricsCalculator'
import GitInvoker from '../../src/git/gitInvoker'
import Logger from '../../src/utilities/logger'
import PullRequest from '../../src/pullRequests/pullRequest'
import PullRequestComments from '../../src/pullRequests/pullRequestComments'
import PullRequestCommentsData from '../../src/pullRequests/pullRequestCommentsData'
import ReposInvoker from '../../src/repos/reposInvoker'
import RunnerInvoker from '../../src/runners/runnerInvoker'

describe('codeMetricsCalculator.ts', (): void => {
  let gitInvoker: GitInvoker
  let logger: Logger
  let pullRequest: PullRequest
  let pullRequestComments: PullRequestComments
  let reposInvoker: ReposInvoker
  let runnerInvoker: RunnerInvoker

  beforeEach((): void => {
    reposInvoker = mock(ReposInvoker)
    when(reposInvoker.isAccessTokenAvailable).thenReturn(null)

    gitInvoker = mock(GitInvoker)
    when(gitInvoker.isGitEnlistment()).thenResolve(true)
    when(gitInvoker.isGitHistoryAvailable()).thenResolve(true)

    logger = mock(Logger)

    pullRequest = mock(PullRequest)
    when(pullRequest.isPullRequest).thenReturn(true)
    when(pullRequest.isSupportedProvider).thenReturn(true)

    pullRequestComments = mock(PullRequestComments)

    runnerInvoker = mock(RunnerInvoker)
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.noGitEnlistment')).thenReturn('No Git enlistment present. Remove \'checkout: none\' (YAML) or disable \'Don\'t sync sources\' under the build process phase settings (classic).')
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.noGitHistory')).thenReturn('Could not access sufficient Git history. Disable \'fetchDepth\' (YAML) or \'Shallow fetch\' under the build process phase settings (classic). Or set the threshold sufficiently high.')
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.noPullRequest')).thenReturn('The build is not running against a pull request.')
    when(runnerInvoker.loc('metrics.codeMetricsCalculator.unsupportedProvider', 'Other')).thenReturn('The build is running against a pull request from \'Other\', which is not a supported provider.')
  })

  describe('shouldSkipWithUnsupportedProvider', (): void => {
    it('should return null when the task should not be skipped', (): void => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* CodeMetricsCalculator.shouldSkip')).once()
    })

    it('should return the appropriate message when not a supported provider', (): void => {
      // Arrange
      when(pullRequest.isPullRequest).thenReturn(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal('The build is not running against a pull request.')
      verify(logger.logDebug('* CodeMetricsCalculator.shouldSkip')).once()
    })

    it('should return null when the task should not be skipped', (): void => {
      // Arrange
      when(pullRequest.isSupportedProvider).thenReturn('Other')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = codeMetricsCalculator.shouldSkip

      // Assert
      expect(result).to.equal('The build is running against a pull request from \'Other\', which is not a supported provider.')
      verify(logger.logDebug('* CodeMetricsCalculator.shouldSkip')).once()
    })
  })

  describe('shouldStop()', (): void => {
    it('should return null when the task should not terminate', async (): Promise<void> => {
      // Arrange
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* CodeMetricsCalculator.shouldStop()')).once()
    })

    it('should return the appropriate message when no access token is available', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.isAccessTokenAvailable).thenReturn('No Access Token')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal('No Access Token')
      verify(logger.logDebug('* CodeMetricsCalculator.shouldStop()')).once()
    })

    it('should return the appropriate message when not called from a Git enlistment', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isGitEnlistment()).thenResolve(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal('No Git enlistment present. Remove \'checkout: none\' (YAML) or disable \'Don\'t sync sources\' under the build process phase settings (classic).')
      verify(logger.logDebug('* CodeMetricsCalculator.shouldStop()')).once()
    })

    it('should return the appropriate message when the Git history is unavailable', async (): Promise<void> => {
      // Arrange
      when(gitInvoker.isGitHistoryAvailable()).thenResolve(false)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      const result: string | null = await codeMetricsCalculator.shouldStop()

      // Assert
      expect(result).to.equal('Could not access sufficient Git history. Disable \'fetchDepth\' (YAML) or \'Shallow fetch\' under the build process phase settings (classic). Or set the threshold sufficiently high.')
      verify(logger.logDebug('* CodeMetricsCalculator.shouldStop()')).once()
    })
  })

  describe('updateDetails()', (): void => {
    it('should perform the expected actions', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getTitleAndDescription()).thenResolve({ title: 'Title', description: 'Description' })
      when(pullRequest.getUpdatedTitle('Title')).thenResolve('S✔ ◾ Title')
      when(pullRequest.getUpdatedDescription('Description')).thenReturn('Description')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      await codeMetricsCalculator.updateDetails()

      // Assert
      verify(logger.logDebug('* CodeMetricsCalculator.updateDetails()')).once()
      verify(pullRequest.getUpdatedTitle('Title')).once()
      verify(pullRequest.getUpdatedDescription('Description')).once()
      verify(reposInvoker.setTitleAndDescription('S✔ ◾ Title', 'Description')).once()
    })

    it('should perform the expected actions when the description is missing', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getTitleAndDescription()).thenResolve({ title: 'Title' })
      when(pullRequest.getUpdatedTitle('Title')).thenResolve('S✔ ◾ Title')
      when(pullRequest.getUpdatedDescription(undefined)).thenReturn('Description')
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      await codeMetricsCalculator.updateDetails()

      // Assert
      verify(logger.logDebug('* CodeMetricsCalculator.updateDetails()')).once()
      verify(pullRequest.getUpdatedTitle('Title')).once()
      verify(pullRequest.getUpdatedDescription(undefined)).once()
      verify(reposInvoker.setTitleAndDescription('S✔ ◾ Title', 'Description')).once()
    })
  })

  describe('updateComments()', (): void => {
    it('should succeed when no comment updates are necessary', async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      commentData.metricsCommentThreadId = 1
      when(pullRequestComments.getCommentData()).thenResolve(commentData)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(logger.logDebug('* CodeMetricsCalculator.updateComments()')).once()
    })

    it('should perform the expected actions when the metrics comment is to be updated', async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      commentData.metricsCommentThreadId = 1
      when(pullRequestComments.getCommentData()).thenResolve(commentData)
      when(pullRequestComments.getMetricsComment()).thenResolve('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(CommentThreadStatus.Active)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(logger.logDebug('* CodeMetricsCalculator.updateComments()')).once()
      verify(logger.logDebug('* CodeMetricsCalculator.updateMetricsComment()')).once()
      verify(reposInvoker.updateComment(1, 'Description', CommentThreadStatus.Active)).once()
    })

    it('should perform the expected actions when the metrics comment is to be updated and there is no existing thread', async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      when(pullRequestComments.getCommentData()).thenResolve(commentData)
      when(pullRequestComments.getMetricsComment()).thenResolve('Description')
      when(pullRequestComments.getMetricsCommentStatus()).thenResolve(CommentThreadStatus.Active)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(logger.logDebug('* CodeMetricsCalculator.updateComments()')).once()
      verify(logger.logDebug('* CodeMetricsCalculator.updateMetricsComment()')).once()
      verify(reposInvoker.createComment('Description', CommentThreadStatus.Active)).once()
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
          const commentData: PullRequestCommentsData = new PullRequestCommentsData(data[0], [])
          commentData.metricsCommentThreadId = 1
          when(pullRequestComments.getCommentData()).thenResolve(commentData)
          when(pullRequestComments.noReviewRequiredComment).thenReturn('No Review Required')
          const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

          // Act
          await codeMetricsCalculator.updateComments()

          // Assert
          verify(logger.logDebug('* CodeMetricsCalculator.updateComments()')).once()
          verify(logger.logDebug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')).times(data[1] + data[2])
          verify(reposInvoker.createComment('No Review Required', CommentThreadStatus.Closed, 'file1.ts', false)).times(data[1])
          verify(reposInvoker.createComment('No Review Required', CommentThreadStatus.Closed, 'file2.ts', false)).times(data[2])
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
          const commentData: PullRequestCommentsData = new PullRequestCommentsData([], data[0])
          commentData.metricsCommentThreadId = 1
          when(pullRequestComments.getCommentData()).thenResolve(commentData)
          when(pullRequestComments.noReviewRequiredComment).thenReturn('No Review Required')
          const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

          // Act
          await codeMetricsCalculator.updateComments()

          // Assert
          verify(logger.logDebug('* CodeMetricsCalculator.updateComments()')).once()
          verify(logger.logDebug('* CodeMetricsCalculator.updateNoReviewRequiredComment()')).times(data[1] + data[2])
          verify(reposInvoker.createComment('No Review Required', CommentThreadStatus.Closed, 'file1.ts', true)).times(data[1])
          verify(reposInvoker.createComment('No Review Required', CommentThreadStatus.Closed, 'file2.ts', true)).times(data[2])
        })
      })

    it('should succeed when comments are to be deleted from files ', async (): Promise<void> => {
      // Arrange
      const commentData: PullRequestCommentsData = new PullRequestCommentsData([], [])
      commentData.commentThreadsRequiringDeletion.push(1, 2)
      when(pullRequestComments.getCommentData()).thenResolve(commentData)
      const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(gitInvoker), instance(logger), instance(pullRequest), instance(pullRequestComments), instance(reposInvoker), instance(runnerInvoker))

      // Act
      await codeMetricsCalculator.updateComments()

      // Assert
      verify(logger.logDebug('* CodeMetricsCalculator.updateComments()')).once()
      verify(reposInvoker.deleteCommentThread(1)).once()
      verify(reposInvoker.deleteCommentThread(2)).once()
    })
  })
})
