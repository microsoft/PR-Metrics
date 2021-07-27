// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { FixedLengthArray } from '../../src/utilities/fixedLengthArray'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import CodeMetrics from '../../src/metrics/codeMetrics'
import CodeMetricsData from '../../src/metrics/codeMetricsData'
import Inputs from '../../src/metrics/inputs'
import Logger from '../../src/utilities/logger'
import os from 'os'
import PullRequestComments from '../../src/pullRequests/pullRequestComments'
import PullRequestCommentsData from '../../src/pullRequests/pullRequestCommentsData'
import ReposInvoker from '../../src/repos/reposInvoker'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('pullRequestComments.ts', (): void => {
  const validGitPullRequestComments: GitPullRequestCommentThread =
    {
      threadContext: {
        filePath: '/file.ts'
      },
      comments:
      [{
        content: `# PR Metrics${os.EOL}`,
        id: 1
      }],
      id: 1
    }
  const complexGitPullRequestComments: GitPullRequestCommentThread[] =
  [
    {
      comments: [
        {
          content: `# PR Metrics${os.EOL}`,
          id: 10
        }
      ],
      id: 20,
      status: CommentThreadStatus.Active
    },
    {
      threadContext: {
        filePath: '/file2.ts'
      },
      comments: [
        {
          content: '❗ **This file doesn\'t require review.**'
        }
      ],
      id: 30
    },
    {
      threadContext: {
        filePath: '/file5.ts'
      },
      comments: [
        {
          content: '❗ **This file doesn\'t require review.**'
        }
      ],
      id: 40
    }
  ]
  let codeMetrics: CodeMetrics
  let inputs: Inputs
  let logger: Logger
  let reposInvoker: ReposInvoker
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    reposInvoker = mock(ReposInvoker)
    when(reposInvoker.getComments()).thenResolve([validGitPullRequestComments])

    codeMetrics = mock(CodeMetrics)
    when(codeMetrics.isSmall()).thenResolve(true)
    when(codeMetrics.isSufficientlyTested()).thenResolve(true)
    when(codeMetrics.getMetrics()).thenResolve(new CodeMetricsData(1000, 1000, 1000))
    when(codeMetrics.getFilesNotRequiringReview()).thenResolve([])
    when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve([])

    inputs = mock(Inputs)
    when(inputs.baseSize).thenReturn(200)

    logger = mock(Logger)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentFooter')).thenReturn('[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://aka.ms/PRMetrics/Comment)')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle')).thenReturn('# PR Metrics')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', Number(200).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(200).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', Number(1000).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(1000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', Number(1000000).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(1000000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.noReviewRequiredComment')).thenReturn('❗ **This file doesn\'t require review.**')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.smallPullRequestComment')).thenReturn('✔ **Thanks for keeping your pull request small.**')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.tableIgnoredCode')).thenReturn('Ignored Code')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.tableLines')).thenReturn('Lines')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.tableProductCode')).thenReturn('Product Code')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.tableSubtotal')).thenReturn('Subtotal')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.tableTestCode')).thenReturn('Test Code')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.tableTotal')).thenReturn('Total')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.testsInsufficientComment')).thenReturn('⚠️ **Consider adding additional tests.**')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.testsSufficientComment')).thenReturn('✔ **Thanks for adding tests.**')
  })

  describe('noReviewRequiredComment', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.noReviewRequiredComment

      // Assert
      expect(result).to.equal('❗ **This file doesn\'t require review.**')
      verify(logger.logDebug('* PullRequestComments.noReviewRequiredComment')).once()
    })
  })

  describe('getCommentData()', (): void => {
    it('should return the expected result when no comment is present', async (): Promise<void> => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

      // Assert
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal([])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).once()
    })

    async.each(
      [
        [{ comments: [{ content: `# PR Metrics${os.EOL}`, id: 10 }], id: 20 }],
        [{ comments: [{ content: 'Content', id: 1 }], id: 2 }, { comments: [{ content: `# PR Metrics${os.EOL}`, id: 10 }], id: 20 }]
      ], (comments: GitPullRequestCommentThread[]): void => {
        it(`should return the expected result when the metrics comment is present with payload '${JSON.stringify(comments)}'`, async (): Promise<void> => {
          // Arrange
          when(reposInvoker.getComments()).thenResolve(comments)
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

          // Assert
          expect(result.metricsCommentThreadId).to.equal(20)
          expect(result.metricsCommentId).to.equal(10)
          expect(result.metricsCommentThreadStatus).to.equal(null)
          expect(result.metricsCommentContent).to.equal(`# PR Metrics${os.EOL}`)
          expect(result.filesNotRequiringReview).to.deep.equal([])
          expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
          expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
          verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
          verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).atLeast(1)
        })
      })

    it('should return the expected result when the metrics comment is present but not for the current payload', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve([{ comments: [{ content: `# PR Metrics${os.EOL}`, id: 10 }], id: 20 }])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

      // Assert
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.metricsCommentThreadStatus).to.equal(null)
      expect(result.metricsCommentContent).to.equal(`# PR Metrics${os.EOL}`)
      expect(result.filesNotRequiringReview).to.deep.equal([])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).once()
    })

    async.each(
      [
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: 'Content' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]]
      ], (data: [string[], GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result for files not requiring review when the comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(reposInvoker.getComments()).thenResolve(data[1])
          when(codeMetrics.getFilesNotRequiringReview()).thenResolve(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

          // Assert
          expect(result.metricsCommentThreadId).to.equal(null)
          expect(result.metricsCommentId).to.equal(null)
          expect(result.metricsCommentThreadStatus).to.equal(null)
          expect(result.metricsCommentContent).to.equal(null)
          expect(result.filesNotRequiringReview).to.deep.equal(data[0])
          expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
          expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
          verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
          verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).atLeast(1)
        })
      })

    async.each(
      [
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: 'Content' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]]
      ], (data: [string[], GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result for deleted files not requiring review when the comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(reposInvoker.getComments()).thenResolve(data[1])
          when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

          // Assert
          expect(result.metricsCommentThreadId).to.equal(null)
          expect(result.metricsCommentId).to.equal(null)
          expect(result.metricsCommentThreadStatus).to.equal(null)
          expect(result.metricsCommentContent).to.equal(null)
          expect(result.filesNotRequiringReview).to.deep.equal([])
          expect(result.deletedFilesNotRequiringReview).to.deep.equal(data[0])
          expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
          verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
          verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).atLeast(1)
        })
      })

    it('should return the expected result when all comment types are present in files not requiring review', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(complexGitPullRequestComments)
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve(['folder/file1.ts', 'file2.ts', 'file5.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

      // Assert
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.metricsCommentThreadStatus).to.equal(CommentThreadStatus.Active)
      expect(result.metricsCommentContent).to.equal(`# PR Metrics${os.EOL}`)
      expect(result.filesNotRequiringReview).to.deep.equal(['folder/file1.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).twice()
    })

    it('should return the expected result when all comment types are present in deleted files not requiring review', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(complexGitPullRequestComments)
      when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve(['folder/file1.ts', 'file2.ts', 'file5.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

      // Assert
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.metricsCommentThreadStatus).to.equal(CommentThreadStatus.Active)
      expect(result.metricsCommentContent).to.equal(`# PR Metrics${os.EOL}`)
      expect(result.filesNotRequiringReview).to.deep.equal([])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['folder/file1.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).twice()
    })

    it('should return the expected result when all comment types are present in both modified and deleted files not requiring review', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(complexGitPullRequestComments)
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve(['folder/file1.ts', 'file2.ts'])
      when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve(['file3.ts', 'file5.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

      // Assert
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.metricsCommentThreadStatus).to.equal(CommentThreadStatus.Active)
      expect(result.metricsCommentContent).to.equal(`# PR Metrics${os.EOL}`)
      expect(result.filesNotRequiringReview).to.deep.equal(['folder/file1.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).twice()
    })

    it('should return the expected result when all comment types are present in both modified and deleted files not requiring review and comments need to be deleted', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve(complexGitPullRequestComments)
      when(codeMetrics.getFilesNotRequiringReview()).thenResolve(['folder/file1.ts', 'file2.ts'])
      when(codeMetrics.getDeletedFilesNotRequiringReview()).thenResolve(['file3.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

      // Assert
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.metricsCommentThreadStatus).to.equal(CommentThreadStatus.Active)
      expect(result.metricsCommentContent).to.equal(`# PR Metrics${os.EOL}`)
      expect(result.filesNotRequiringReview).to.deep.equal(['folder/file1.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts'])
      expect(result.commentThreadsRequiringDeletion).to.deep.equal([40])
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).twice()
    })

    async.each(
      [
        [[{ comments: [{}] }], null, 1],
        [[{ comments: [validGitPullRequestComments.comments![0]!, {}], id: 1 }], 1, 1],
        [[{ threadContext: { filePath: '/file.ts' }, comments: [{}] }], null, 0],
        [[validGitPullRequestComments, { comments: [{}] }], null, 1],
        [[validGitPullRequestComments, { comments: [validGitPullRequestComments.comments![0]!, {}], id: 1 }], 1, 1],
        [[validGitPullRequestComments, { threadContext: { filePath: '/file.ts' }, comments: [{}] }], null, 0]
      ], (data: [GitPullRequestCommentThread[], number | null, number]): void => {
        it(`should continue when no comment content is present in payload '${JSON.stringify(data[0])}'`, async (): Promise<void> => {
          // Arrange
          when(reposInvoker.getComments()).thenResolve(data[0])
          when(codeMetrics.getFilesNotRequiringReview()).thenResolve(['file.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData()

          // Assert
          expect(result.metricsCommentThreadId).to.equal(data[1])
          expect(result.metricsCommentId).to.equal(data[1])
          expect(result.metricsCommentThreadStatus).to.equal(null)
          expect(result.metricsCommentContent).to.equal(data[1] === null ? null : `# PR Metrics${os.EOL}`)
          expect(result.filesNotRequiringReview).to.deep.equal(['file.ts'])
          expect(result.commentThreadsRequiringDeletion).to.deep.equal([])
          verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
          verify(logger.logDebug('* PullRequestComments.getMetricsCommentData()')).times(data[2])
        })
      })

    async.each(
      [
        ['commentThread[0].comments', 'getMetricsCommentData', [{ }]],
        ['commentThread[0].id', 'getMetricsCommentData', [{ comments: [validGitPullRequestComments.comments![0]!, { content: `# PR Metrics${os.EOL}` }] }]],
        ['commentThread[0].comments[0].id', 'getMetricsCommentData', [{ comments: [{ content: `# PR Metrics${os.EOL}` }], id: 1 }]],
        ['commentThread[0].threadContext.filePath', 'getFilesRequiringCommentUpdates', [{ threadContext: {} }]],
        ['commentThread[0].comments', 'getFilesRequiringCommentUpdates', [{ threadContext: { filePath: '/file.ts' } }]],
        ['commentThread[0].comments[0]', 'getFilesRequiringCommentUpdates', [{ threadContext: { filePath: '/file.ts' }, comments: [] }]],
        ['commentThread[1].comments', 'getMetricsCommentData', [validGitPullRequestComments, { }]],
        ['commentThread[1].id', 'getMetricsCommentData', [validGitPullRequestComments, { comments: [{ content: `# PR Metrics${os.EOL}` }] }]],
        ['commentThread[1].comments[0].id', 'getMetricsCommentData', [validGitPullRequestComments, { comments: [{ content: `# PR Metrics${os.EOL}` }], id: 1 }]],
        ['commentThread[1].threadContext.filePath', 'getFilesRequiringCommentUpdates', [validGitPullRequestComments, { threadContext: {} }]],
        ['commentThread[1].comments', 'getFilesRequiringCommentUpdates', [validGitPullRequestComments, { threadContext: { filePath: '/file.ts' } }]],
        ['commentThread[1].comments[0]', 'getFilesRequiringCommentUpdates', [validGitPullRequestComments, { threadContext: { filePath: '/file.ts' }, comments: [] }]],
        ['commentThread[0].id', 'getFilesRequiringCommentUpdates', [{ threadContext: { filePath: '/fileA.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]]
      ], (data: [string, string, GitPullRequestCommentThread[]]): void => {
        it(`should throw for field '${data[0]}', accessed within '${data[1]}', when it is missing`, async (): Promise<void> => {
          // Arrange
          when(reposInvoker.getComments()).thenResolve(data[2])
          when(codeMetrics.getFilesNotRequiringReview()).thenResolve(['file.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await pullRequestComments.getCommentData()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'${data[0]}', accessed within 'PullRequestComments.${data[1]}()', is invalid, null, or undefined 'undefined'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
        })
      })

    it('should throw when the file name is not of the expected length', async (): Promise<void> => {
      // Arrange
      when(reposInvoker.getComments()).thenResolve([{ threadContext: { filePath: '/' } }])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await pullRequestComments.getCommentData()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'commentThread[0].threadContext.filePath\' \'/\' is of length \'1\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* PullRequestComments.getCommentData()')).once()
      verify(logger.logDebug('* PullRequestComments.getFilesRequiringCommentUpdates()')).once()
    })
  })

  describe('getMetricsComment()', (): void => {
    async.each(
      [
        [0, 0, 0, 0, 0],
        [1, 0, 1, 0, 1],
        [1, 1, 2, 1, 3],
        [1000, 1000, 2000, 1000, 3000],
        [1000000, 1000000, 2000000, 1000000, 3000000]
      ], (code: FixedLengthArray<number, 5>): void => {
        it(`should return the expected result for metrics '[${code[0]}, ${code[1]}, ${code[2]}, ${code[3]}, ${code[4]}]'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.getMetrics()).thenResolve(new CodeMetricsData(code[0], code[1], code[3]))
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: string = await pullRequestComments.getMetricsComment()

          // Assert
          expect(result).to.equal(
            `# PR Metrics${os.EOL}` +
            `✔ **Thanks for keeping your pull request small.**${os.EOL}` +
            `✔ **Thanks for adding tests.**${os.EOL}` +
            `||Lines${os.EOL}` +
            `-|-:${os.EOL}` +
            `Product Code|${code[0].toLocaleString()}${os.EOL}` +
            `Test Code|${code[1].toLocaleString()}${os.EOL}` +
            `**Subtotal**|**${code[2].toLocaleString()}**${os.EOL}` +
            `Ignored Code|${code[3].toLocaleString()}${os.EOL}` +
            `**Total**|**${code[4].toLocaleString()}**${os.EOL}` +
            os.EOL +
            '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://aka.ms/PRMetrics/Comment)')
          verify(logger.logDebug('* PullRequestComments.getMetricsComment()')).once()
          verify(logger.logDebug('* PullRequestComments.addCommentSizeStatus()')).once()
          verify(logger.logDebug('* PullRequestComments.addCommentTestStatus()')).once()
          verify(logger.logDebug('* PullRequestComments.addCommentMetrics()')).times(5)
        })
      })

    async.each(
      [
        200,
        1000,
        1000000
      ], (baseSize: number): void => {
        it(`should return the expected result when the pull request is not small and the base size is '${baseSize}'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.isSmall()).thenResolve(false)
          when(inputs.baseSize).thenReturn(baseSize)
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: string = await pullRequestComments.getMetricsComment()

          // Assert
          expect(result).to.equal(
            `# PR Metrics${os.EOL}` +
            `❌ **Try to keep pull requests smaller than ${baseSize.toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://aka.ms/PRMetrics/SRP).**${os.EOL}` +
            `✔ **Thanks for adding tests.**${os.EOL}` +
            `||Lines${os.EOL}` +
            `-|-:${os.EOL}` +
            `Product Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `Test Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `**Subtotal**|**${Number(2000).toLocaleString()}**${os.EOL}` +
            `Ignored Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `**Total**|**${Number(3000).toLocaleString()}**${os.EOL}` +
            os.EOL +
            '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://aka.ms/PRMetrics/Comment)')
          verify(logger.logDebug('* PullRequestComments.getMetricsComment()')).once()
          verify(logger.logDebug('* PullRequestComments.addCommentSizeStatus()')).once()
          verify(logger.logDebug('* PullRequestComments.addCommentTestStatus()')).once()
          verify(logger.logDebug('* PullRequestComments.addCommentMetrics()')).times(5)
        })
      })

    it('should return the expected result when the pull request has insufficient test coverage', async (): Promise<void> => {
      // Arrange
      when(codeMetrics.isSufficientlyTested()).thenResolve(false)
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: string = await pullRequestComments.getMetricsComment()

      // Assert
      expect(result).to.equal(
        `# PR Metrics${os.EOL}` +
        `✔ **Thanks for keeping your pull request small.**${os.EOL}` +
        `⚠️ **Consider adding additional tests.**${os.EOL}` +
        `||Lines${os.EOL}` +
        `-|-:${os.EOL}` +
        `Product Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `Test Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `**Subtotal**|**${Number(2000).toLocaleString()}**${os.EOL}` +
        `Ignored Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `**Total**|**${Number(3000).toLocaleString()}**${os.EOL}` +
        os.EOL +
        '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://aka.ms/PRMetrics/Comment)')
      verify(logger.logDebug('* PullRequestComments.getMetricsComment()')).once()
      verify(logger.logDebug('* PullRequestComments.addCommentSizeStatus()')).once()
      verify(logger.logDebug('* PullRequestComments.addCommentTestStatus()')).once()
      verify(logger.logDebug('* PullRequestComments.addCommentMetrics()')).times(5)
    })

    it('should return the expected result when the pull request does not require a specific level of test coverage', async (): Promise<void> => {
      // Arrange
      when(codeMetrics.isSufficientlyTested()).thenResolve(null)
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

      // Act
      const result: string = await pullRequestComments.getMetricsComment()

      // Assert
      expect(result).to.equal(
        `# PR Metrics${os.EOL}` +
        `✔ **Thanks for keeping your pull request small.**${os.EOL}` +
        `||Lines${os.EOL}` +
        `-|-:${os.EOL}` +
        `Product Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `Test Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `**Subtotal**|**${Number(2000).toLocaleString()}**${os.EOL}` +
        `Ignored Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `**Total**|**${Number(3000).toLocaleString()}**${os.EOL}` +
        os.EOL +
        '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://aka.ms/PRMetrics/Comment)')
      verify(logger.logDebug('* PullRequestComments.getMetricsComment()')).once()
      verify(logger.logDebug('* PullRequestComments.addCommentSizeStatus()')).once()
      verify(logger.logDebug('* PullRequestComments.addCommentTestStatus()')).once()
      verify(logger.logDebug('* PullRequestComments.addCommentMetrics()')).times(5)
    })
  })

  describe('getMetricsCommentStatus()', (): void => {
    async.each(
      [
        true,
        null
      ], (sufficientlyTested: boolean | null): void => {
        it(`should return Closed when the pull request is small and has sufficient test coverage '${sufficientlyTested}'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.isSmall()).thenResolve(true)
          when(codeMetrics.isSufficientlyTested()).thenResolve(sufficientlyTested)
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: CommentThreadStatus = await pullRequestComments.getMetricsCommentStatus()

          // Assert
          expect(result).to.equal(CommentThreadStatus.Closed)
          verify(logger.logDebug('* PullRequestComments.getMetricsCommentStatus()')).once()
        })
      })

    async.each(
      [
        [true, false],
        [false, true],
        [false, false],
        [false, null]
      ], (codeMetricsSettings: [boolean, boolean | null]): void => {
        it(`should return Active when the pull request small status is '${codeMetricsSettings[0]}' and the sufficient test coverage status is '${codeMetricsSettings[1]}'`, async (): Promise<void> => {
          // Arrange
          when(codeMetrics.isSmall()).thenResolve(codeMetricsSettings[0])
          when(codeMetrics.isSufficientlyTested()).thenResolve(codeMetricsSettings[1])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(codeMetrics), instance(inputs), instance(logger), instance(reposInvoker), instance(taskLibWrapper))

          // Act
          const result: CommentThreadStatus = await pullRequestComments.getMetricsCommentStatus()

          // Assert
          expect(result).to.equal(CommentThreadStatus.Active)
          verify(logger.logDebug('* PullRequestComments.getMetricsCommentStatus()')).once()
        })
      })
  })
})
