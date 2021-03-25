// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import { FixedLengthArray } from '../../utilities/fixedLengthArray'
import { instance, mock, verify, when } from 'ts-mockito'
import async from 'async'
import AzureReposInvoker from '../../invokers/azureReposInvoker'
import CodeMetrics from '../../updaters/codeMetrics'
import CodeMetricsData from '../../updaters/codeMetricsData'
import os from 'os'
import Parameters from '../../updaters/parameters'
import PullRequestComments from '../../updaters/pullRequestComments'
import PullRequestCommentsData from '../../updaters/pullRequestCommentsData'
import TaskLibWrapper from '../../wrappers/taskLibWrapper'

describe('pullRequestComments.ts', (): void => {
  const validGitPullRequestCommentThread: GitPullRequestCommentThread =
    {
      pullRequestThreadContext: {
        trackingCriteria: {
          origFilePath: ' file.ts'
        }
      },
      comments:
      [{
        author: {
          displayName: 'Project Collection Build Service ('
        },
        content: '# Metrics for iteration 1',
        id: 1
      }],
      id: 1
    }
  let azureReposInvoker: AzureReposInvoker
  let codeMetrics: CodeMetrics
  let parameters: Parameters
  let taskLibWrapper: TaskLibWrapper

  beforeEach((): void => {
    azureReposInvoker = mock(AzureReposInvoker)
    when(azureReposInvoker.getCommentThreads()).thenResolve([validGitPullRequestCommentThread])

    codeMetrics = mock(CodeMetrics)
    when(codeMetrics.isSmall).thenReturn(true)
    when(codeMetrics.isSufficientlyTested).thenReturn(true)
    when(codeMetrics.metrics).thenReturn(new CodeMetricsData(1000, 1000, 1000))
    when(codeMetrics.ignoredFilesWithLinesAdded).thenReturn([])
    when(codeMetrics.ignoredFilesWithoutLinesAdded).thenReturn([])

    parameters = mock(Parameters)
    when(parameters.baseSize).thenReturn(250)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentFooter')).thenReturn('[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', Number(1).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(1).toLocaleString()}`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', Number(2).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(2).toLocaleString()}`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', Number(100).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(100).toLocaleString()}`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', Number(1000).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(1000).toLocaleString()}`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', Number(1000000).toLocaleString())).thenReturn(`# Metrics for iteration ${Number(1000000).toLocaleString()}`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.commentTitle', '.+')).thenReturn('# Metrics for iteration .+')
    when(taskLibWrapper.loc('updaters.pullRequestComments.fileIgnoredComment')).thenReturn('❗ **This file may not need to be reviewed.**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.largePullRequestComment', Number(250).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(250).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.largePullRequestComment', Number(1000).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(1000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.largePullRequestComment', Number(1000000).toLocaleString())).thenReturn(`❌ **Try to keep pull requests smaller than ${Number(1000000).toLocaleString()} lines of new product code by following the [Single Responsibility Principle (SRP)](https://wikipedia.org/wiki/Single-responsibility_principle).**`)
    when(taskLibWrapper.loc('updaters.pullRequestComments.smallPullRequestComment')).thenReturn('✔ **Thanks for keeping your pull request small.**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableIgnoredCode')).thenReturn('Ignored Code')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableLines')).thenReturn('Lines')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableProductCode')).thenReturn('Product Code')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableSubtotal')).thenReturn('Subtotal')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableTestCode')).thenReturn('Test Code')
    when(taskLibWrapper.loc('updaters.pullRequestComments.tableTotal')).thenReturn('Total')
    when(taskLibWrapper.loc('updaters.pullRequestComments.testsInsufficientComment')).thenReturn('⚠️ **Consider adding additional tests.**')
    when(taskLibWrapper.loc('updaters.pullRequestComments.testsSufficientComment')).thenReturn('✔ **Thanks for adding tests.**')
  })

  describe('ignoredComment', (): void => {
    it('should return the expected result', (): void => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

      // Act
      const result: string = pullRequestComments.ignoredComment

      // Assert
      expect(result).to.equal('❗ **This file may not need to be reviewed.**')
      verify(taskLibWrapper.debug('* PullRequestComments.ignoredComment')).once()
    })
  })

  describe('getCommentData()', (): void => {
    it('should return the expected result when no comment is present', async (): Promise<void> => {
      // Arrange
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isPresent).to.equal(false)
      expect(result.commentId).to.equal(null)
      expect(result.threadId).to.equal(null)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal([])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal([])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
    })

    async.each(
      [
        [1, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 100${os.EOL}`, id: 1 }, { author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [2, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 2${os.EOL}`, id: 10 }], id: 20 }]],
        [100, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 1${os.EOL}`, id: 1 }, { author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 100${os.EOL}`, id: 10 }], id: 20 }]],
        [1000000, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration ${Number(1000000).toLocaleString()}${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: 'Content', id: 1 }], id: 2 }, { comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]],
        [1, [{ comments: [{ author: { displayName: 'Name' }, id: 1 }], id: 2 }, { comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 1${os.EOL}`, id: 10 }], id: 20 }]]
      ], (data: [number, GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result when the metrics comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[1])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData(data[0])

          // Assert
          expect(result.isPresent).to.equal(true)
          expect(result.commentId).to.equal(10)
          expect(result.threadId).to.equal(20)
          expect(result.ignoredFilesWithLinesAdded).to.deep.equal([])
          expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal([])
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).atLeast(1)
        })
      })

    it('should return the expected result when the metrics comment is present but not for the current payload', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve([{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: `# Metrics for iteration 10${os.EOL}`, id: 10 }], id: 20 }])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isPresent).to.equal(false)
      expect(result.commentId).to.equal(10)
      expect(result.threadId).to.equal(20)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal([])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal([])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).once()
    })

    async.each(
      [
        [['folder/file1.ts', 'file3.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file2.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file1.ts' } }, comments: [{ author: { displayName: 'Author' }, content: '❗ **This file may not need to be reviewed.**' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file2.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file1.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: 'Content' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file2.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['folder/file1.ts', 'file3.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' fileA.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file2.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['file3.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' folder/file1.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file2.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]]
      ], (data: [string[], GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result for ignored files with lines added when the comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[1])
          when(codeMetrics.ignoredFilesWithLinesAdded).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          when(codeMetrics.ignoredFilesWithoutLinesAdded).thenReturn(['file4.ts', 'file5.ts', 'file6.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

          // Assert
          expect(result.isPresent).to.equal(false)
          expect(result.commentId).to.equal(null)
          expect(result.threadId).to.equal(null)
          expect(result.ignoredFilesWithLinesAdded).to.deep.equal(data[0])
          expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['file4.ts', 'file5.ts', 'file6.ts'])
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.getIgnoredCommentData()')).atLeast(1)
        })
      })

    async.each(
      [
        [['folder/file4.ts', 'file6.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file5.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['folder/file4.ts', 'file6.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file4.ts' } }, comments: [{ author: { displayName: 'Author' }, content: '❗ **This file may not need to be reviewed.**' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file5.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['folder/file4.ts', 'file6.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file4.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: 'Content' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file5.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['folder/file4.ts', 'file6.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' fileA.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file5.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]],
        [['file6.ts'], [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' folder/file4.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file5.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '❗ **This file may not need to be reviewed.**' }] }]]
      ], (data: [string[], GitPullRequestCommentThread[]]): void => {
        it(`should return the expected result for ignored files without lines added when the comment is present with payload '${JSON.stringify(data[1])}'`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[1])
          when(codeMetrics.ignoredFilesWithLinesAdded).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          when(codeMetrics.ignoredFilesWithoutLinesAdded).thenReturn(['folder/file4.ts', 'file5.ts', 'file6.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

          // Act
          const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

          // Assert
          expect(result.isPresent).to.equal(false)
          expect(result.commentId).to.equal(null)
          expect(result.threadId).to.equal(null)
          expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['folder/file1.ts', 'file2.ts', 'file3.ts'])
          expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(data[0])
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.getIgnoredCommentData()')).atLeast(1)
        })
      })

    it('should return the expected result when all comment types are present', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve([
        {
          comments: [
            {
              author: {
                displayName: 'Project Collection Build Service ('
              },
              content: `# Metrics for iteration 1${os.EOL}`,
              id: 10
            }
          ],
          id: 20
        },
        {
          pullRequestThreadContext: {
            trackingCriteria: {
              origFilePath: ' file2.ts'
            }
          },
          comments: [
            {
              author: {
                displayName: 'Project Collection Build Service ('
              },
              content: '❗ **This file may not need to be reviewed.**'
            }
          ]
        },
        {
          pullRequestThreadContext: {
            trackingCriteria: {
              origFilePath: ' file5.ts'
            }
          },
          comments: [
            {
              author: {
                displayName: 'Project Collection Build Service ('
              },
              content: '❗ **This file may not need to be reviewed.**'
            }
          ]
        }
      ])
      when(codeMetrics.ignoredFilesWithLinesAdded).thenReturn(['folder/file1.ts', 'file2.ts', 'file3.ts'])
      when(codeMetrics.ignoredFilesWithoutLinesAdded).thenReturn(['folder/file4.ts', 'file5.ts', 'file6.ts'])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

      // Act
      const result: PullRequestCommentsData = await pullRequestComments.getCommentData(1)

      // Assert
      expect(result.isPresent).to.equal(true)
      expect(result.commentId).to.equal(10)
      expect(result.threadId).to.equal(20)
      expect(result.ignoredFilesWithLinesAdded).to.deep.equal(['folder/file1.ts', 'file3.ts'])
      expect(result.ignoredFilesWithoutLinesAdded).to.deep.equal(['folder/file4.ts', 'file6.ts'])
      verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentData()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.getIgnoredCommentData()')).twice()
    })

    async.each(
      [
        ['commentThread[0].comments', 'getMetricsCommentData', [{ }]],
        ['commentThread[0].comments[0].author', 'getMetricsCommentData', [{ comments: [{}] }]],
        ['commentThread[0].comments[0].author.displayName', 'getMetricsCommentData', [{ comments: [{ author: {} }] }]],
        ['commentThread[0].comments[0].content', 'getMetricsCommentData', [{ comments: [{ author: { displayName: 'Project Collection Build Service (' } }] }]],
        ['commentThread[0].id', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, { author: { displayName: 'Project Collection Build Service (' }, content: '# Metrics for iteration 1' }] }]],
        ['commentThread[0].comments[0].id', 'getMetricsCommentData', [{ comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[0].comments[1].author', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, {}], id: 1 }]],
        ['commentThread[0].comments[1].author.displayName', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, { author: {} }], id: 1 }]],
        ['commentThread[0].comments[1].content', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, { author: { displayName: 'Project Collection Build Service (' } }], id: 1 }]],
        ['commentThread[0].comments[1].id', 'getMetricsCommentData', [{ comments: [validGitPullRequestCommentThread.comments![0]!, { author: { displayName: 'Project Collection Build Service (' }, content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[0].pullRequestThreadContext.trackingCriteria', 'getCommentData', [{ pullRequestThreadContext: {} }]],
        ['commentThread[0].pullRequestThreadContext.trackingCriteria.origFilePath', 'getCommentData', [{ pullRequestThreadContext: { trackingCriteria: {} } }]],
        ['commentThread[0].comments', 'getIgnoredCommentData', [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } } }]],
        ['commentThread[0].comments[0]', 'getIgnoredCommentData', [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [] }]],
        ['commentThread[0].comments[0].author', 'getIgnoredCommentData', [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [{}] }]],
        ['commentThread[0].comments[0].author.displayName', 'getIgnoredCommentData', [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [{ author: {} }] }]],
        ['commentThread[0].comments[0].content', 'getIgnoredCommentData', [{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' } }] }]],
        ['commentThread[1].comments', 'getMetricsCommentData', [validGitPullRequestCommentThread, { }]],
        ['commentThread[1].comments[0].author', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{}] }]],
        ['commentThread[1].comments[0].author.displayName', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{ author: {} }] }]],
        ['commentThread[1].comments[0].content', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{ author: { displayName: 'Project Collection Build Service (' } }] }]],
        ['commentThread[1].id', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '# Metrics for iteration 1' }] }]],
        ['commentThread[1].comments[0].id', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [{ author: { displayName: 'Project Collection Build Service (' }, content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[1].comments[1].author', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [validGitPullRequestCommentThread.comments![0]!, {}], id: 1 }]],
        ['commentThread[1].comments[1].author.displayName', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [validGitPullRequestCommentThread.comments![0]!, { author: {} }], id: 1 }]],
        ['commentThread[1].comments[1].content', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [validGitPullRequestCommentThread.comments![0]!, { author: { displayName: 'Project Collection Build Service (' } }], id: 1 }]],
        ['commentThread[1].comments[1].id', 'getMetricsCommentData', [validGitPullRequestCommentThread, { comments: [validGitPullRequestCommentThread.comments![0]!, { author: { displayName: 'Project Collection Build Service (' }, content: '# Metrics for iteration 1' }], id: 1 }]],
        ['commentThread[1].pullRequestThreadContext.trackingCriteria', 'getCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: {} }]],
        ['commentThread[1].pullRequestThreadContext.trackingCriteria.origFilePath', 'getCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: { trackingCriteria: {} } }]],
        ['commentThread[1].comments', 'getIgnoredCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } } }]],
        ['commentThread[1].comments[0]', 'getIgnoredCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [] }]],
        ['commentThread[1].comments[0].author', 'getIgnoredCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [{}] }]],
        ['commentThread[1].comments[0].author.displayName', 'getIgnoredCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [{ author: {} }] }]],
        ['commentThread[1].comments[0].content', 'getIgnoredCommentData', [validGitPullRequestCommentThread, { pullRequestThreadContext: { trackingCriteria: { origFilePath: ' file.ts' } }, comments: [{ author: { displayName: 'Project Collection Build Service (' } }] }]]
      ], (data: [string, string, GitPullRequestCommentThread[]]): void => {
        it(`should throw an error for field '${data[0]}', accessed within '${data[1]}', when it is missing`, async (): Promise<void> => {
          // Arrange
          when(azureReposInvoker.getCommentThreads()).thenResolve(data[2])
          when(codeMetrics.ignoredFilesWithLinesAdded).thenReturn(['file.ts'])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

          let exceptionThrown: boolean = false
          try {
            // Act
            await pullRequestComments.getCommentData(1)
          } catch (error) {
            // Assert
            exceptionThrown = true
            expect(error.message).to.equal(`Field '${data[0]}', accessed within 'PullRequestComments.${data[1]}()', is invalid, null, or undefined 'undefined'.`)
          }

          expect(exceptionThrown).to.equal(true)
          verify(taskLibWrapper.debug('* PullRequestComments.getCommentData()')).once()
        })
      })

    it('should throw an error when the file name is not of the expected length', async (): Promise<void> => {
      // Arrange
      when(azureReposInvoker.getCommentThreads()).thenResolve([{ pullRequestThreadContext: { trackingCriteria: { origFilePath: ' ' } } }])
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

      let exceptionThrown: boolean = false
      try {
        // Act
        await pullRequestComments.getCommentData(1)
      } catch (error) {
        // Assert
        exceptionThrown = true
        expect(error.message).to.equal('\'commentThread[0].pullRequestThreadContext.trackingCriteria.origFilePath\' \' \' is of length \'1\'.')
      }

      expect(exceptionThrown).to.equal(true)
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
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

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
            '[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
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
          when(parameters.baseSize).thenReturn(baseSize)
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

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
            '[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
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
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

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
            '[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
          verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
        })
      })

    it('should return the expected result when the pull request has insufficient test coverage', (): void => {
      // Arrange
      when(codeMetrics.isSufficientlyTested).thenReturn(false)
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

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
        '[Metrics added by PR Metrics. Add to Azure DevOps today!](https://marketplace.visualstudio.com/items?itemName=ms-omex.prmetrics)')
      verify(taskLibWrapper.debug('* PullRequestComments.getMetricsComment()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentSizeStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentTestStatus()')).once()
      verify(taskLibWrapper.debug('* PullRequestComments.addCommentMetrics()')).times(5)
    })

    it('should return the expected result when the pull request does not require a specific level of test coverage', (): void => {
      // Arrange
      when(codeMetrics.isSufficientlyTested).thenReturn(null)
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

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
      const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

      // Act
      const result: CommentThreadStatus = pullRequestComments.getMetricsCommentStatus()

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
      ], (codeMetricsSettings: [boolean, boolean | null]): void => {
        it(`should return Active when the pull request small status is '${codeMetricsSettings[0]}' and the sufficient test coverage status is '${codeMetricsSettings[1]}'`, (): void => {
          // Arrange
          when(codeMetrics.isSmall).thenReturn(codeMetricsSettings[0])
          when(codeMetrics.isSufficientlyTested).thenReturn(codeMetricsSettings[1])
          const pullRequestComments: PullRequestComments = new PullRequestComments(instance(azureReposInvoker), instance(codeMetrics), instance(parameters), instance(taskLibWrapper))

          // Act
          const result: CommentThreadStatus = pullRequestComments.getMetricsCommentStatus()

          // Assert
          expect(result).to.equal(CommentThreadStatus.Active)
          verify(taskLibWrapper.debug('* PullRequestComments.getMetricsCommentStatus()')).once()
        })
      })
  })
})
