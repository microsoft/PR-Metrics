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

Dependencies are obtained via `npm install`. The checked-in npm configuration
files ([`.npmrc`][npmrc] at the repository root and
[`src/task/.npmrc`][srctasknpmrc]) both configure the registry as the Microsoft
Package Feed Proxy (`https://packagefeedproxy.microsoft.io/npm/`), not
[the public npm registry][npmregistry] directly. The repository-root file is the
effective configuration for `npm install` and `npm ci` run from the repository
root, while the `src/task/` file keeps task-local npm operations on the same
proxy. The proxy fronts and serves packages from the public npm ecosystem, so
`npm install` and `npm ci` behave the same as they would against npmjs.org.

Active pipeline npm restores do not directly configure `registry.npmjs.org`
either. The GitHub Actions workflows (`build.yml`, `release-initiate.yml`, and
`release-publish.yml`) run `npm ci` using the checked-in proxy configuration as
is, while the [Azure Pipelines build and release templates][azuredevopstemplate]
overwrite the working `.npmrc` at runtime to point at an explicit Office npm
feed (`https://pkgs.dev.azure.com/office/_packaging/Office/npm/registry/`)
instead of the proxy. All communication with the proxy and the Office feed uses
HTTPS.

During CI/CD builds, `npm ci` resolves dependencies from the lockfile, ensuring
reproducible builds. Both checked-in `.npmrc` files set
`omit-lockfile-registry-resolved=true`, so the lockfile does not record registry
tarball URLs. Reproducibility and integrity are guaranteed by the exact pinned
versions and `integrity` hashes recorded for each package (see
[Tracking](#tracking)), which npm verifies on every install.

## Tracking

- **[`package.json`][packagejson]**: Declares all direct production and
  development dependencies with their version constraints.
- **[`package-lock.json`][packagelockjson]**: Records the exact resolved
  versions of all direct and transitive dependencies. This file is committed to
  version control to ensure deterministic builds.
- **[`.github/workflows/actions.lock`][actionslock]**: Locks GitHub Actions and
  their transitive action dependencies. Build verifies this native workflow
  dependency lockfile with `gh actions-lock --verify`.

## Updating

Dependencies are updated through these processes:

- **GitHub Actions dependencies**: Scheduled [Dependabot][dependabot] version
  updates are configured only for this ecosystem: Dependabot monitors GitHub
  Actions workflow dependencies and opens pull requests on a quarterly schedule
  (see [`dependabot.yml`][dependabot]).
- **npm dependencies**: Scheduled Dependabot version updates are not configured
  for npm in this repository. Instead, routine npm version updates occur during
  the release process, where the [`release-initiate.yml`][releaseinitiate]
  workflow runs [npm-check-updates][npmcheckupdates]
  (`ncu -u --peer --reject @types/node`) to update direct dependencies toward
  the latest available versions, subject to peer-dependency filtering and the
  explicit `@types/node` exclusion, and then `npm update` to refresh transitive
  dependencies. The updated `package.json` and `package-lock.json` are committed
  as part of the release pull request. Known npm vulnerabilities are also
  tracked internally. Separately from scheduled version updates,
  [Dependabot alerts][dependabotalerts] and
  [Dependabot security updates][dependabotsecurityupdates] continue to cover npm
  vulnerabilities and may open npm pull requests to remediate them.

### CI Dependency Refresh

The [Update CI Dependencies agentic workflow][updatecidependencies] runs after a
successful `Release – Initiate` run on `main`, after the npm dependency commits
are complete. It updates action pins and supported Azure DevOps task major
versions on the existing release pull request. It also checks Node.js runtime
consistency without upgrading the runtime. Its file allowlist includes the
current PR automation workflow and `.azure-devops` pipelines.

The workflow requires exactly one open, same-repository release pull request
targeting `main`. PR title indicators do not affect selection. If no unique
release pull request exists, the workflow reports the reason without making
changes. To retry it, run the workflow from `main`:

```bash
gh workflow run update-ci-dependencies.lock.yml --ref main
```

Copilot inference uses the built-in `GITHUB_TOKEN` with
`copilot-requests: write`, so usage is billed to the organization rather than a
personal token. An organization administrator must enable **Copilot CLI** and
**Allow use of Copilot CLI billed to the organization** in Copilot policy
settings. Enterprise policies must also permit this use. See
[Copilot CLI organization billing][copilotbilling]. A personal
`COPILOT_GITHUB_TOKEN` is not required.

The agent has read-only repository access and no production signing access.
The trusted safe-output job uses the `production` environment and the
existing Azure OIDC/Key Vault signing action. The `microsoft-pr-metrics` App and
its repository installation must grant `contents: write`,
`pull_requests: write`, and **`workflows: write`**. The workflow explicitly
requests these installation-token permissions. If an App permission changes, an
installation owner must accept the change before the first run. The existing
contents permission alone cannot update workflow files. No App private key is
stored in GitHub.

The compiler currently requires a versioned action reference rather than the
native `$/` syntax. The AI workflow therefore pins the trusted signing action
to a repository commit. Update that reference and recompile if the shared
signing implementation changes. The other workflows use `$/` to select the
action from their own workflow revision.

### Workflow Lockfiles

The native [Actions workflow dependency lockfile][workflowlockfiles],
`.github/workflows/actions.lock`, is distinct from the generated agentic
workflow, `update-ci-dependencies.lock.yml`. Both are committed. The latter is
compiled from `update-ci-dependencies.md`; do not edit either generated file by
hand.

Install the pinned generators once:

```bash
gh extension install github/gh-aw --pin v1.0.1
gh extension install github/gh-actions-lock --pin v0.4.0
```

After changing the agentic workflow source, compile it first. After changing
any action references, regenerate the native dependency lockfile:

```bash
gh aw compile update-ci-dependencies
gh actions-lock --no-narrow --no-interactive
gh actions-lock --verify
```

Review any new actions or secrets before approving compiler manifest changes
with `gh aw compile update-ci-dependencies --approve`. Keep action changes and
their lockfile updates in the same commit. Dependabot also updates matching
lockfile entries when it updates an action in a locked workflow.

Build recompiles the agentic workflow and rejects stale generated output.
Super-Linter excludes the generated `.lock.yml`; the compiler validates its
schema and action pins instead.

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

[actionslock]: https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/actions.lock
[azuredevopstemplate]: https://github.com/microsoft/PR-Metrics/blob/main/.azure-devops/template.yml
[azurepipelinestasksdk]: https://github.com/microsoft/azure-pipelines-task-lib
[codeql]: https://codeql.github.com/
[copilotbilling]: https://docs.github.com/copilot/how-tos/copilot-cli/use-copilot-cli-in-actions
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
[updatecidependencies]: https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/update-ci-dependencies.md
[workflowlockfiles]: https://docs.github.com/actions/concepts/security/workflow-dependency-lockfiles
