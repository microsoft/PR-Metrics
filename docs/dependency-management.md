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

Dependencies are obtained from the [npm public registry][npmregistry] via
`npm install`. The [`.npmrc`][npmrc] file configures that registry, which is
the registry developers and the default tooling use. All communication with the
registry uses HTTPS.

During CI/CD builds, `npm ci` resolves dependencies from the lockfile, ensuring
reproducible builds.

The committed [`package-lock.json`][packagelockjson] deliberately differs from
`.npmrc`: every `resolved` URL names the anonymous 1ES public npm mirror
(`ms-feed-2`, `ms-feed-12` and `ms-feed-25` under
`1es-public/_packaging/npm-public`) rather than the public registry. The Azure
DevOps pull request pipelines build untrusted code under the CFSClean network
isolation policy, which approves that mirror and not the public registry, and
they restore anonymously with a pinned `npm ci` command that forbids registry
host substitution, so npm fetches each package from the exact URL recorded in
the lockfile. The mirror proxies the same packages, and every package remains
verified against its integrity hash, so `.npmrc` continues to resolve identical
content for developers and for the GitHub Actions workflows. The difference
between the two is deliberate policy rather than a misconfiguration.

## Tracking

- **[`package.json`][packagejson]**: Declares all direct production and
  development dependencies with their version constraints.
- **[`package-lock.json`][packagelockjson]**: Records the exact resolved
  versions of all direct and transitive dependencies. This file is committed to
  version control to ensure deterministic builds.

## Updating

Dependencies are updated through two mechanisms:

- **GitHub Actions dependencies**: [Dependabot][dependabot] monitors GitHub
  Actions workflow dependencies and opens pull requests on a quarterly schedule.
- **npm dependencies**: During the release process, the
  [`release-initiate.yml`][releaseinitiate] workflow runs
  [npm-check-updates][npmcheckupdates] (`ncu`) to update all npm packages to
  their latest compatible versions. The updated `package.json` and
  `package-lock.json` are committed as part of the release pull request, after
  the lockfile registry is normalized as described below.

## Registry Normalization

`npm update` and `ncu` regenerate the lockfile `resolved` URLs against the
registry `.npmrc` names, so a dependency update would otherwise replace the 1ES
public mirror with the public registry and strand the Azure DevOps pull request
pipelines behind the network isolation policy.

The [`normalize-package-lock-registry.mjs`][normalizescript] script restores the
policy. It rewrites only `https://registry.npmjs.org/` prefixes to the approved
anonymous mirror prefix, preserves each package suffix, integrity hash, key
ordering and the surrounding file structure, and fails on any other host rather
than silently passing it through. It rewrites a repository file only and
requires no credentials.

The [`release-initiate.yml`][releaseinitiate] workflow runs the script
immediately after `npm run update:dependencies` and before the dependency
update is committed. Run it manually after any local `npm install` or
`npm update` that alters the lockfile:

```bash
node scripts/normalize-package-lock-registry.mjs
```

Both halves of the policy are enforced by tests.
[`azurePipelinesTrustBoundary.spec.ts`][trustboundaryspec] requires every
lockfile URL to name the approved mirror and requires the release workflow to
run the normalization step, while
[`packageLockRegistryNormalization.spec.ts`][normalizationspec] covers the
script itself.

## Security Scanning

- [CodeQL][codeql] analyzes the codebase, including dependency usage, for
  security vulnerabilities on every pull request.
- [Dependabot alerts][dependabotalerts] notify the maintainers of known
  vulnerabilities in dependencies.
- [Gitleaks][gitleaks] scans for accidentally committed secrets via
  [Super-Linter][superlinter].

[azurepipelinestasksdk]: https://github.com/microsoft/azure-pipelines-task-lib
[codeql]: https://codeql.github.com/
[dependabot]: https://github.com/microsoft/PR-Metrics/blob/main/.github/dependabot.yml
[dependabotalerts]: https://docs.github.com/code-security/dependabot/dependabot-alerts/about-dependabot-alerts
[gitleaks]: https://github.com/gitleaks/gitleaks
[nodejs]: https://nodejs.org/
[normalizationspec]: https://github.com/microsoft/PR-Metrics/blob/main/src/task/tests/security/packageLockRegistryNormalization.spec.ts
[normalizescript]: https://github.com/microsoft/PR-Metrics/blob/main/scripts/normalize-package-lock-registry.mjs
[npm]: https://www.npmjs.com/
[npmcheckupdates]: https://www.npmjs.com/package/npm-check-updates
[npmrc]: https://github.com/microsoft/PR-Metrics/blob/main/.npmrc
[npmregistry]: https://registry.npmjs.org/
[octokit]: https://github.com/octokit
[packagejson]: https://github.com/microsoft/PR-Metrics/blob/main/package.json
[packagelockjson]: https://github.com/microsoft/PR-Metrics/blob/main/package-lock.json
[releaseinitiate]: https://github.com/microsoft/PR-Metrics/blob/main/.github/workflows/release-initiate.yml
[superlinter]: https://github.com/super-linter/super-linter
[trustboundaryspec]: https://github.com/microsoft/PR-Metrics/blob/main/src/task/tests/security/azurePipelinesTrustBoundary.spec.ts
[typescript]: https://www.typescriptlang.org/
