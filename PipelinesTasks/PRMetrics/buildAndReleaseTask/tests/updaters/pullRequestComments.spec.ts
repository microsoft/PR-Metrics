// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import async from 'async'
import os from 'os'
import PullRequestComments from '../../updaters/pullRequestComments'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { instance, mock, verify, when } from 'ts-mockito'

describe('pullRequestComments.ts', (): void => {
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentFooter')).thenReturn('[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', '1')).thenReturn('# Metrics for iteration 1')
    when(taskLibWrapper.loc('updaters.pullRequestComments.fileIgnoredComment')).thenReturn('❗ **This file may not need to be reviewed.**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.largePullRequestComment', '1,000')).thenReturn('❌ **Try to keep pull requests smaller than 1,000 lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.smallPullRequestComment')).thenReturn('✔ **Thanks for keeping your pull request small.**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableIgnored')).thenReturn('Ignored')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableLines')).thenReturn('Lines')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableProductCode')).thenReturn('Product Code')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableSubtotal')).thenReturn('Subtotal')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableTestCode')).thenReturn('Test Code')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableTotal')).thenReturn('Total')
    when(taskLibWrapper.loc('updaters.pullRequestComments.testsInsufficientComment')).thenReturn('⚠️ **Consider adding additional tests.**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.testsSufficientComment')).thenReturn('✔ **Thanks for adding tests.**')
  })

  describe('getCommentData()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getCommentData()

      // Assert
      expect(result).to.equal('TODO')
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
    })
  })

  describe('getCommentThreadId()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: number | null = pullRequestComments.getCommentThreadId()

      // Assert
      expect(result).to.equal(1)
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentThreadId()')).once()
    })
  })

  describe('getMetricsComment()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getMetricsComment()

      // Assert
      expect(result).to.equal(
        `# Metrics for iteration 1${os.EOL}` +
        `✔ **Thanks for keeping your pull request small.**${os.EOL}` +
        `✔ **Thanks for adding tests.**${os.EOL}` +
        `||Lines${os.EOL}` +
        `-|-:${os.EOL}` +
        `Product Code|1,000${os.EOL}` +
        `Test Code|1,000${os.EOL}` +
        `**Subtotal**|**1,000**${os.EOL}` +
        `Ignored|1,000${os.EOL}` +
        `**Total**|**1,000**${os.EOL}` +
        os.EOL +
        '[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
    })
  })

  describe('getMetricsCommentStatus()', (): void => {
    it('should return Closed when the pull request is small and has sufficient test coverage', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: CommentThreadStatus = pullRequestComments.getMetricsCommentStatus(true, true)

      // Assert
      expect(result).to.equal(CommentThreadStatus.Closed)
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')).once()
    })

    async.each(
      [
        [true, false],
        [true, null],
        [false, true],
        [false, false],
        [false, null]
      ], (parameters: (boolean| null)[]): void => {
        it(`should return Active when the pull request small status is '${parameters[0]}' and the sufficient test coverage status is '${parameters[1]}'`, (): void => {
          // Arrange
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

          // Act
          const result: CommentThreadStatus = pullRequestComments.getMetricsCommentStatus(parameters[0]!, parameters[1]!)

          // Assert
          expect(result).to.equal(CommentThreadStatus.Active)
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')).once()
        })
      })
  })

  describe('getIgnoredComment()', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getIgnoredComment()

      // Assert
      expect(result).to.equal('❗ **This file may not need to be reviewed.**')
      verify(taskLibWrapper.debug('* PullRequestComments.getIgnoredComment()')).once()
    })
  })
})
