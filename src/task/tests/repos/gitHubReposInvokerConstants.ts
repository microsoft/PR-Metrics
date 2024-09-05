/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import GetIssueCommentsResponse from "../../src/wrappers/octokitInterfaces/getIssueCommentsResponse";
import GetPullResponse from "../../src/wrappers/octokitInterfaces/getPullResponse";
import GetReviewCommentsResponse from "../../src/wrappers/octokitInterfaces/getReviewCommentsResponse";
import ListCommitsResponse from "../../src/wrappers/octokitInterfaces/listCommitsResponse";
import { StatusCodes } from "http-status-codes";

/* eslint-disable @typescript-eslint/naming-convention -- Required for alignment with Octokit. */

/**
 * A mock response for the Octokit API call to get the pull request details.
 */
export const getPullResponse: GetPullResponse = {
  data: {
    _links: {
      comments: {
        href: "",
      },
      commits: {
        href: "",
      },
      html: {
        href: "",
      },
      issue: {
        href: "",
      },
      review_comment: {
        href: "",
      },
      review_comments: {
        href: "",
      },
      self: {
        href: "",
      },
      statuses: {
        href: "",
      },
    },
    active_lock_reason: null,
    additions: 0,
    assignee: {
      avatar_url: "",
      events_url: "",
      followers_url: "",
      following_url: "",
      gists_url: "",
      gravatar_id: "",
      html_url: "",
      id: 0,
      login: "",
      node_id: "",
      organizations_url: "",
      received_events_url: "",
      repos_url: "",
      site_admin: false,
      starred_url: "",
      subscriptions_url: "",
      type: "",
      url: "",
    },
    assignees: [],
    author_association: "MEMBER",
    auto_merge: null,
    base: {
      label: "",
      ref: "",
      repo: {
        archive_url: "",
        archived: false,
        assignees_url: "",
        blobs_url: "",
        branches_url: "",
        clone_url: "",
        collaborators_url: "",
        comments_url: "",
        commits_url: "",
        compare_url: "",
        contents_url: "",
        contributors_url: "",
        created_at: "",
        default_branch: "",
        deployments_url: "",
        description: "",
        disabled: false,
        downloads_url: "",
        events_url: "",
        fork: false,
        forks: 0,
        forks_count: 0,
        forks_url: "",
        full_name: "",
        git_commits_url: "",
        git_refs_url: "",
        git_tags_url: "",
        git_url: "",
        has_discussions: true,
        has_downloads: true,
        has_issues: true,
        has_pages: false,
        has_projects: false,
        has_wiki: false,
        homepage: "",
        hooks_url: "",
        html_url: "",
        id: 0,
        issue_comment_url: "",
        issue_events_url: "",
        issues_url: "",
        keys_url: "",
        labels_url: "",
        language: "",
        languages_url: "",
        license: {
          key: "",
          name: "",
          node_id: "",
          spdx_id: "",
          url: null,
        },
        merges_url: "",
        milestones_url: "",
        mirror_url: null,
        name: "",
        node_id: "",
        notifications_url: "",
        open_issues: 0,
        open_issues_count: 0,
        owner: {
          avatar_url: "",
          events_url: "",
          followers_url: "",
          following_url: "",
          gists_url: "",
          gravatar_id: "",
          html_url: "",
          id: 0,
          login: "",
          node_id: "",
          organizations_url: "",
          received_events_url: "",
          repos_url: "",
          site_admin: false,
          starred_url: "",
          subscriptions_url: "",
          type: "",
          url: "",
        },
        private: false,
        pulls_url: "",
        pushed_at: "",
        releases_url: "",
        size: 0,
        ssh_url: "",
        stargazers_count: 0,
        stargazers_url: "",
        statuses_url: "",
        subscribers_url: "",
        subscription_url: "",
        svn_url: "",
        tags_url: "",
        teams_url: "",
        trees_url: "",
        updated_at: "",
        url: "",
        watchers: 0,
        watchers_count: 0,
      },
      sha: "",
      user: {
        avatar_url: "",
        events_url: "",
        followers_url: "",
        following_url: "",
        gists_url: "",
        gravatar_id: "",
        html_url: "",
        id: 0,
        login: "",
        node_id: "",
        organizations_url: "",
        received_events_url: "",
        repos_url: "",
        site_admin: false,
        starred_url: "",
        subscriptions_url: "",
        type: "",
        url: "",
      },
    },
    body: "Description",
    changed_files: 0,
    closed_at: null,
    comments: 0,
    comments_url: "",
    commits: 0,
    commits_url: "",
    created_at: "",
    deletions: 0,
    diff_url: "",
    draft: false,
    head: {
      label: "",
      ref: "",
      repo: {
        archive_url: "",
        archived: false,
        assignees_url: "",
        blobs_url: "",
        branches_url: "",
        clone_url: "",
        collaborators_url: "",
        comments_url: "",
        commits_url: "",
        compare_url: "",
        contents_url: "",
        contributors_url: "",
        created_at: "",
        default_branch: "",
        deployments_url: "",
        description: "",
        disabled: false,
        downloads_url: "",
        events_url: "",
        fork: false,
        forks: 0,
        forks_count: 0,
        forks_url: "",
        full_name: "",
        git_commits_url: "",
        git_refs_url: "",
        git_tags_url: "",
        git_url: "",
        has_discussions: true,
        has_downloads: true,
        has_issues: true,
        has_pages: false,
        has_projects: false,
        has_wiki: false,
        homepage: "",
        hooks_url: "",
        html_url: "",
        id: 0,
        issue_comment_url: "",
        issue_events_url: "",
        issues_url: "",
        keys_url: "",
        labels_url: "",
        language: "",
        languages_url: "",
        license: {
          key: "",
          name: "",
          node_id: "",
          spdx_id: "",
          url: null,
        },
        merges_url: "",
        milestones_url: "",
        mirror_url: null,
        name: "",
        node_id: "",
        notifications_url: "",
        open_issues: 0,
        open_issues_count: 0,
        owner: {
          avatar_url: "",
          events_url: "",
          followers_url: "",
          following_url: "",
          gists_url: "",
          gravatar_id: "",
          html_url: "",
          id: 0,
          login: "",
          node_id: "",
          organizations_url: "",
          received_events_url: "",
          repos_url: "",
          site_admin: false,
          starred_url: "",
          subscriptions_url: "",
          type: "",
          url: "",
        },
        private: false,
        pulls_url: "",
        pushed_at: "",
        releases_url: "",
        size: 0,
        ssh_url: "",
        stargazers_count: 0,
        stargazers_url: "",
        statuses_url: "",
        subscribers_url: "",
        subscription_url: "",
        svn_url: "",
        tags_url: "",
        teams_url: "",
        trees_url: "",
        updated_at: "",
        url: "",
        watchers: 0,
        watchers_count: 0,
      },
      sha: "",
      user: {
        avatar_url: "",
        events_url: "",
        followers_url: "",
        following_url: "",
        gists_url: "",
        gravatar_id: "",
        html_url: "",
        id: 0,
        login: "",
        node_id: "",
        organizations_url: "",
        received_events_url: "",
        repos_url: "",
        site_admin: false,
        starred_url: "",
        subscriptions_url: "",
        type: "",
        url: "",
      },
    },
    html_url: "",
    id: 0,
    issue_url: "",
    labels: [],
    locked: false,
    maintainer_can_modify: false,
    merge_commit_sha: "",
    mergeable: true,
    mergeable_state: "",
    merged: false,
    merged_at: null,
    merged_by: null,
    milestone: null,
    node_id: "",
    number: 0,
    patch_url: "",
    rebaseable: true,
    requested_reviewers: [],
    requested_teams: [],
    review_comment_url: "",
    review_comments: 0,
    review_comments_url: "",
    state: "open",
    statuses_url: "",
    title: "Title",
    updated_at: "",
    url: "",
    user: {
      avatar_url: "",
      events_url: "",
      followers_url: "",
      following_url: "",
      gists_url: "",
      gravatar_id: "",
      html_url: "",
      id: 0,
      login: "",
      node_id: "",
      organizations_url: "",
      received_events_url: "",
      repos_url: "",
      site_admin: false,
      starred_url: "",
      subscriptions_url: "",
      type: "",
      url: "",
    },
  },
  headers: {},
  status: StatusCodes.OK,
  url: "",
};

/**
 * A mock response for the Octokit API call to get the list of commits.
 */
export const listCommitsResponse: ListCommitsResponse = {
  data: [
    {
      author: {
        avatar_url: "",
        events_url: "",
        followers_url: "",
        following_url: "",
        gists_url: "",
        gravatar_id: "",
        html_url: "",
        id: 0,
        login: "",
        node_id: "",
        organizations_url: "",
        received_events_url: "",
        repos_url: "",
        site_admin: false,
        starred_url: "",
        subscriptions_url: "",
        type: "",
        url: "",
      },
      comments_url: "",
      commit: {
        author: {
          date: "",
          email: "",
          name: "",
        },
        comment_count: 0,
        committer: {
          date: "",
          email: "",
          name: "",
        },
        message: "",
        tree: {
          sha: "",
          url: "",
        },
        url: "",
        verification: {
          payload: null,
          reason: "",
          signature: null,
          verified: false,
        },
      },
      committer: {
        avatar_url: "",
        events_url: "",
        followers_url: "",
        following_url: "",
        gists_url: "",
        gravatar_id: "",
        html_url: "",
        id: 0,
        login: "",
        node_id: "",
        organizations_url: "",
        received_events_url: "",
        repos_url: "",
        site_admin: false,
        starred_url: "",
        subscriptions_url: "",
        type: "",
        url: "",
      },
      html_url: "",
      node_id: "",
      parents: [
        {
          html_url: "",
          sha: "",
          url: "",
        },
      ],
      sha: "sha54321",
      url: "",
    },
  ],
  headers: {},
  status: StatusCodes.OK,
  url: "",
};

/**
 * A mock response for the Octokit API call to get the issue comments.
 */
export const getIssueCommentsResponse: GetIssueCommentsResponse = {
  data: [
    {
      author_association: "MEMBER",
      created_at: "",
      html_url: "",
      id: 1,
      issue_url: "",
      node_id: "",
      performed_via_github_app: null,
      reactions: {
        "+1": 0,
        "-1": 0,
        confused: 0,
        eyes: 0,
        heart: 0,
        hooray: 0,
        laugh: 0,
        rocket: 0,
        total_count: 0,
        url: "",
      },
      updated_at: "",
      url: "",
      user: {
        avatar_url: "",
        events_url: "",
        followers_url: "",
        following_url: "",
        gists_url: "",
        gravatar_id: "",
        html_url: "",
        id: 0,
        login: "",
        node_id: "",
        organizations_url: "",
        received_events_url: "",
        repos_url: "",
        site_admin: false,
        starred_url: "",
        subscriptions_url: "",
        type: "User",
        url: "",
      },
    },
  ],
  headers: {},
  status: StatusCodes.OK,
  url: "",
};

/**
 * A mock response for the Octokit API call to get the review comments.
 */
export const getReviewCommentsResponse: GetReviewCommentsResponse = {
  data: [
    {
      _links: {
        html: {
          href: "",
        },
        pull_request: {
          href: "",
        },
        self: {
          href: "",
        },
      },
      author_association: "MEMBER",
      body: "File Content",
      commit_id: "",
      created_at: "",
      diff_hunk: "",
      html_url: "",
      id: 2,
      line: 1,
      node_id: "",
      original_commit_id: "",
      original_line: 1,
      original_position: 1,
      original_start_line: null,
      path: "file.ts",
      position: 1,
      pull_request_review_id: 0,
      pull_request_url: "",
      reactions: {
        "+1": 0,
        "-1": 0,
        confused: 0,
        eyes: 0,
        heart: 0,
        hooray: 0,
        laugh: 0,
        rocket: 0,
        total_count: 0,
        url: "",
      },
      side: "LEFT",
      start_line: null,
      start_side: null,
      updated_at: "",
      url: "",
      user: {
        avatar_url: "",
        events_url: "",
        followers_url: "",
        following_url: "",
        gists_url: "",
        gravatar_id: "",
        html_url: "",
        id: 0,
        login: "",
        node_id: "",
        organizations_url: "",
        received_events_url: "",
        repos_url: "",
        site_admin: false,
        starred_url: "",
        subscriptions_url: "",
        type: "",
        url: "",
      },
    },
  ],
  headers: {},
  status: StatusCodes.OK,
  url: "",
};

/* eslint-enable @typescript-eslint/naming-convention */
