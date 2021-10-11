// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import 'reflect-metadata'
import { anyNumber, anyString, anything, instance, mock, verify, when } from 'ts-mockito'
import { CommentThreadStatus } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { expect } from 'chai'
import async from 'async'
import ErrorWithStatus from '../wrappers/errorWithStatus'
import GetPullResponse from '../../src/wrappers/octokitInterfaces/getPullResponse'
import GitHubReposInvoker from '../../src/repos/gitHubReposInvoker'
import ListCommitsResponse from '../../src/wrappers/octokitInterfaces/listCommitsResponse'
import Logger from '../../src/utilities/logger'
import OctokitLogObject from '../wrappers/octokitLogObject'
import OctokitWrapper from '../../src/wrappers/octokitWrapper'
import PullRequestDetails from '../../src/repos/interfaces/pullRequestDetails'
import TaskLibWrapper from '../../src/wrappers/taskLibWrapper'

describe('gitHubReposInvoker.ts', function (): void {
  let logger: Logger
  let octokitWrapper: OctokitWrapper
  let taskLibWrapper: TaskLibWrapper

  let mockPullResponse: GetPullResponse
  let mockListCommitsResponse: ListCommitsResponse

  beforeEach((): void => {
    process.env.SYSTEM_ACCESSTOKEN = 'OAUTH'
    process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions'
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

    mockListCommitsResponse = {
      headers: {},
      status: 200,
      url: '',
      data:
        [
          {
            sha: 'sha54321',
            node_id: '',
            commit: {
              author: {
                name: '',
                email: '',
                date: ''
              },
              committer: {
                name: '',
                email: '',
                date: ''
              },
              message: '',
              tree: {
                sha: '',
                url: ''
              },
              url: '',
              comment_count: 0,
              verification: {
                verified: false,
                reason: '',
                signature: null,
                payload: null
              }
            },
            url: '',
            html_url: '',
            comments_url: '',
            author: {
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
            committer: {
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
            parents: [
              {
                sha: '',
                url: '',
                html_url: ''
              }
            ]
          }
        ]
    }

    logger = mock(Logger)

    octokitWrapper = mock(OctokitWrapper)
    when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenResolve(mockPullResponse)
    when(octokitWrapper.updatePull(anyString(), anyString(), anyNumber(), anyString(), anyString())).thenResolve(mockPullResponse)
    when(octokitWrapper.listCommits(anyString(), anyString(), anyNumber())).thenResolve(mockListCommitsResponse)

    taskLibWrapper = mock(TaskLibWrapper)
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.insufficientGitHubAccessTokenPermissions')).thenReturn('Could not access the resources. Ensure \'System.AccessToken\' has access to \'repos\'.')
    when(taskLibWrapper.loc('metrics.codeMetricsCalculator.noGitHubAccessToken')).thenReturn('Could not access the Personal Access Token (PAT). Add \'System.AccessToken\' as a secret environment variable with access to \'repos\'.')
  })

  afterEach((): void => {
    delete process.env.SYSTEM_ACCESSTOKEN
    delete process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI
    delete process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER
  })

  describe('isAccessTokenAvailable', (): void => {
    it('should return null when the token exists', (): void => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal(null)
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })

    it('should return a string when the token does not exist', (): void => {
      // Arrange
      delete process.env.SYSTEM_ACCESSTOKEN
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: string | null = gitHubReposInvoker.isAccessTokenAvailable

      // Assert
      expect(result).to.equal('Could not access the Personal Access Token (PAT). Add \'System.AccessToken\' as a secret environment variable with access to \'repos\'.')
      verify(logger.logDebug('* GitHubReposInvoker.isAccessTokenAvailable')).once()
    })
  })

  describe('getTitleAndDescription()', (): void => {
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
        'https://github.com/microsoft',
        'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions/git'
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
        '',
        'abc',
        'abc1'
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
            expect(error.message).to.equal('\'SYSTEM_PULLREQUEST_PULLREQUESTNUMBER\', accessed within \'GitHubReposInvoker.initialize()\', is invalid, null, or undefined \'NaN\'.')
          }

          expect(errorThrown).to.equal(true)
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    it('should succeed when the inputs are valid', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when the inputs are valid and the URL ends with \'.git\'', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://github.com/microsoft/OMEX-Azure-DevOps-Extensions.git'
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when the inputs are valid and GitHub Enterprise is in use', async (): Promise<void> => {
      // Arrange
      process.env.SYSTEM_PULLREQUEST_SOURCEREPOSITORYURI = 'https://organization.githubenterprise.com/microsoft/OMEX-Azure-DevOps-Extensions'
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.baseUrl).to.equal('https://organization.githubenterprise.com/api/v3')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('Using Base URL \'https://organization.githubenterprise.com/api/v3\'.')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when called twice with the inputs valid', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.getTitleAndDescription()
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal('Description')
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).twice()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).twice()
    })

    it('should succeed when the description is null', async (): Promise<void> => {
      // Arrange
      const currentMockPullResponse: GetPullResponse = mockPullResponse
      currentMockPullResponse.data.body = null
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenResolve(currentMockPullResponse)
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      const result: PullRequestDetails = await gitHubReposInvoker.getTitleAndDescription()

      // Assert
      expect(result.title).to.equal('Title')
      expect(result.description).to.equal(undefined)
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.getPull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(currentMockPullResponse))).once()
    })

    async.each(
      [
        401,
        403,
        404
      ], (status: number): void => {
        it(`should throw when the PAT has insufficient access and the API call returns status '${status}'`, async (): Promise<void> => {
          // Arrange
          when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
            expect(options.auth).to.equal('OAUTH')
            expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
            expect(options.log).to.not.equal(null)
            expect(options.log.debug).to.not.equal(null)
            expect(options.log.info).to.not.equal(null)
            expect(options.log.warn).to.not.equal(null)
            expect(options.log.error).to.not.equal(null)
          })
          const error: ErrorWithStatus = new ErrorWithStatus('Test')
          error.status = status
          when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenThrow(error)
          const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
          let errorThrown: boolean = false

          try {
            // Act
            await gitHubReposInvoker.getTitleAndDescription()
          } catch (error) {
            // Assert
            errorThrown = true
            expect(error.message).to.equal('Could not access the resources. Ensure \'System.AccessToken\' has access to \'repos\'.')
            expect(error.internalMessage).to.equal('Test')
          }

          expect(errorThrown).to.equal(true)
          verify(octokitWrapper.initialize(anything())).once()
          verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
          verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
        })
      })

    it('should throw an error when an error occurs', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      when(octokitWrapper.getPull(anyString(), anyString(), anyNumber())).thenThrow(Error('Error'))
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getTitleAndDescription()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('Error')
      }

      expect(errorThrown).to.equal(true)
      verify(octokitWrapper.initialize(anything())).once()
      verify(logger.logDebug('* GitHubReposInvoker.getTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
    })

    it('should initialize log object correctly', async (): Promise<void> => {
      // Arrange
      let logObject: OctokitLogObject
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => { logObject = options.log })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      await gitHubReposInvoker.getTitleAndDescription()

      // Act
      logObject!.debug('Debug Message')
      logObject!.info('Info Message')
      logObject!.warn('Warning Message')
      logObject!.error('Error Message')

      // Assert
      verify(logger.logDebug('Octokit – Debug Message')).once()
      verify(logger.logInfo('Octokit – Info Message')).once()
      verify(logger.logWarning('Octokit – Warning Message')).once()
      verify(logger.logError('Octokit – Error Message')).once()
    })
  })

  describe('getComments()', (): void => {
    it('should throw an exception', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))
      let errorThrown: boolean = false

      try {
        // Act
        await gitHubReposInvoker.getComments()
      } catch (error) {
        // Assert
        errorThrown = true
        expect(error.message).to.equal('GitHubReposInvoker.getComments() not yet implemented.')
      }

      expect(errorThrown).to.equal(true)
      verify(logger.logDebug('* GitHubReposInvoker.getComments()')).once()
    })
  })

  describe('setTitleAndDescription()', (): void => {
    it('should succeed when the title and description are both null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, null)

      // Assert
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).never()
    })

    it('should succeed when the title and description are both set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', 'Description')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Title', 'Description')).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug(JSON.stringify(mockPullResponse))).once()
    })

    it('should succeed when the title is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription('Title', null)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Title', undefined)).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should succeed when the description is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.setTitleAndDescription(null, 'Description')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updatePull('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, undefined, 'Description')).once()
      verify(logger.logDebug('* GitHubReposInvoker.setTitleAndDescription()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('createComment()', (): void => {
    it('should succeed when a file name is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })

    it('should succeed when a file name is specified and the method is called twice', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown, 'file.ts')

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.listCommits('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345)).once()
      verify(octokitWrapper.createReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content', 'file.ts', 'sha54321')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).twice()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).twice()
      verify(logger.logDebug('null')).twice()
    })

    it('should succeed when no file name is specified', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.createComment('Content', CommentThreadStatus.Unknown)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.createIssueComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 'Content')).once()
      verify(logger.logDebug('* GitHubReposInvoker.createComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('updateComment()', (): void => {
    it('should succeed when the content is null', async (): Promise<void> => {
      // Arrange
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.updateComment(null, null, 54321)

      // Assert
      verify(logger.logDebug('* GitHubReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).never()
    })

    it('should succeed when the content is set', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.updateComment('Content', null, 54321)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.updateIssueComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 12345, 54321, 'Content')).once()
      verify(logger.logDebug('* GitHubReposInvoker.updateComment()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })

  describe('deleteCommentThread()', (): void => {
    it('should succeed', async (): Promise<void> => {
      // Arrange
      when(octokitWrapper.initialize(anything())).thenCall((options?: any | undefined): void => {
        expect(options.auth).to.equal('OAUTH')
        expect(options.userAgent).to.equal('PRMetrics/v1.3.0')
        expect(options.log).to.not.equal(null)
        expect(options.log.debug).to.not.equal(null)
        expect(options.log.info).to.not.equal(null)
        expect(options.log.warn).to.not.equal(null)
        expect(options.log.error).to.not.equal(null)
      })
      const gitHubReposInvoker: GitHubReposInvoker = new GitHubReposInvoker(instance(logger), instance(octokitWrapper), instance(taskLibWrapper))

      // Act
      await gitHubReposInvoker.deleteCommentThread(54321)

      // Assert
      verify(octokitWrapper.initialize(anything())).once()
      verify(octokitWrapper.deleteReviewComment('microsoft', 'OMEX-Azure-DevOps-Extensions', 54321)).once()
      verify(logger.logDebug('* GitHubReposInvoker.deleteCommentThread()')).once()
      verify(logger.logDebug('* GitHubReposInvoker.initialize()')).once()
      verify(logger.logDebug('null')).once()
    })
  })
})
