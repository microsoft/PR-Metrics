// // Copyright (c) Microsoft Corporation.
// // Licensed under the MIT License.

// import 'reflect-metadata'
// import { CommentThreadStatus, GitPullRequestCommentThread } from 'azure-devops-node-api/interfaces/GitInterfaces'
// import { expect } from 'chai'
// import { instance, mock, verify } from 'ts-mockito'
// import AzureReposInvoker from '../../src/repos/azureReposInvoker'
// import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
// import Logger from '../../src/utilities/logger'
// import PullRequestDetails from '../../src/repos/pullRequestDetails'
// import ReposInvoker from '../../src/repos/reposInvoker'

// describe('reposInvoker.ts', function (): void {
//   let azureReposInvoker: AzureReposInvoker
//   let gitHubReposInvoker: GitHubReposInvoker
//   let logger: Logger

//   beforeEach((): void => {
//     azureReposInvoker = mock(AzureReposInvoker)

//     gitHubReposInvoker = mock(GitHubReposInvoker)
//     logger = mock(Logger)
//   })

//   describe('isCommentsFunctionalityAvailable', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', (): void => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: boolean = reposInvoker.isCommentsFunctionalityAvailable

//       // Assert
//       verify(azureReposInvoker.isCommentsFunctionalityAvailable).once()
//       verify(gitHubReposInvoker.isCommentsFunctionalityAvailable).never()
//       verify(logger.logDebug('* ReposInvoker.isCommentsFunctionalityAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', (): void => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: boolean = reposInvoker.isCommentsFunctionalityAvailable

//       // Assert
//       verify(azureReposInvoker.isCommentsFunctionalityAvailable).never()
//       verify(gitHubReposInvoker.isCommentsFunctionalityAvailable).once()
//       verify(logger.logDebug('* ReposInvoker.isCommentsFunctionalityAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', (): void => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const func: () => boolean = () => reposInvoker.isCommentsFunctionalityAvailable

//       // Assert
//       expect(func).to.throw('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       verify(azureReposInvoker.isCommentsFunctionalityAvailable).never()
//       verify(gitHubReposInvoker.isCommentsFunctionalityAvailable).never()
//       verify(logger.logDebug('* ReposInvoker.isCommentsFunctionalityAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', (): void => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const func: () => boolean = () => reposInvoker.isCommentsFunctionalityAvailable

//       // Assert
//       expect(func).to.throw('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       verify(azureReposInvoker.isCommentsFunctionalityAvailable).never()
//       verify(gitHubReposInvoker.isCommentsFunctionalityAvailable).never()
//       verify(logger.logDebug('* ReposInvoker.isCommentsFunctionalityAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })

//   describe('isAccessTokenAvailable', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', (): void => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: boolean = reposInvoker.isAccessTokenAvailable

//       // Assert
//       verify(azureReposInvoker.isAccessTokenAvailable).once()
//       verify(gitHubReposInvoker.isAccessTokenAvailable).never()
//       verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', (): void => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: boolean = reposInvoker.isAccessTokenAvailable

//       // Assert
//       verify(azureReposInvoker.isAccessTokenAvailable).never()
//       verify(gitHubReposInvoker.isAccessTokenAvailable).once()
//       verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', (): void => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const func: () => boolean = () => reposInvoker.isAccessTokenAvailable

//       // Assert
//       expect(func).to.throw('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       verify(azureReposInvoker.isAccessTokenAvailable).never()
//       verify(gitHubReposInvoker.isAccessTokenAvailable).never()
//       verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', (): void => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const func: () => boolean = () => reposInvoker.isAccessTokenAvailable

//       // Assert
//       expect(func).to.throw('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       verify(azureReposInvoker.isAccessTokenAvailable).never()
//       verify(gitHubReposInvoker.isAccessTokenAvailable).never()
//       verify(logger.logDebug('* ReposInvoker.isAccessTokenAvailable')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })

//   describe('getTitleAndDescription()', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: PullRequestDetails = await reposInvoker.getTitleAndDescription()

//       // Assert
//       verify(azureReposInvoker.getTitleAndDescription()).once()
//       verify(gitHubReposInvoker.getTitleAndDescription()).never()
//       verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: PullRequestDetails = await reposInvoker.getTitleAndDescription()

//       // Assert
//       verify(azureReposInvoker.getTitleAndDescription()).never()
//       verify(gitHubReposInvoker.getTitleAndDescription()).once()
//       verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', async (): Promise<void> => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.getTitleAndDescription()
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.getTitleAndDescription()).never()
//       verify(gitHubReposInvoker.getTitleAndDescription()).never()
//       verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.getTitleAndDescription()
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.getTitleAndDescription()).never()
//       verify(gitHubReposInvoker.getTitleAndDescription()).never()
//       verify(logger.logDebug('* ReposInvoker.getTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })

//   describe('getComments()', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: GitPullRequestCommentThread[] = await reposInvoker.getComments()

//       // Assert
//       verify(azureReposInvoker.getComments()).once()
//       verify(gitHubReposInvoker.getComments()).never()
//       verify(logger.logDebug('* ReposInvoker.getComments()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       const result: GitPullRequestCommentThread[] = await reposInvoker.getComments()

//       // Assert
//       verify(azureReposInvoker.getComments()).never()
//       verify(gitHubReposInvoker.getComments()).once()
//       verify(logger.logDebug('* ReposInvoker.getComments()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//       expect(result).to.equal(null)

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', async (): Promise<void> => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.getComments()
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.getComments()).never()
//       verify(gitHubReposInvoker.getComments()).never()
//       verify(logger.logDebug('* ReposInvoker.getComments()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.getComments()
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.getComments()).never()
//       verify(gitHubReposInvoker.getComments()).never()
//       verify(logger.logDebug('* ReposInvoker.getComments()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })

//   describe('setTitleAndDescription()', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       await reposInvoker.setTitleAndDescription(null, null)

//       // Assert
//       verify(azureReposInvoker.setTitleAndDescription(null, null)).once()
//       verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never()
//       verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       await reposInvoker.setTitleAndDescription(null, null)

//       // Assert
//       verify(azureReposInvoker.setTitleAndDescription(null, null)).never()
//       verify(gitHubReposInvoker.setTitleAndDescription(null, null)).once()
//       verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', async (): Promise<void> => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.setTitleAndDescription(null, null)
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.setTitleAndDescription(null, null)).never()
//       verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never()
//       verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.setTitleAndDescription(null, null)
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.setTitleAndDescription(null, null)).never()
//       verify(gitHubReposInvoker.setTitleAndDescription(null, null)).never()
//       verify(logger.logDebug('* ReposInvoker.setTitleAndDescription()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })

//   describe('createCommentThread()', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       await reposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)

//       // Assert
//       verify(azureReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).once()
//       verify(gitHubReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).never()
//       verify(logger.logDebug('* ReposInvoker.createCommentThread()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       await reposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)

//       // Assert
//       verify(azureReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).never()
//       verify(gitHubReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).once()
//       verify(logger.logDebug('* ReposInvoker.createCommentThread()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', async (): Promise<void> => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).never()
//       verify(gitHubReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).never()
//       verify(logger.logDebug('* ReposInvoker.createCommentThread()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).never()
//       verify(gitHubReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)).never()
//       verify(logger.logDebug('* ReposInvoker.createCommentThread()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })

//   describe('setCommentThreadStatus()', (): void => {
//     it('should invoke Azure Repos when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'TfsGit'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       await reposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)

//       // Assert
//       verify(azureReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).once()
//       verify(gitHubReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).never()
//       verify(logger.logDebug('* ReposInvoker.setCommentThreadStatus()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should invoke GitHub when called from an appropriate repo', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'GitHub'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))

//       // Act
//       await reposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)

//       // Assert
//       verify(azureReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).never()
//       verify(gitHubReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).once()
//       verify(logger.logDebug('* ReposInvoker.setCommentThreadStatus()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })

//     it('should throw when the repo type is not set', async (): Promise<void> => {
//       // Arrange
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('\'BUILD_REPOSITORY_PROVIDER\', accessed within \'ReposInvoker.getReposInvoker()\', is invalid, null, or undefined \'undefined\'.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).never()
//       verify(gitHubReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).never()
//       verify(logger.logDebug('* ReposInvoker.setCommentThreadStatus()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()
//     })

//     it('should throw when the repo type is set to an invalid value', async (): Promise<void> => {
//       // Arrange
//       process.env.BUILD_REPOSITORY_PROVIDER = 'Other'
//       const reposInvoker: ReposInvoker = new ReposInvoker(instance(azureReposInvoker), instance(gitHubReposInvoker), instance(logger))
//       let errorThrown: boolean = false

//       try {
//         // Act
//         await reposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)
//       } catch (error) {
//         // Assert
//         errorThrown = true
//         expect(error.message).to.equal('BUILD_REPOSITORY_PROVIDER \'Other\' is unsupported.')
//       }

//       expect(errorThrown).to.equal(true)
//       verify(azureReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).never()
//       verify(gitHubReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)).never()
//       verify(logger.logDebug('* ReposInvoker.setCommentThreadStatus()')).once()
//       verify(logger.logDebug('* ReposInvoker.getReposInvoker()')).once()

//       // Finalization
//       delete process.env.BUILD_REPOSITORY_PROVIDER
//     })
//   })
// })
