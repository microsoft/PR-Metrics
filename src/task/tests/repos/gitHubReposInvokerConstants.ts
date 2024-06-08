/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import GetIssueCommentsResponse from '../../src/wrappers/octokitInterfaces/getIssueCommentsResponse'
import GetPullResponse from '../../src/wrappers/octokitInterfaces/getPullResponse'
import GetReviewCommentsResponse from '../../src/wrappers/octokitInterfaces/getReviewCommentsResponse'
import ListCommitsResponse from '../../src/wrappers/octokitInterfaces/listCommitsResponse'

/* eslint-disable camelcase -- Required for alignment with Octokit. */

/**
 * A mock response for the Octokit API call to get the pull request details.
 */
export const getPullResponse: GetPullResponse = {
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
        has_discussions: true,
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
        has_discussions: true,
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

/**
 * A mock response for the Octokit API call to get the list of commits.
 */
export const listCommitsResponse: ListCommitsResponse = {
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

/**
 * A mock response for the Octokit API call to get the issue comments.
 */
export const getIssueCommentsResponse: GetIssueCommentsResponse = {
  headers: {},
  status: 200,
  url: '',
  data: [
    {
      url: '',
      html_url: '',
      issue_url: '',
      id: 1,
      node_id: '',
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
        type: 'User',
        site_admin: false
      },
      created_at: '',
      updated_at: '',
      author_association: 'MEMBER',
      reactions: {
        url: '',
        total_count: 0,
        '+1': 0,
        '-1': 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0
      },
      performed_via_github_app: null
    }
  ]
}

/**
 * A mock response for the Octokit API call to get the review comments.
 */
export const getReviewCommentsResponse: GetReviewCommentsResponse = {
  headers: {},
  status: 200,
  url: '',
  data: [
    {
      url: '',
      pull_request_review_id: 0,
      id: 2,
      node_id: '',
      diff_hunk: '',
      path: 'file.ts',
      position: 1,
      original_position: 1,
      commit_id: '',
      original_commit_id: '',
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
      body: 'File Content',
      created_at: '',
      updated_at: '',
      html_url: '',
      pull_request_url: '',
      author_association: 'MEMBER',
      _links: {
        self: {
          href: ''
        },
        html: {
          href: ''
        },
        pull_request: {
          href: ''
        }
      },
      reactions: {
        url: '',
        total_count: 0,
        '+1': 0,
        '-1': 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0
      },
      start_line: null,
      original_start_line: null,
      start_side: null,
      line: 1,
      original_line: 1,
      side: 'LEFT'
    }
  ]
}
