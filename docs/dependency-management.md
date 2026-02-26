# Dependency Management

This document describes how PR Metrics selects, obtains, and tracks its
dependencies.

## Ecosystem

PR Metrics is a [Node.js](https://nodejs.org/) project written in
[TypeScript](https://www.typescriptlang.org/). Dependencies are managed using
[npm](https://www.npmjs.com/), the standard package manager for the Node.js
ecosystem.

## Selection

Dependencies are selected based on the following criteria:

- **Necessity**: Only dependencies required for core functionality or
  development tooling are included.
- **Ecosystem fit**: Well-established packages from the npm registry are
  preferred, such as [Octokit](https://github.com/octokit) for GitHub API
  access and the
  [Azure Pipelines Task SDK](https://github.com/microsoft/azure-pipelines-task-lib)
  for Azure DevOps integration.
- **Maintenance**: Actively maintained packages with responsive maintainers are
  preferred.
- **Security**: Packages with known unresolved vulnerabilities are avoided.

Dependencies are separated into production dependencies (required at runtime)
and development dependencies (required only for building, testing, and linting).

## Obtaining

Dependencies are obtained from the
[npm public registry](https://registry.npmjs.org/) via `npm install`. The
[`.npmrc`](https://github.com/microsoft/PR-Metrics/blob/main/.npmrc) file
configures the registry URL. All communication with the registry uses HTTPS.

During CI/CD builds, `npm ci` or `npm install` resolves dependencies from the
lock file, ensuring reproducible builds.

## Tracking

- **[`package.json`](https://github.com/microsoft/PR-Metrics/blob/main/package.json)**:
  Declares all direct production and development dependencies with their version
  constraints.
- **[`package-lock.json`](https://github.com/microsoft/PR-Metrics/blob/main/package-lock.json)**:
  Records the exact resolved versions of all direct and transitive dependencies.
  This file is committed to version control to ensure deterministic builds.

## Updating

Dependencies are updated through two mechanisms:

- **GitHub Actions dependencies**:
  [Dependabot](https://github.com/microsoft/PR-Metrics/blob/main/.github/dependabot.yml)
  monitors GitHub Actions workflow dependencies and opens pull requests on a
  quarterly schedule.
- **npm dependencies**: During the release process, the
  [`release-initiate.yml`](https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/release-initiate.yml)
  workflow runs [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)
  (`ncu`) to update all npm packages to their latest compatible versions. The
  updated `package.json` and `package-lock.json` are committed as part of the
  release pull request.

## Security Scanning

- [CodeQL](https://codeql.github.com/) analyses the codebase, including
  dependency usage, for security vulnerabilities on every pull request.
- [Dependabot alerts](https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)
  notify the maintainers of known vulnerabilities in dependencies.
- [Gitleaks](https://github.com/gitleaks/gitleaks) scans for accidentally
  committed secrets via [Super-Linter](https://github.com/super-linter/super-linter).
