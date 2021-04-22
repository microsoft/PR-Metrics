// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { FixedLengthArray } from '../../src/utilities/fixedLengthArray'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import AzureReposInvoker from '../../src/azureRepos/azureReposInvoker'
import CodeMetrics from '../../src/metrics/codeMetrics'
import CodeMetricsData from '../../src/metrics/codeMetricsData'
import Inputs from '../../src/metrics/inputs'
import os from 'os'
import PullRequestComments from '../../src/pullRequests/pullRequestComments'
import PullRequestCommentsData from '../../src/pullRequests/pullRequestCommentsData'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('pullRequestComments.ts', (): void => {
  const validGitPullRequestCommentThread: GitPullRequestCommentThread =
    {
      threadContext: {
        filePath: '/file.ts'
      },
      comments:
      [{
        content: '# Metrics for iteration 1',
        id: 1
      }],
      id: 1
    }
  const complexGitPullRequestCommentThreads: GitPullRequestCommentThread[] =
  [
    {
      comments: [
        {
          content: `# Metrics for iteration 1${os.EOL}`,
          id: 10
        }
      ],
      id: 20
    },
    {
      threadContext: {
        filePath: '/file2.ts'
      },
      comments: [
        {
          content: '❗ **This file doesn\'t require review.**'
        }
      ]
    },
    {
      threadContext: {
        filePath: '/file5.ts'
      },
      comments: [
        {
          content: '❗ **This file doesn\'t require review.**'
        }
      ]
    }
  ]
  let azureReposInvoker: AzureReposInvoker
  let codeMetrics: CodeMetrics
  let inputs: Inputs
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker)
    when(azureReposInvoker.getCommentThreads()).thenResolve([validGitPullRequestCommentThread])

    codeMetrics = mock(CodeMetrics)
    when(codeMetrics.isSmall).thenReturn(true)
    when(codeMetrics.isSufficientlyTested).thenReturn(true)
    when(codeMetrics.metrics).thenReturn(new CodeMetricsData(1000, 1000, 1000))
    when(codeMetrics.filesNotRequiringReview).thenReturn([])
    when(codeMetrics.deletedFilesNotRequiringReview).thenReturn([])

    inputs = mock(Inputs)
    when(inputs.baseSize).thenReturn(250)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentFooter')).thenReturn('[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', Number(1).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(1).toLocaleString()}`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', Number(2).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(2).toLocaleString()}`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', Number(100).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(100).toLocaleString()}`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', Number(1000).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(1000).toLocaleString()}`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', Number(1000000).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(1000000).toLocaleString()}`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.commentTitle', '.+')).thenReturn('# Metrics for iteration .+')
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', Number(250).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(250).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', Number(1000).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(1000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**`)
    when(taskLibWrapper.loc('pullRequests.pullRequestComments.largePullRequestComment', Number(1000000).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(1000000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**`)
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
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.noReviewRequiredComment

      // Assert
      expect(result).to.equal('❗ **This file doesn\'t require review.**')
      verify(taskLibWrapper.debug('* PullRequestComments.noReviewRequiredComment')).once()
    })
  })

  describe('getCommentData()', (): void => {
    it('should return the expected result when no comment is present', async (): Promise<void> => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(null)
      expect(result.metricsCommentId).to.equal(null)
      expect(result.filesNotRequiringReview).to.deep.equal([])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
    })

    async.each(
      [
        [1, [{ comments: [{ content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ content: `# Metrics for iteration 100${os.EOL}`, id: 1 }, { content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [2, [{ comments: [{ content: `# Metrics for iteration 2${os.EOL}`, id: 10 }], id: 20 }]],
        [100, [{ comments: [{ content: `# Metrics for iteration 1${os.EOL}`, id: 1 }, { content: `# Metrics for iteration 100${os.EOL}`, id: 10 }], id: 20 }]],
        [1000000, [{ comments: [{ content: `# Metrics for iteration ${Number(1000000).toLocaleString()}${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ content: 'Content', id: 1 }], id: 2 }, { comments: [{ content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]]
      ], (data: [number, GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result when the metrics comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[1])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData(data[0])

          // Assert
          expect(result.isMetricsCommentPresent).to.equal(true)
          expect(result.metricsCommentThreadId).to.equal(20)
          expect(result.metricsCommentId).to.equal(10)
          expect(result.filesNotRequiringReview).to.deep.equal([])
          expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).atLeast(1)
        })
      })

    it('should return the expected result when the metrics comment is present but not for the current payload', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve([{ comments: [{ content: `# Metrics for iteration 10${os.EOL}`, id: 10 }], id: 20 }])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(false)
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.filesNotRequiringReview).to.deep.equal([])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).once()
    })

    async.each(
      [
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: 'Content' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/fileA.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]]
      ], (data: [string[], GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result for files not requiring review when the comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[1])
          when(codeMetrics.filesNotRequiringReview).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

          // Assert
          expect(result.isMetricsCommentPresent).to.equal(false)
          expect(result.metricsCommentThreadId).to.equal(null)
          expect(result.metricsCommentId).to.equal(null)
          expect(result.filesNotRequiringReview).to.deep.equal(data[0])
          expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.getNoReviewRequiredCommentData()')).atLeast(1)
        })
      })

    async.each(
      [
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: 'Content' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ threadContext: { filePath: '/fileA.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]],
        [['file3.ts'], [{ threadContext: { filePath: '/folder/file1.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }, { threadContext: { filePath: '/file2.ts' }, comments: [{ content: '❗ **This file doesn\'t require review.**' }] }]]
      ], (data: [string[], GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result for deleted files not requiring review when the comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[1])
          when(codeMetrics.deletedFilesNotRequiringReview).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

          // Assert
          expect(result.isMetricsCommentPresent).to.equal(false)
          expect(result.metricsCommentThreadId).to.equal(null)
          expect(result.metricsCommentId).to.equal(null)
          expect(result.filesNotRequiringReview).to.deep.equal([])
          expect(result.deletedFilesNotRequiringReview).to.deep.equal(data[0])
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.getNoReviewRequiredCommentData()')).atLeast(1)
        })
      })

    it('should return the expected result when all comment types are present in files not requiring review', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve(complexGitPullRequestCommentThreads)
      when(codeMetrics.filesNotRequiringReview).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(true)
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.filesNotRequiringReview).to.deep.equal(['folder/file1.ts', 'file3.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal([])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getNoReviewRequiredCommentData()')).once()
    })

    it('should return the expected result when all comment types are present in deleted files not requiring review', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve(complexGitPullRequestCommentThreads)
      when(codeMetrics.deletedFilesNotRequiringReview).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(true)
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.filesNotRequiringReview).to.deep.equal([])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['folder/file1.ts', 'file3.ts'])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getNoReviewRequiredCommentData()')).once()
    })

    it('should return the expected result when all comment types are present in both modified and deleted files not requiring review', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve(complexGitPullRequestCommentThreads)
      when(codeMetrics.filesNotRequiringReview).thenReturn(['folder/file1.ts', 'file2.ts'])
      when(codeMetrics.deletedFilesNotRequiringReview).thenReturn(['file3.ts', 'file5.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isMetricsCommentPresent).to.equal(true)
      expect(result.metricsCommentThreadId).to.equal(20)
      expect(result.metricsCommentId).to.equal(10)
      expect(result.filesNotRequiringReview).to.deep.equal(['folder/file1.ts'])
      expect(result.deletedFilesNotRequiringReview).to.deep.equal(['file3.ts'])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getNoReviewRequiredCommentData()')).twice()
    })

    async.each(
      [
        ['commentThread[0].comments', 'getMetricsCommentData', [{ }]],
        ['commentThread[0].comments[0].content', 'getMetricsCommentData', [{ comments: [{}] }]],
        ['commentThread[0].id', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, { content: '# Metrics for iteration 1' }] }]],
        ['commentThread[0].comments[0].id', 'getMetricsCommentData', [{ comments: [{ content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[0].comments[1].content', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, {}], id: 1 }]],
        ['commentThread[0].comments[1].id', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, { content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[0].threadContext.filePath', 'getCommentData', [{ threadContext: {} }]],
        ['commentThread[0].comments', 'getNoReviewRequiredCommentData', [{ threadContext: { filePath: '/file.ts' } }]],
        ['commentThread[0].comments[0]', 'getNoReviewRequiredCommentData', [{ threadContext: { filePath: '/file.ts' }, comments: [] }]],
        ['commentThread[0].comments[0].content', 'getNoReviewRequiredCommentData', [{ threadContext: { filePath: '/file.ts' }, comments: [{}] }]],
        ['commentThread[1].comments', 'getMetricsCommentData', [validGitPullRequestCommentThread, { }]],
        ['commentThread[1].comments[0].content', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{}] }]],
        ['commentThread[1].id', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{ content: '# Metrics for iteration 1' }] }]],
        ['commentThread[1].comments[0].id', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{ content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[1].comments[1].content', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [validGitPullRequestCommentThread.comments![0]!, {}], id: 1 }]],
        ['commentThread[1].comments[1].id', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [validGitPullRequestCommentThread.comments![0]!, { content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[1].threadContext.filePath', 'getCommentData', [validGitPullRequestCommentThread, { threadContext: {} }]],
        ['commentThread[1].comments', 'getNoReviewRequiredCommentData', [validGitPullRequestCommentThread, { threadContext: { filePath: '/file.ts' } }]],
        ['commentThread[1].comments[0]', 'getNoReviewRequiredCommentData', [validGitPullRequestCommentThread, { threadContext: { filePath: '/file.ts' }, comments: [] }]],
        ['commentThread[1].comments[0].content', 'getNoReviewRequiredCommentData', [validGitPullRequestCommentThread, { threadContext: { filePath: '/file.ts' }, comments: [{}] }]]
      ], (data: [string, string, GitPullRequestCommentThread[]]): void => {
        it(`should throw for field '${data[0]}', accessed within '${data[1]}', when it is missing`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[2])
          when(codeMetrics.filesNotRequiringReview).thenReturn(['file.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await pullRequestComments.getCommentData(1)
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'${data[0]}', accessed within 'PullRequestComments.${data[1]}()', is invalid, null, or undefined 'undefined'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
        })
      })

    it('should throw when the file name is not of the expected length', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve([{ threadContext: { filePath: '/' } }])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await pullRequestComments.getCommentData(1)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('\'commentThread[0].threadContext.filePath\' \'/\' is of length \'1\'.')
      }

      expect(errorThrown).to.equal(true)
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
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
        it(`should return the expected result for metrics '[${code[0]}, ${code[1]}, ${code[2]}, ${code[3]}, ${code[4]}]'`, (): void => {
          // Arrange
          when(codeMetrics.metrics).thenReturn(new CodeMetricsData(code[0], code[1], code[3]))
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: string = pullRequestComments.getMetricsComment(1)

          // Assert
          expect(result).to.equal(
            `# Metrics for iteration 1${os.EOL}` +
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
            '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
        })
      })

    async.each(
      [
        250,
        1000,
        1000000
      ], (baseSize: number): void => {
        it(`should return the expected result when the pull request is not small and the base size is '${baseSize}'`, (): void => {
          // Arrange
          when(codeMetrics.isSmall).thenReturn(false)
          when(inputs.baseSize).thenReturn(baseSize)
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: string = pullRequestComments.getMetricsComment(1)

          // Assert
          expect(result).to.equal(
            `# Metrics for iteration 1${os.EOL}` +
            `❌ **Try to keep pull requests smaller than ${baseSize.toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**${os.EOL}` +
            `✔ **Thanks for adding tests.**${os.EOL}` +
            `||Lines${os.EOL}` +
            `-|-:${os.EOL}` +
            `Product Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `Test Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `**Subtotal**|**${Number(2000).toLocaleString()}**${os.EOL}` +
            `Ignored Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `**Total**|**${Number(3000).toLocaleString()}**${os.EOL}` +
            os.EOL +
            '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
        })
      })

    async.each(
      [
        1,
        2,
        100,
        1000,
        1000000
      ], (iteration: number): void => {
        it(`should return the expected result when the pull request iteration is '${iteration}'`, (): void => {
          // Arrange
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: string = pullRequestComments.getMetricsComment(iteration)

          // Assert
          expect(result).to.equal(
            `# Metrics for iteration ${iteration.toLocaleString()}${os.EOL}` +
            `✔ **Thanks for keeping your pull request small.**${os.EOL}` +
            `✔ **Thanks for adding tests.**${os.EOL}` +
            `||Lines${os.EOL}` +
            `-|-:${os.EOL}` +
            `Product Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `Test Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `**Subtotal**|**${Number(2000).toLocaleString()}**${os.EOL}` +
            `Ignored Code|${Number(1000).toLocaleString()}${os.EOL}` +
            `**Total**|**${Number(3000).toLocaleString()}**${os.EOL}` +
            os.EOL +
            '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
        })
      })

    it('should return the expected result when the pull request has insufficient test coverage', (): void => {
      // Arrange
      when(codeMetrics.isSufficientlyTested).thenReturn(false)
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getMetricsComment(1)

      // Assert
      expect(result).to.equal(
        `# Metrics for iteration 1${os.EOL}` +
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
        '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
    })

    it('should return the expected result when the pull request does not require a specific level of test coverage', (): void => {
      // Arrange
      when(codeMetrics.isSufficientlyTested).thenReturn(null)
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.getMetricsComment(1)

      // Assert
      expect(result).to.equal(
        `# Metrics for iteration 1${os.EOL}` +
        `✔ **Thanks for keeping your pull request small.**${os.EOL}` +
        `||Lines${os.EOL}` +
        `-|-:${os.EOL}` +
        `Product Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `Test Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `**Subtotal**|**${Number(2000).toLocaleString()}**${os.EOL}` +
        `Ignored Code|${Number(1000).toLocaleString()}${os.EOL}` +
        `**Total**|**${Number(3000).toLocaleString()}**${os.EOL}` +
        os.EOL +
        '[Metrics computed by PR Metrics. Add it to your Azure DevOps builds!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
    })
  })

  describe('getMetricsCommentStatus()', (): void => {
    async.each(
      [
        true,
        null
      ], (sufficientlyTested: boolean | null): void => {
        it(`should return Closed when the pull request is small and has sufficient test coverage '${sufficientlyTested}'`, (): void => {
          // Arrange
          when(codeMetrics.isSmall).thenReturn(true)
          when(codeMetrics.isSufficientlyTested).thenReturn(sufficientlyTested)
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: CommentThreadStatus = pullRequestComments.getMetricsCommentStatus()

          // Assert
          expect(result).to.equal(CommentThreadStatus.Closed)
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')).once()
        })
      })

    async.each(
      [
        [true, false],
        [false, true],
        [false, false],
        [false, null]
      ], (codeMetricsSettings: [boolean, boolean | null]): void => {
        it(`should return Active when the pull request small status is '${codeMetricsSettings[0]}' and the sufficient test coverage status is '${codeMetricsSettings[1]}'`, (): void => {
          // Arrange
          when(codeMetrics.isSmall).thenReturn(codeMetricsSettings[0])
          when(codeMetrics.isSufficientlyTested).thenReturn(codeMetricsSettings[1])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(inputs), instance(taskLibWrapper))

          // Act
          const result: CommentThreadStatus = pullRequestComments.getMetricsCommentStatus()

          // Assert
          expect(result).to.equal(CommentThreadStatus.Active)
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')).once()
        })
      })
  })
})
