// // Copyright (c) Microsoft Corporation.
// // Licensed under the MIT License.

// import { anyNumber, instance, mock, verify, when } from 'ts-mockito'
// import { expect } from 'chai'
// import async from 'async'
// import AzureReposInvoker from '../invokers/azureReposInvoker'
// import CodeMetricsCalculator from '../codeMetricsCalculator'
// import PullRequest from '../updaters/pullRequest'
// import PullRequestComments from '../updaters/pullRequestComments'
// import PullRequestCommentsData from '../updaters/pullRequestCommentsData'
// import TaskLibWrapper from '../wrappers/taskLibWrapper'

// describe('codeMetricsCalculator.ts', (): void => {
//   let azureReposInvoker: AzureReposInvoker
//   let pullRequest: PullRequest
//   let pullRequestComments: PullRequestComments
//   let taskLibWrapper: TaskLibWrapper

//   beforeEach((): void => {
//     azureReposInvoker = mock(AzureReposInvoker)
//     pullRequest = mock(PullRequest)
//     pullRequestComments = mock(PullRequestComments)
//     taskLibWrapper = mock(TaskLibWrapper)
//   })

//   describe('updateDetails()', (): void => {
//     it('should return the expected result', async (): Promise<void> => {
//       // Arrange
//       when(pullRequest.getUpdatedDescription('TODO')).thenReturn('TODO')
//       when(pullRequest.getUpdatedTitle('TODO')).thenReturn('S✔ ◾ TODO')
//       const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

//       // Act
//       await codeMetricsCalculator.updateDetails()

//       // Assert
//       verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateDetails()')).once()
//     })
//   })

//   describe('updateComments()', (): void => {
//     it('should return the expected result', async (): Promise<void> => {
//       // Arrange
//       when(pullRequestComments.getCommentData(anyNumber())).thenResolve(new PullRequestCommentsData([], []))
//       const codeMetricsCalculator: CodeMetricsCalculator = new CodeMetricsCalculator(instance(azureReposInvoker), instance(pullRequest), instance(pullRequestComments), instance(taskLibWrapper))

//       // Act
//       await codeMetricsCalculator.updateComments()

//       // Assert
//       verify(taskLibWrapper.debug('* CodeMetricsCalculator.updateComments()')).once()
//     })
//   })
// })
