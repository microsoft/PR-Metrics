# Dependency Management

This document describes how PR Metrics selects, obtains, and tracks its
dependencies.

## Ecosystem

PR Metrics is a [Node.js][nodejs] project written in [TypeScript][typescript].
Dependencies are managed using [npm][npm], the standard package manager for the
Node.js ecosystem.

## Selection

Dependencies are selected based on the following criteria:

- **Necessity**: Only dependencies required for core functionality or
  development tooling are included.
- **Ecosystem fit**: Well-established packages from the npm registry are
  preferred, such as [Octokit][octokit] for GitHub API access and the
  [Azure Pipelines Task SDK][azurepipelinestasksdk] for Azure DevOps
  integration.
- **Maintenance**: Actively maintained packages with responsive maintainers are
  preferred.
- **Security**: Packages with known unresolved vulnerabilities are avoided.

Dependencies are separated into production dependencies (required at runtime)
and development dependencies (required only for building, testing, and linting).

## Obtaining

Dependencies are obtained via `npm install`. The repository-root
[`.npmrc`][npmrc] file is the effective configuration for `npm install` and
`npm ci` run from the repository root, and for any pipeline that does not
override it: it configures the registry as the Microsoft Package Feed Proxy
(`https://packagefeedproxy.microsoft.io/npm/`), not
[the public npm registry][npmregistry] directly. The proxy fronts and serves
packages from the public npm ecosystem, so `npm install` and `npm ci` behave
the same as they would against npmjs.org. Other tracked `.npmrc` files exist
for narrower purposes, such as [`src/task/.npmrc`][srctasknpmrc], and are
outside the scope of this section.

Active pipeline npm restores do not directly configure `registry.npmjs.org`
either. The GitHub Actions workflows (`build.yml`, `release-initiate.yml`, and
`release-publish.yml`) run `npm ci` using the root proxy configuration as-is,
while the [Azure Pipelines build and release templates][azuredevopstemplate]
overwrite the working `.npmrc` at runtime to point at an explicit Office npm
feed (`https://pkgs.dev.azure.com/office/_packaging/Office/npm/registry/`)
instead of the proxy. All communication with the proxy and the Office feed
uses HTTPS.

During CI/CD builds, `npm ci` resolves dependencies from the lockfile, ensuring
reproducible builds.

Because the proxy and Office feed each front multiple backend hosts, the
`resolved` URLs recorded in [`package-lock.json`][packagelockjson] may
reference rotating Microsoft backend tarball hosts (matching the shard-based
routing behavior expected of these feeds) rather than a single, fixed
hostname. This is expected behavior, not a misconfiguration: the recorded
host does not need to match the registry hostname configured in the
repository-root `.npmrc`, and it must not be normalized or rewritten to a
single shard. Reproducibility and integrity are instead guaranteed by the
exact pinned versions and `integrity` hashes recorded for each package (see
[Tracking](#tracking)), which are verified on every install regardless of
which backend host served the tarball.

## Tracking

- **[`package.json`][packagejson]**: Declares all direct production and
  development dependencies with their version constraints.
- **[`package-lock.json`][packagelockjson]**: Records the exact resolved
  versions of all direct and transitive dependencies. This file is committed to
  version control to ensure deterministic builds.

## Updating

Dependencies are updated through two distinct processes:

- **GitHub Actions dependencies**: Scheduled [Dependabot][dependabot] version
  updates are configured only for this ecosystem: Dependabot monitors GitHub
  Actions workflow dependencies and opens pull requests on a quarterly
  schedule (see [`dependabot.yml`][dependabot]).
- **npm dependencies**: Scheduled Dependabot version updates are not
  configured for npm in this repository. Instead, routine npm version updates
  occur during the release process, where the
  [`release-initiate.yml`][releaseinitiate] workflow runs
  [npm-check-updates][npmcheckupdates] (`ncu`) to update all npm packages to
  their latest compatible versions. The updated `package.json` and
  `package-lock.json` are committed as part of the release pull request. Known
  npm vulnerabilities are also tracked internally through
  [Component Governance][componentgovernance]. Separately from scheduled
  version updates, [Dependabot alerts][dependabotalerts] and
  [Dependabot security updates][dependabotsecurityupdates] continue to cover
  npm vulnerabilities and may open npm pull requests to remediate them.

## Security Scanning

- [CodeQL][codeql] analyzes the codebase, including dependency usage, for
  security vulnerabilities on every pull request.
- [Dependabot alerts][dependabotalerts] notify the maintainers of known
  vulnerabilities in dependencies, and
  [Dependabot security updates][dependabotsecurityupdates] may open pull
  requests for npm packages with known vulnerabilities. This is independent of
  the scheduled, GitHub Actions-only version updates described above.
- [Gitleaks][gitleaks] scans for accidentally committed secrets via
  [Super-Linter][superlinter].

[azuredevopstemplate]: https://github.com/microsoft/PR-Metrics/blob/main/.github/azure-devops/template.yml
[azurepipelinestasksdk]: https://github.com/microsoft/azure-pipelines-task-lib
[codeql]: https://codeql.github.com/
[componentgovernance]: https://docs.opensource.microsoft.com/tools/cg/
[dependabot]: https://github.com/microsoft/PR-Metrics/blob/main/.github/dependabot.yml
[dependabotalerts]: https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts
[dependabotsecurityupdates]: https://docs.github.com/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates
[gitleaks]: https://github.com/gitleaks/gitleaks
[nodejs]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[npmcheckupdates]: https://www.npmjs.com/package/npm-check-updates
[npmrc]: https://github.com/microsoft/PR-Metrics/blob/main/.npmrc
[npmregistry]: https://registry.npmjs.org/
[octokit]: https://github.com/octokit
[packagejson]: https://github.com/microsoft/PR-Metrics/blob/main/package.json
[packagelockjson]: https://github.com/microsoft/PR-Metrics/blob/main/package-lock.json
[releaseinitiate]: https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/release-initiate.yml
[srctasknpmrc]: https://github.com/microsoft/PR-Metrics/blob/main/src/task/.npmrc
[superlinter]: https://github.com/super-linter/super-linter
[typescript]: https://www.typescriptlang.org/
