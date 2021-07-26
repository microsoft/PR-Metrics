// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anything, deepEqual, instance, mock, verify, when } from 'ts-mockito'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import async from 'async'
import GetPullResponse from '../../src/wrappers/octokitInterfaces/getPullResponse'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import Logger from '../../src/utilities/logger'
import OctokitWrapper from '../../src/wrappers/octokitWrapper'
import PullRequestDetails from '../../src/repos/pullRequestDetails'
import PullRequestMetadata from '../../src/repos/pullRequestMetadata'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('gitHubReposInvoker.ts', function (): void {
  let logger: Logger
  let octokitWrapper: OctokitWrapper
  let taskLibWrapper: TaskLibWrapper

  let mockPullResponse: GetPullResponse

  beforeEach((): void => {
    process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions.git'
    process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = '12345'

    mockPullResponse = {
      headers: {},
      status: 200,
      url: '',
      data: {
        title: 'Title',
        body: 'Description',
        url: '',
        id: 0,
        node_id: '',
        html_url: '',
        diff_url: '',
        patch_url: '',
        issue_url: '',
        number: 0,
        state: 'open',
        locked: false,
        user: {
          login: '',
          id: 0,
          node_id: '',
          avatar_url: '',
          gravatar_id: '',
          url: '',
          html_url: '',
          followers_url: '',
          following_url: '',
          gists_url: '',
          starred_url: '',
          subscriptions_url: '',
          organizations_url: '',
          repos_url: '',
          events_url: '',
          received_events_url: '',
          type: '',
          site_admin: false
        },
        created_at: '',
        updated_at: '',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: '',
        assignee: {
          login: '',
          id: 0,
          node_id: '',
          avatar_url: '',
          gravatar_id: '',
          url: '',
          html_url: '',
          followers_url: '',
          following_url: '',
          gists_url: '',
          starred_url: '',
          subscriptions_url: '',
          organizations_url: '',
          repos_url: '',
          events_url: '',
          received_events_url: '',
          type: '',
          site_admin: false
        },
        assignees: [],
        requested_reviewers: [],
        requested_teams: [],
        labels: [],
        milestone: null,
        draft: false,
        commits_url: '',
        review_comments_url: '',
        review_comment_url: '',
        comments_url: '',
        statuses_url: '',
        head: {
          label: '',
          ref: '',
          sha: '',
          user: {
            login: '',
            id: 0,
            node_id: '',
            avatar_url: '',
            gravatar_id: '',
            url: '',
            html_url: '',
            followers_url: '',
            following_url: '',
            gists_url: '',
            starred_url: '',
            subscriptions_url: '',
            organizations_url: '',
            repos_url: '',
            events_url: '',
            received_events_url: '',
            type: '',
            site_admin: false
          },
          repo: {
            id: 0,
            node_id: '',
            name: '',
            full_name: '',
            private: false,
            owner: {
              login: '',
              id: 0,
              node_id: '',
              avatar_url: '',
              gravatar_id: '',
              url: '',
              html_url: '',
              followers_url: '',
              following_url: '',
              gists_url: '',
              starred_url: '',
              subscriptions_url: '',
              organizations_url: '',
              repos_url: '',
              events_url: '',
              received_events_url: '',
              type: '',
              site_admin: false
            },
            html_url: '',
            description: '',
            fork: false,
            url: '',
            forks_url: '',
            keys_url: '',
            collaborators_url: '',
            teams_url: '',
            hooks_url: '',
            issue_events_url: '',
            events_url: '',
            assignees_url: '',
            branches_url: '',
            tags_url: '',
            blobs_url: '',
            git_tags_url: '',
            git_refs_url: '',
            trees_url: '',
            statuses_url: '',
            languages_url: '',
            stargazers_url: '',
            contributors_url: '',
            subscribers_url: '',
            subscription_url: '',
            commits_url: '',
            git_commits_url: '',
            comments_url: '',
            issue_comment_url: '',
            contents_url: '',
            compare_url: '',
            merges_url: '',
            archive_url: '',
            downloads_url: '',
            issues_url: '',
            pulls_url: '',
            milestones_url: '',
            notifications_url: '',
            labels_url: '',
            releases_url: '',
            deployments_url: '',
            created_at: '',
            updated_at: '',
            pushed_at: '',
            git_url: '',
            ssh_url: '',
            clone_url: '',
            svn_url: '',
            homepage: '',
            size: 0,
            stargazers_count: 0,
            watchers_count: 0,
            language: '',
            has_issues: true,
            has_projects: false,
            has_downloads: true,
            has_wiki: false,
            has_pages: false,
            forks_count: 0,
            mirror_url: null,
            archived: false,
            disabled: false,
            open_issues_count: 0,
            license: {
              key: '',
              name: '',
              spdx_id: '',
              url: null,
              node_id: ''
            },
            forks: 0,
            open_issues: 0,
            watchers: 0,
            default_branch: ''
          }
        },
        base: {
          label: '',
          ref: '',
          sha: '',
          user: {
            login: '',
            id: 0,
            node_id: '',
            avatar_url: '',
            gravatar_id: '',
            url: '',
            html_url: '',
            followers_url: '',
            following_url: '',
            gists_url: '',
            starred_url: '',
            subscriptions_url: '',
            organizations_url: '',
            repos_url: '',
            events_url: '',
            received_events_url: '',
            type: '',
            site_admin: false
          },
          repo: {
            id: 0,
            node_id: '',
            name: '',
            full_name: '',
            private: false,
            owner: {
              login: '',
              id: 0,
              node_id: '',
              avatar_url: '',
              gravatar_id: '',
              url: '',
              html_url: '',
              followers_url: '',
              following_url: '',
              gists_url: '',
              starred_url: '',
              subscriptions_url: '',
              organizations_url: '',
              repos_url: '',
              events_url: '',
              received_events_url: '',
              type: '',
              site_admin: false
            },
            html_url: '',
            description: '',
            fork: false,
            url: '',
            forks_url: '',
            keys_url: '',
            collaborators_url: '',
            teams_url: '',
            hooks_url: '',
            issue_events_url: '',
            events_url: '',
            assignees_url: '',
            branches_url: '',
            tags_url: '',
            blobs_url: '',
            git_tags_url: '',
            git_refs_url: '',
            trees_url: '',
            statuses_url: '',
            languages_url: '',
            stargazers_url: '',
            contributors_url: '',
            subscribers_url: '',
            subscription_url: '',
            commits_url: '',
            git_commits_url: '',
            comments_url: '',
            issue_comment_url: '',
            contents_url: '',
            compare_url: '',
            merges_url: '',
            archive_url: '',
            downloads_url: '',
            issues_url: '',
            pulls_url: '',
            milestones_url: '',
            notifications_url: '',
            labels_url: '',
            releases_url: '',
            deployments_url: '',
            created_at: '',
            updated_at: '',
            pushed_at: '',
            git_url: '',
            ssh_url: '',
            clone_url: '',
            svn_url: '',
            homepage: '',
            size: 0,
            stargazers_count: 0,
            watchers_count: 0,
            language: '',
            has_issues: true,
            has_projects: false,
            has_downloads: true,
            has_wiki: false,
            has_pages: false,
            forks_count: 0,
            mirror_url: null,
            archived: false,
            disabled: false,
            open_issues_count: 0,
            license: {
              key: '',
              name: '',
              spdx_id: '',
              url: null,
              node_id: ''
            },
            forks: 0,
            open_issues: 0,
            watchers: 0,
            default_branch: ''
          }
        },
        _links: {
          self: {
            href: ''
          },
          html: {
            href: ''
          },
          issue: {
            href: ''
          },
          comments: {
            href: ''
          },
          review_comments: {
            href: ''
          },
          review_comment: {
            href: ''
          },
          commits: {
            href: ''
          },
          statuses: {
            href: ''
          }
        },
        author_association: 'MEMBER',
        auto_merge: null,
        active_lock_reason: null,
        merged: false,
        mergeable: true,
        rebaseable: true,
        mergeable_state: '',
        merged_by: null,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        commits: 0,
        additions: 0,
        deletions: 0,
        changed_files: 0
      }
    }

    logger = mock(Logger)

    octokitWrapper = mock(OctokitWrapper)
    when(octokitWrapper.getPull(anything())).thenResolve(mockPullResponse)
    when(octokitWrapper.updatePull(anything())).thenResolve(mockPullResponse)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.getVariable('GitHub.PAT')).thenReturn('ghp_000000000000000000000000000000000000')
  })

  afterEach((): void => {
    delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
  })

  describe('isCommentsFunctionalityAvailable', (): void => {
    it('should return false', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: boolean = gitHubReposInvoker.isCommentsFunctionalityAvailable

      // Assert
      expect(result).to.equal(false)
      verify(logger.logDebug('* GitHubReposInvoker.isCommentsFunctionalityAvailable')).once()
    })
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return true', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: boolean = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when GitHub.PAT is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          when(taskLibWrapper.getVariable('GitHub.PAT')).thenReturn(variable)
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'GitHub.PAT', accessed within 'GitHubReposInvoker.initialize()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
          } else {
            process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI', accessed within 'GitHubReposInvoker.initialize()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    async.each(
      [
        'http://github.com/microsoft/OMEX-Azure-DevOps-Extensions.git',
        'https://microsoft.com/microsoft/OMEX-Azure-DevOps-Extensions.git',
        'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions',
        'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions/.git'
      ], (variable: string): void => {
        it(`should throw when SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI is set to an invalid URL '${variable}'`, async (): Promise<void> => {
          // Arrange
          process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = variable
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI '${variable}' is in an unexpected format.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    async.each(
      [
        undefined,
        ''
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is set to the invalid value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
          } else {
            process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal(`'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER', accessed within 'GitHubReposInvoker.initialize()', is invalid, null, or undefined '${variable}'.`)
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    async.each(
      [
        'abc',
        'abc1'
      ], (variable: string | undefined): void => {
        it(`should throw when SYSTEM_PULLREQUEST_PULLREQUESTNUMBER is set to the invalid numeric value '${variable}'`, async (): Promise<void> => {
          // Arrange
          if (variable === undefined) {
            delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
          } else {
            process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = variable
          }

          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('\'this._pullRequestId\', accessed within \'GitHubReposInvoker.initialize()\', is invalid, null, or undefined \'NaN\'.')
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    it('should succeed when the inputs are valid', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.getPull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345 }))).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when called twice with the inputs valid', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.getTitleAndDescription()
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.getPull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345 }))).twice()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).twice()
    })

    it('should succeed when the description is null', async (): Promise<void> => {
      // Arrange
      const currentMockPullResponse: GetPullResponse = mockPullResponse
      currentMockPullResponse.data.body = null
      when(octokitWrapper.getPull(anything())).thenResolve(currentMockPullResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.getPull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345 }))).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(currentMockPullResponse))).once()
    })
  })

  describe('getCurrentIteration()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getCurrentIteration()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.getCurrentIteration() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.getCurrentIteration()')).once()
    })
  })

  describe('getCommentThreads()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getCommentThreads()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.getCommentThreads() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.getCommentThreads()')).once()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should succeed when the title and description are both null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.updatePull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345 }))).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when the title and description are both set', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.updatePull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345, title: 'Title', body: 'Description' }))).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when the title is set', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.updatePull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345, title: 'Title' }))).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when the description is set', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(octokitWrapper.initialize(deepEqual({ auth: 'ghp_000000000000000000000000000000000000', userAgent: 'PRMetrics/v1.1.8' }))).once()
      verify(octokitWrapper.updatePull(deepEqual({ owner: 'microsoft', repo: 'OMEX-Azure-DevOps-Extensions', pull_number: 12345, body: 'Description' }))).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })
  })

  describe('createComment()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.createComment('', 0, 0)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.createComment() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
    })
  })

  describe('createCommentThread()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.createCommentThread('', CommentThreadStatus.Active, '', false)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.createCommentThread() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.createCommentThread()')).once()
    })
  })

  describe('setCommentThreadStatus()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.setCommentThreadStatus(0, CommentThreadStatus.Active)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.setCommentThreadStatus() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.setCommentThreadStatus()')).once()
    })
  })

  describe('addMetadata()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const metadata: PullRequestMetadata[] = [
        {
          key: '',
          value: ''
        }
      ]
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.addMetadata(metadata)
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.addMetadata() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.addMetadata()')).once()
    })
  })
})
